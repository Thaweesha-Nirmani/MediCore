const mongoose = require('mongoose');

const AppError = require('../../../core/app-error');
const inventoryService = require('../../inventory/services/inventory.service');
const MedicineCatalog = require('../../medicines/models/medicine-master.model');
const { mapActor } = require('../../inventory/utils/audit');
const supplierService = require('../../suppliers/services/supplier.service');
const purchaseRepository = require('../repositories/purchase.repository');
const { toPurchaseResponse } = require('../mappers/purchase.mapper');
const {
  trimString,
  toNumber,
  toDate,
  ensureDateOrder,
  normalizeOrderStatus,
  generatePurchaseNumber,
} = require('../utils/purchase-normalizer');
const {
  deriveItemStatus,
  deriveReceiveStatus,
  deriveOrderStatus,
  assertManualStatusTransition,
} = require('../utils/purchase-status');

function baseFilter({ includeDeleted = false } = {}) {
  return includeDeleted ? {} : { isDeleted: false };
}

function getPurchaseSort(query = {}) {
  const allowedSortFields = new Set(['createdAt', 'updatedAt', 'purchaseDate', 'purchaseNumber', 'totalAmount']);
  const sortBy = allowedSortFields.has(query.sortBy) ? query.sortBy : 'purchaseDate';
  const sortOrder = String(query.sortOrder || query.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;

  return { [sortBy]: sortOrder, createdAt: -1 };
}

async function findMedicineOrThrow(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('medicineId must be a valid ObjectId reference', 422);
  }

  const medicine = await MedicineCatalog.findOne({
    _id: id,
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  }).lean();

  if (!medicine) {
    throw new AppError('Referenced medicine was not found', 404);
  }

  return medicine;
}

async function buildItems(items, currentItems = []) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('At least one purchase item is required', 422);
  }

  const processed = [];

  for (const rawItem of items) {
    const medicine = await findMedicineOrThrow(rawItem.medicineId);
    const current = currentItems.find((item) => String(item._id) === String(rawItem.id || rawItem._id || ''));
    const orderedQuantity = toNumber(
      rawItem.orderedQuantity ?? rawItem.quantity,
      'orderedQuantity',
      { required: true, min: 0.000001 }
    );
    const receivedQuantity = current?.receivedQuantity || 0;

    if (orderedQuantity < receivedQuantity) {
      throw new AppError('orderedQuantity cannot be lower than already received quantity', 422, {
        medicineId: String(medicine._id),
      });
    }

    const unitCost = toNumber(rawItem.unitCost ?? rawItem.costPrice, 'unitCost', { required: true, min: 0.000001 });
    const sellingPrice = toNumber(rawItem.sellingPrice, 'sellingPrice', { required: false, min: 0 });

    processed.push({
      _id: current?._id,
      medicineId: medicine._id,
      medicineSnapshot: {
        medicineId: medicine.medicineId || '',
        name: medicine.name || medicine.displayName || '',
        displayName: medicine.displayName || medicine.name || '',
        genericName: medicine.genericName || '',
      },
      orderedQuantity,
      receivedQuantity,
      unitCost,
      sellingPrice,
      subtotal: orderedQuantity * unitCost,
      status: deriveItemStatus({
        orderedQuantity,
        receivedQuantity,
      }),
      notes: trimString(rawItem.notes) || '',
    });
  }

  return processed;
}

async function generateUniquePurchaseNumber() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const purchaseNumber = generatePurchaseNumber();
    const existing = await purchaseRepository.findLeanOne({ purchaseNumber });

    if (!existing) {
      return purchaseNumber;
    }
  }

  throw new AppError('Unable to generate a unique purchase number', 500);
}

async function getPurchaseOrThrow(id, { allowDeleted = false } = {}) {
  const purchase = await purchaseRepository.findById(id);

  if (!purchase || (!allowDeleted && purchase.isDeleted)) {
    throw new AppError('Purchase not found', 404);
  }

  return purchase;
}

function buildPurchaseFilter(query, supplierIds = null) {
  const filter = baseFilter({
    includeDeleted: String(query.includeDeleted || '').toLowerCase() === 'true',
  });

  if (query.supplierId) {
    filter.supplierId = query.supplierId;
  }

  if (query.orderStatus) {
    filter.orderStatus = query.orderStatus;
  }

  if (query.receiveStatus) {
    filter.receiveStatus = query.receiveStatus;
  }

  if (query.purchaseDateFrom || query.purchaseDateTo) {
    filter.purchaseDate = {};

    if (query.purchaseDateFrom) {
      filter.purchaseDate.$gte = new Date(query.purchaseDateFrom);
    }

    if (query.purchaseDateTo) {
      filter.purchaseDate.$lte = new Date(query.purchaseDateTo);
    }
  }

  const search = trimString(query.search);

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const searchConditions = [
      { purchaseNumber: regex },
      { 'supplierSnapshot.name': regex },
      { 'items.medicineSnapshot.name': regex },
      { 'items.medicineSnapshot.displayName': regex },
    ];

    if (supplierIds?.length) {
      searchConditions.push({ supplierId: { $in: supplierIds } });
    }

    filter.$or = searchConditions;
  }

  return filter;
}

async function buildSearchSupplierIds(search) {
  if (!search) {
    return null;
  }

  const supplierResult = await supplierService.listSuppliers({
    search,
    page: 1,
    limit: 50,
    includeDeleted: false,
  });

  return supplierResult.items.map((item) => item.id);
}

async function listPurchases(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const sort = getPurchaseSort(query);
  const supplierIds = await buildSearchSupplierIds(query.search);
  const filter = buildPurchaseFilter(query, supplierIds);

  const [items, total] = await Promise.all([
    purchaseRepository.findMany(filter, {
      sort,
      skip: (page - 1) * limit,
      limit,
      populate: true,
    }),
    purchaseRepository.count(filter),
  ]);

  return {
    items: items.map(toPurchaseResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getPurchaseById(id) {
  const purchase = await purchaseRepository.findByIdLean(id, { populate: true });

  if (!purchase || purchase.isDeleted) {
    throw new AppError('Purchase not found', 404);
  }

  return toPurchaseResponse(purchase);
}

async function createPurchase(payload, user) {
  const supplierId = payload.supplierId || payload.supplier;
  const supplier = await supplierService.findActiveSupplierOrThrow(supplierId);
  const purchaseDate = toDate(payload.purchaseDate, 'purchaseDate', { required: true });
  const expectedDeliveryDate = toDate(payload.expectedDeliveryDate, 'expectedDeliveryDate');

  ensureDateOrder(purchaseDate, expectedDeliveryDate);

  const items = await buildItems(payload.items);
  const receiveStatus = deriveReceiveStatus(items);
  const requestedStatus = normalizeOrderStatus(payload.orderStatus, 'placed');

  if (!['draft', 'placed'].includes(requestedStatus)) {
    throw new AppError('New purchases can only start as draft or placed', 422);
  }

  const orderStatus = deriveOrderStatus(requestedStatus, receiveStatus);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  const purchase = await purchaseRepository.create({
    purchaseNumber: trimString(payload.purchaseNumber)?.toUpperCase() || await generateUniquePurchaseNumber(),
    supplierId,
    supplierSnapshot: {
      name: supplier.name || '',
      contactNumber: supplier.contactNumber || '',
      email: supplier.email || '',
    },
    purchaseDate,
    expectedDeliveryDate,
    orderStatus,
    receiveStatus,
    items,
    totalAmount,
    notes: trimString(payload.notes) || '',
    active: true,
    isDeleted: false,
    createdBy: mapActor(user),
    updatedBy: mapActor(user),
  });

  const populated = await purchaseRepository.findByIdLean(purchase._id, { populate: true });
  return toPurchaseResponse(populated);
}

async function updatePurchase(id, payload, user) {
  const purchase = await getPurchaseOrThrow(id);
  const hasReceipts = purchase.items.some((item) => item.receivedQuantity > 0);
  const supplierId = payload.supplierId || payload.supplier || String(purchase.supplierId);
  const supplier = await supplierService.findActiveSupplierOrThrow(supplierId, {
    allowInactive: supplierId === String(purchase.supplierId),
  });

  const purchaseDate =
    payload.purchaseDate !== undefined ? toDate(payload.purchaseDate, 'purchaseDate', { required: true }) : purchase.purchaseDate;
  const expectedDeliveryDate =
    payload.expectedDeliveryDate !== undefined
      ? toDate(payload.expectedDeliveryDate, 'expectedDeliveryDate')
      : purchase.expectedDeliveryDate;

  ensureDateOrder(purchaseDate, expectedDeliveryDate);

  const nextStatus = payload.orderStatus ? normalizeOrderStatus(payload.orderStatus, purchase.orderStatus) : purchase.orderStatus;
  assertManualStatusTransition(purchase.orderStatus, nextStatus, { hasReceipts });

  let items = purchase.items;

  if (payload.items) {
    if (hasReceipts) {
      throw new AppError('Purchase items cannot be replaced after receiving has started', 422);
    }

    items = await buildItems(payload.items, purchase.items);
  } else if (nextStatus === 'cancelled') {
    items = purchase.items.map((item) => ({
      ...item.toObject(),
      status: 'cancelled',
    }));
  }

  if (nextStatus === 'cancelled' && payload.items) {
    items = items.map((item) => ({
      ...item,
      status: 'cancelled',
    }));
  }

  const receiveStatus = deriveReceiveStatus(items);
  const orderStatus = nextStatus === 'cancelled' ? 'cancelled' : deriveOrderStatus(nextStatus, receiveStatus);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  purchase.supplierId = supplierId;
  purchase.supplierSnapshot = {
    name: supplier.name || '',
    contactNumber: supplier.contactNumber || '',
    email: supplier.email || '',
  };
  purchase.purchaseDate = purchaseDate;
  purchase.expectedDeliveryDate = expectedDeliveryDate;
  purchase.orderStatus = orderStatus;
  purchase.receiveStatus = receiveStatus;
  purchase.items = items;
  purchase.totalAmount = totalAmount;
  purchase.notes = payload.notes !== undefined ? trimString(payload.notes) || '' : purchase.notes;
  purchase.updatedBy = mapActor(user);

  if (orderStatus === 'cancelled') {
    purchase.active = false;
    purchase.isDeleted = true;
    purchase.deletedAt = purchase.deletedAt || new Date();
    purchase.deletedBy = purchase.deletedBy || mapActor(user);
  } else {
    purchase.active = true;
    purchase.isDeleted = false;
    purchase.deletedAt = null;
    purchase.deletedBy = null;
  }

  const updated = await purchaseRepository.save(purchase);
  const populated = await purchaseRepository.findByIdLean(updated._id, { populate: true });
  return toPurchaseResponse(populated);
}

async function receivePurchase(id, payload, user) {
  const purchase = await getPurchaseOrThrow(id);

  if (purchase.orderStatus === 'cancelled') {
    throw new AppError('Cancelled purchases cannot be received', 422);
  }

  const receivedAt = toDate(payload.receivedAt, 'receivedAt') || new Date();
  const eventItems = [];

  for (const rawReceipt of payload.items || []) {
    const itemId = rawReceipt.purchaseItemId || rawReceipt.itemId;
    const purchaseItem = purchase.items.id(itemId);

    if (!purchaseItem) {
      throw new AppError('Purchase item not found for receiving', 404, {
        purchaseItemId: itemId,
      });
    }

    const quantityReceived = toNumber(rawReceipt.quantityReceived, 'quantityReceived', {
      required: true,
      min: 0.000001,
    });
    const remaining = purchaseItem.orderedQuantity - purchaseItem.receivedQuantity;

    if (quantityReceived > remaining) {
      throw new AppError('Received quantity cannot exceed remaining purchase quantity', 422, {
        purchaseItemId: String(purchaseItem._id),
        remainingQuantity: remaining,
      });
    }

    const inventoryItem = await inventoryService.createInventory(
      {
        medicineId: purchaseItem.medicineId,
        batchNumber: rawReceipt.batchNumber,
        quantity: quantityReceived,
        expiryDate: rawReceipt.expiryDate,
        manufactureDate: rawReceipt.manufactureDate,
        purchasePrice: rawReceipt.purchasePrice ?? purchaseItem.unitCost,
        sellingPrice: rawReceipt.sellingPrice ?? purchaseItem.sellingPrice,
        location: rawReceipt.location,
        supplierId: purchase.supplierId,
        mergeIfExists: rawReceipt.mergeIfExists !== false,
        notes: trimString(rawReceipt.notes) || `Received from ${purchase.purchaseNumber}`,
      },
      user
    );

    purchaseItem.receivedQuantity += quantityReceived;
    purchaseItem.status = deriveItemStatus(purchaseItem);

    eventItems.push({
      purchaseItemId: purchaseItem._id,
      medicineId: purchaseItem.medicineId,
      inventoryId: inventoryItem.id,
      batchNumber: String(rawReceipt.batchNumber).trim().toUpperCase(),
      quantityReceived,
      expiryDate: toDate(rawReceipt.expiryDate, 'expiryDate', { required: true }),
      manufactureDate: toDate(rawReceipt.manufactureDate, 'manufactureDate'),
      location: trimString(rawReceipt.location)?.toUpperCase() || 'MAIN_STORE',
      purchasePrice: toNumber(rawReceipt.purchasePrice ?? purchaseItem.unitCost, 'purchasePrice', {
        required: true,
        min: 0.000001,
      }),
      sellingPrice: toNumber(rawReceipt.sellingPrice ?? purchaseItem.sellingPrice, 'sellingPrice', {
        required: false,
        min: 0,
      }),
      notes: trimString(rawReceipt.notes) || '',
    });
  }

  purchase.receiveStatus = deriveReceiveStatus(purchase.items);
  purchase.orderStatus = deriveOrderStatus(purchase.orderStatus, purchase.receiveStatus);
  purchase.updatedBy = mapActor(user);
  purchase.active = purchase.orderStatus !== 'cancelled';
  purchase.receivingEvents.push({
    receivedAt,
    receivedBy: mapActor(user),
    notes: trimString(payload.notes) || '',
    items: eventItems,
  });

  const updated = await purchaseRepository.save(purchase);
  const populated = await purchaseRepository.findByIdLean(updated._id, { populate: true });
  return toPurchaseResponse(populated);
}

module.exports = {
  listPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  receivePurchase,
};
