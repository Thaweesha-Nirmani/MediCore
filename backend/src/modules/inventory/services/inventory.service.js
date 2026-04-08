const mongoose = require('mongoose');

const AppError = require('../../../core/app-error');
const inventoryRepository = require('../repositories/inventory.repository');
const movementRepository = require('../repositories/inventory-movement.repository');
const MedicineCatalog = require('../../medicines/models/medicine-master.model');
const Supplier = require('../../suppliers/models/supplier.model');
const {
  trimString,
  toNumber,
  toDate,
  normalizeLocation,
  ensureDateOrder,
  normalizeBatchNumber,
} = require('../utils/inventory-normalizer');
const {
  getComputedStockStatus,
  getAvailableQuantity,
  daysToExpire,
  getExpiryBucket,
} = require('../utils/inventory-status');
const { mapActor } = require('../utils/audit');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function baseFilter({ includeArchived = false } = {}) {
  return includeArchived ? {} : { active: true };
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

async function findSupplierOrThrow(id) {
  if (!id) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('supplierId must be a valid ObjectId reference', 422);
  }

  const supplier = await Supplier.findById(id).lean();

  if (!supplier) {
    throw new AppError('Referenced supplier was not found', 404);
  }

  return supplier;
}

function resolveReorderLevel(entry, medicine) {
  const medicineThreshold = Number(
    medicine?.threshold ??
      medicine?.restock_threshold ??
      medicine?.reorderLevel ??
      entry?.reorderLevel
  );

  if (Number.isFinite(medicineThreshold) && medicineThreshold >= 0) {
    return medicineThreshold;
  }

  const fallback = Number(entry?.reorderLevel);
  return Number.isFinite(fallback) && fallback >= 0 ? fallback : 10;
}

function resolveSellingPrice(value, medicine, fallback = null) {
  if (value !== null && value !== undefined) {
    return value;
  }

  if (fallback !== null && fallback !== undefined) {
    return fallback;
  }

  const medicinePrice = Number(medicine?.unitPrice);
  return Number.isFinite(medicinePrice) && medicinePrice >= 0 ? medicinePrice : null;
}

function getInventorySort(query = {}) {
  const allowedSortFields = new Set(['createdAt', 'updatedAt', 'expiryDate', 'quantity', 'location', 'batchNumber']);
  const sortBy = allowedSortFields.has(query.sortBy) ? query.sortBy : 'expiryDate';
  const sortOrder = String(query.sortOrder || query.order || 'asc').toLowerCase() === 'desc' ? -1 : 1;

  if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
    return { [sortBy]: sortOrder };
  }

  return { [sortBy]: sortOrder, createdAt: -1 };
}

function serializeBatch(entry) {
  const medicine = entry.medicineId && typeof entry.medicineId === 'object' ? entry.medicineId : null;
  const reorderLevel = resolveReorderLevel(entry, medicine);
  const stockStatus = getComputedStockStatus(entry, reorderLevel);
  const availableQuantity = getAvailableQuantity(entry, reorderLevel);
  const expiryStatus = getExpiryBucket(entry.expiryDate);

  return {
    id: String(entry._id),
    medicineId: medicine?._id ? String(medicine._id) : String(entry.medicineId),
    medicine: medicine
      ? {
          id: String(medicine._id),
          medicineId: medicine.medicineId || '',
          name: medicine.name || medicine.displayName || '',
          displayName: medicine.displayName || medicine.name || '',
          category: medicine.category || 'General',
          strength: medicine.strength || medicine.dosageStrength || '',
          dosageForm: medicine.dosageForm || '',
        }
      : null,
    batchNumber: entry.batchNumber,
    quantity: Number(entry.quantity || 0),
    availableQuantity,
    expiryDate: entry.expiryDate || null,
    manufactureDate: entry.manufactureDate || null,
    purchasePrice: Number(entry.purchasePrice || 0),
    sellingPrice: entry.sellingPrice === null || entry.sellingPrice === undefined ? null : Number(entry.sellingPrice),
    location: entry.location || 'MAIN_STORE',
    supplierId: entry.supplierId ? String(entry.supplierId) : null,
    reorderLevel,
    stockStatus,
    expiryStatus,
    expiryBucket: expiryStatus,
    daysToExpire: daysToExpire(entry.expiryDate),
    notes: entry.notes || '',
    active: entry.active !== false,
    audit: {
      createdAt: entry.createdAt || null,
      updatedAt: entry.updatedAt || null,
      createdBy: entry.createdBy || null,
      updatedBy: entry.updatedBy || null,
      archivedAt: entry.archivedAt || null,
    },
    createdAt: entry.createdAt || null,
    updatedAt: entry.updatedAt || null,
  };
}

async function recordMovement({
  inventoryId,
  medicine,
  batchNumber,
  type,
  reason,
  quantityChange,
  beforeQuantity,
  afterQuantity,
  fromLocation = '',
  toLocation = '',
  metadata = {},
  user,
}) {
  return movementRepository.create({
    inventoryId,
    medicineId: medicine._id,
    medicineSnapshot: {
      medicineId: medicine.medicineId || '',
      name: medicine.name || medicine.displayName || '',
    },
    batchNumber,
    type,
    reason,
    quantityChange,
    beforeQuantity,
    afterQuantity,
    fromLocation,
    toLocation,
    metadata,
    createdBy: mapActor(user),
  });
}

async function syncMedicineInventorySnapshot(medicineId) {
  const medicine = await MedicineCatalog.findById(medicineId);

  if (!medicine) {
    return;
  }

  const batches = await inventoryRepository.findMany(
    { medicineId, active: true },
    { sort: { expiryDate: 1 }, skip: 0, limit: 500 }
  );

  const reorderLevel = resolveReorderLevel({}, medicine.toObject());
  const eligibleBatches = batches
    .map((entry) => ({
      entry,
      availableQuantity: getAvailableQuantity(entry, reorderLevel),
      stockStatus: getComputedStockStatus(entry, reorderLevel),
    }))
    .filter((item) => item.availableQuantity > 0 && ['available', 'low_stock'].includes(item.stockStatus));

  const totalAvailable = eligibleBatches.reduce((sum, item) => sum + item.availableQuantity, 0);
  const nextBatch = eligibleBatches.sort((left, right) => {
    const leftTime = left.entry.expiryDate ? new Date(left.entry.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right.entry.expiryDate ? new Date(right.entry.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  })[0];
  const fallbackBatch = batches.sort((left, right) => {
    const leftTime = left.expiryDate ? new Date(left.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right.expiryDate ? new Date(right.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  })[0];
  const snapshotBatch = nextBatch?.entry || fallbackBatch || null;

  medicine.inventorySnapshot = {
    stockOnHand: totalAvailable,
    nextExpiryDate: snapshotBatch?.expiryDate || null,
    batchNumber: snapshotBatch?.batchNumber || '',
  };
  medicine.stock = totalAvailable;
  medicine.quantity = totalAvailable;
  medicine.expiryDate = snapshotBatch?.expiryDate || null;
  medicine.batchNumber = snapshotBatch?.batchNumber || '';
  medicine.batchNo = snapshotBatch?.batchNumber || '';

  await medicine.save();
}

async function buildSearchMedicineIds(search) {
  if (!search) {
    return null;
  }

  const regex = new RegExp(escapeRegex(search), 'i');
  const medicines = await MedicineCatalog.find({
    $or: [
      { medicineId: regex },
      { name: regex },
      { displayName: regex },
      { searchText: regex },
      { genericName: regex },
      { brandName: regex },
      { category: regex },
    ],
  })
    .select('_id')
    .limit(100)
    .lean();

  return medicines.map((medicine) => medicine._id);
}

function buildInventoryFilter(query, medicineIds = null) {
  const filter = baseFilter({
    includeArchived: String(query.includeArchived || '').toLowerCase() === 'true',
  });

  if (query.medicineId) {
    filter.medicineId = query.medicineId;
  }

  if (query.location) {
    filter.location = normalizeLocation(query.location);
  }

  if (query.batchNumber) {
    filter.batchNumber = normalizeBatchNumber(query.batchNumber);
  }

  if (medicineIds?.length) {
    filter.$or = [
      { medicineId: { $in: medicineIds } },
      { batchNumber: new RegExp(escapeRegex(query.search), 'i') },
      { location: new RegExp(escapeRegex(query.search), 'i') },
    ];
  } else if (query.search) {
    filter.$or = [
      { batchNumber: new RegExp(escapeRegex(query.search), 'i') },
      { location: new RegExp(escapeRegex(query.search), 'i') },
    ];
  }

  return filter;
}

async function listInventory(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const medicineIds = await buildSearchMedicineIds(query.search);
  const filter = buildInventoryFilter(query, medicineIds);
  const sort = getInventorySort(query);
  const stockStatus = trimString(query.stockStatus);

  if (stockStatus) {
    const entries = await inventoryRepository.findMany(filter, {
      sort,
      skip: 0,
      limit: 5000,
      populate: true,
    });

    const filteredItems = entries
      .map(serializeBatch)
      .filter((item) => item.stockStatus === stockStatus);

    return {
      items: filteredItems.slice((page - 1) * limit, page * limit),
      meta: {
        page,
        limit,
        total: filteredItems.length,
        totalPages: Math.ceil(filteredItems.length / limit) || 1,
      },
    };
  }

  const [entries, total] = await Promise.all([
    inventoryRepository.findMany(filter, {
      sort,
      skip: (page - 1) * limit,
      limit,
      populate: true,
    }),
    inventoryRepository.count(filter),
  ]);

  const items = entries.map(serializeBatch);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getInventoryById(id) {
  const entry = await inventoryRepository.findByIdLean(id, { populate: true });

  if (!entry) {
    throw new AppError('Inventory batch not found', 404);
  }

  return serializeBatch(entry);
}

async function createInventory(payload, user) {
  const medicine = await findMedicineOrThrow(payload.medicineId);
  await findSupplierOrThrow(payload.supplierId);

  const batchNumber = normalizeBatchNumber(payload.batchNumber);
  const location = normalizeLocation(payload.location);
  const quantity = toNumber(payload.quantity, 'quantity', { required: true, min: 0 });
  const expiryDate = toDate(payload.expiryDate, 'expiryDate', { required: true });
  const manufactureDate = toDate(payload.manufactureDate, 'manufactureDate');
  const purchasePrice = toNumber(payload.purchasePrice, 'purchasePrice', { required: true, min: 0 });
  const sellingPrice = resolveSellingPrice(
    toNumber(payload.sellingPrice, 'sellingPrice', { required: false, min: 0 }),
    medicine
  );
  const reorderLevel = toNumber(payload.reorderLevel, 'reorderLevel', { required: false, min: 0 });
  const notes = trimString(payload.notes) || '';

  ensureDateOrder(manufactureDate, expiryDate);

  const duplicate = await inventoryRepository.findOne({
    medicineId: payload.medicineId,
    batchNumber,
    location,
    active: true,
  });

  if (duplicate) {
    if (payload.mergeIfExists !== true) {
      throw new AppError('An active batch with this medicineId, batchNumber, and location already exists', 409, {
        medicineId: payload.medicineId,
        batchNumber,
        location,
      });
    }

    const beforeQuantity = duplicate.quantity;
    duplicate.quantity += quantity;
    duplicate.expiryDate = expiryDate;
    duplicate.manufactureDate = manufactureDate;
    duplicate.purchasePrice = purchasePrice;
    duplicate.sellingPrice = resolveSellingPrice(sellingPrice, medicine, duplicate.sellingPrice);
    duplicate.supplierId = payload.supplierId || null;
    duplicate.notes = notes;
    duplicate.reorderLevel = reorderLevel ?? duplicate.reorderLevel;
    duplicate.updatedBy = mapActor(user);
    duplicate.stockStatus = getComputedStockStatus(duplicate, resolveReorderLevel(duplicate, medicine));

    const merged = await inventoryRepository.save(duplicate);
    await recordMovement({
      inventoryId: merged._id,
      medicine,
      batchNumber,
      type: 'add',
      reason: 'Merged duplicate batch into existing inventory record',
      quantityChange: quantity,
      beforeQuantity,
      afterQuantity: merged.quantity,
      fromLocation: location,
      toLocation: location,
      user,
    });
    await syncMedicineInventorySnapshot(medicine._id);

    return serializeBatch(await inventoryRepository.findByIdLean(merged._id, { populate: true }));
  }

  const entry = await inventoryRepository.create({
    medicineId: payload.medicineId,
    batchNumber,
    quantity,
    expiryDate,
    manufactureDate,
    purchasePrice,
    sellingPrice,
    location,
    supplierId: payload.supplierId || null,
    reorderLevel: reorderLevel ?? resolveReorderLevel({}, medicine),
    stockStatus: getComputedStockStatus({ quantity, expiryDate, active: true }, reorderLevel ?? resolveReorderLevel({}, medicine)),
    notes,
    active: true,
    createdBy: mapActor(user),
    updatedBy: mapActor(user),
  });

  await recordMovement({
    inventoryId: entry._id,
    medicine,
    batchNumber,
    type: 'add',
    reason: 'Inventory batch created',
    quantityChange: quantity,
    beforeQuantity: 0,
    afterQuantity: quantity,
    fromLocation: location,
    toLocation: location,
    user,
  });
  await syncMedicineInventorySnapshot(medicine._id);

  return serializeBatch(await inventoryRepository.findByIdLean(entry._id, { populate: true }));
}

async function updateInventory(id, payload, user) {
  const entry = await inventoryRepository.findById(id);

  if (!entry) {
    throw new AppError('Inventory batch not found', 404);
  }

  if (payload.medicineId && String(payload.medicineId) !== String(entry.medicineId)) {
    throw new AppError('medicineId cannot be changed for an existing inventory batch', 422);
  }

  const medicine = await findMedicineOrThrow(entry.medicineId);
  await findSupplierOrThrow(payload.supplierId);

  const nextBatchNumber = payload.batchNumber ? normalizeBatchNumber(payload.batchNumber) : entry.batchNumber;
  const nextLocation = payload.location ? normalizeLocation(payload.location) : entry.location;

  if (nextBatchNumber !== entry.batchNumber || nextLocation !== entry.location) {
    const duplicate = await inventoryRepository.findLeanOne({
      _id: { $ne: entry._id },
      medicineId: entry.medicineId,
      batchNumber: nextBatchNumber,
      location: nextLocation,
      active: true,
    });

    if (duplicate) {
      throw new AppError('Another active batch already uses this medicineId, batchNumber, and location', 409, {
        medicineId: String(entry.medicineId),
        batchNumber: nextBatchNumber,
        location: nextLocation,
      });
    }
  }

  const nextQuantity = payload.quantity !== undefined ? toNumber(payload.quantity, 'quantity', { min: 0 }) : entry.quantity;
  const nextExpiryDate = payload.expiryDate ? toDate(payload.expiryDate, 'expiryDate', { required: true }) : entry.expiryDate;
  const nextManufactureDate = payload.manufactureDate ? toDate(payload.manufactureDate, 'manufactureDate') : entry.manufactureDate;
  const nextPurchasePrice = payload.purchasePrice !== undefined ? toNumber(payload.purchasePrice, 'purchasePrice', { min: 0 }) : entry.purchasePrice;
  const nextSellingPrice = payload.sellingPrice !== undefined ? toNumber(payload.sellingPrice, 'sellingPrice', { min: 0 }) : entry.sellingPrice;
  const nextReorderLevel = payload.reorderLevel !== undefined ? toNumber(payload.reorderLevel, 'reorderLevel', { min: 0 }) : entry.reorderLevel;

  ensureDateOrder(nextManufactureDate, nextExpiryDate);

  const beforeQuantity = entry.quantity;
  const beforeLocation = entry.location;
  const afterQuantity = nextQuantity;
  const quantityChanged = beforeQuantity !== afterQuantity;

  if (quantityChanged && !trimString(payload.adjustmentReason)) {
    throw new AppError('adjustmentReason is required when quantity changes through PATCH', 422);
  }

  entry.batchNumber = nextBatchNumber;
  entry.location = nextLocation;
  entry.quantity = nextQuantity;
  entry.expiryDate = nextExpiryDate;
  entry.manufactureDate = nextManufactureDate;
  entry.purchasePrice = nextPurchasePrice;
  entry.sellingPrice = nextSellingPrice;
  entry.supplierId = payload.supplierId || entry.supplierId || null;
  entry.reorderLevel = nextReorderLevel;
  entry.notes = payload.notes !== undefined ? trimString(payload.notes) || '' : entry.notes;
  entry.updatedBy = mapActor(user);
  entry.stockStatus = getComputedStockStatus(entry, resolveReorderLevel(entry, medicine));

  const updated = await inventoryRepository.save(entry);

  await recordMovement({
    inventoryId: updated._id,
    medicine,
    batchNumber: updated.batchNumber,
    type: quantityChanged ? 'adjust' : 'update',
    reason: trimString(payload.adjustmentReason) || 'Inventory metadata updated',
    quantityChange: afterQuantity - beforeQuantity,
    beforeQuantity,
    afterQuantity,
    fromLocation: beforeLocation,
    toLocation: updated.location,
    metadata: { updatedVia: 'patch' },
    user,
  });
  await syncMedicineInventorySnapshot(medicine._id);

  return serializeBatch(await inventoryRepository.findByIdLean(updated._id, { populate: true }));
}

async function adjustInventory(payload, user) {
  const entry = await inventoryRepository.findById(payload.inventoryId);

  if (!entry) {
    throw new AppError('Inventory batch not found', 404);
  }

  const medicine = await findMedicineOrThrow(entry.medicineId);
  const reason = trimString(payload.reason);

  if (!reason) {
    throw new AppError('reason is required for stock adjustments', 422);
  }

  const action = trimString(payload.action)?.toLowerCase() || 'correction';

  if (action === 'transfer') {
    const quantityToTransfer = toNumber(payload.quantityChange, 'quantityChange', {
      required: true,
      min: 0.000001,
    });
    const toLocation = normalizeLocation(payload.toLocation);

    if (toLocation === entry.location) {
      throw new AppError('toLocation must be different from the current location', 422);
    }

    if (quantityToTransfer > entry.quantity) {
      throw new AppError('Transfer quantity cannot exceed the current batch quantity', 422);
    }

    const sourceBefore = entry.quantity;
    const sourceLocation = entry.location;
    entry.quantity -= quantityToTransfer;
    entry.updatedBy = mapActor(user);
    entry.stockStatus = getComputedStockStatus(entry, resolveReorderLevel(entry, medicine));
    const updatedSource = await inventoryRepository.save(entry);

    let target = await inventoryRepository.findOne({
      medicineId: entry.medicineId,
      batchNumber: entry.batchNumber,
      location: toLocation,
      active: true,
    });

    let targetBefore = 0;

    if (target) {
      targetBefore = target.quantity;
      target.quantity += quantityToTransfer;
      target.updatedBy = mapActor(user);
      target.stockStatus = getComputedStockStatus(target, resolveReorderLevel(target, medicine));
      target = await inventoryRepository.save(target);
    } else {
      target = await inventoryRepository.create({
        medicineId: entry.medicineId,
        batchNumber: entry.batchNumber,
        quantity: quantityToTransfer,
        expiryDate: entry.expiryDate,
        manufactureDate: entry.manufactureDate,
        purchasePrice: entry.purchasePrice,
        sellingPrice: entry.sellingPrice,
        location: toLocation,
        supplierId: entry.supplierId || null,
        reorderLevel: entry.reorderLevel,
        stockStatus: getComputedStockStatus(
          { quantity: quantityToTransfer, expiryDate: entry.expiryDate, active: true },
          resolveReorderLevel(entry, medicine)
        ),
        notes: entry.notes || '',
        active: true,
        createdBy: mapActor(user),
        updatedBy: mapActor(user),
      });
    }

    await movementRepository.createMany([
      {
        inventoryId: updatedSource._id,
        medicineId: medicine._id,
        medicineSnapshot: {
          medicineId: medicine.medicineId || '',
          name: medicine.name || medicine.displayName || '',
        },
        batchNumber: entry.batchNumber,
        type: 'transfer_out',
        reason,
        quantityChange: -quantityToTransfer,
        beforeQuantity: sourceBefore,
        afterQuantity: updatedSource.quantity,
        fromLocation: sourceLocation,
        toLocation,
        metadata: { action: 'transfer' },
        createdBy: mapActor(user),
      },
      {
        inventoryId: target._id,
        medicineId: medicine._id,
        medicineSnapshot: {
          medicineId: medicine.medicineId || '',
          name: medicine.name || medicine.displayName || '',
        },
        batchNumber: entry.batchNumber,
        type: 'transfer_in',
        reason,
        quantityChange: quantityToTransfer,
        beforeQuantity: targetBefore,
        afterQuantity: target.quantity,
        fromLocation: sourceLocation,
        toLocation,
        metadata: { action: 'transfer' },
        createdBy: mapActor(user),
      },
    ]);

    await syncMedicineInventorySnapshot(medicine._id);

    return {
      source: serializeBatch(await inventoryRepository.findByIdLean(updatedSource._id, { populate: true })),
      target: serializeBatch(await inventoryRepository.findByIdLean(target._id, { populate: true })),
    };
  }

  const explicitNewQuantity =
    payload.newQuantity !== undefined && payload.newQuantity !== null && payload.newQuantity !== '';
  const requestedNewQuantity = explicitNewQuantity
    ? toNumber(payload.newQuantity, 'newQuantity', { required: true, min: 0 })
    : null;
  const requestedQuantityChange = explicitNewQuantity
    ? null
    : toNumber(payload.quantityChange, 'quantityChange', {
        required: true,
        min: action === 'correction' ? null : 0.000001,
      });

  if (!explicitNewQuantity && ['increase', 'decrease', 'damage', 'dispose'].includes(action) && requestedQuantityChange <= 0) {
    throw new AppError('quantityChange must be greater than 0 for this adjustment action', 422);
  }

  let delta;
  let nextQuantity;

  if (explicitNewQuantity) {
    nextQuantity = requestedNewQuantity;
    delta = requestedNewQuantity - entry.quantity;

    if (action === 'increase' && requestedNewQuantity < entry.quantity) {
      throw new AppError('newQuantity cannot be lower than the current quantity for an increase action', 422);
    }

    if (['decrease', 'damage', 'dispose'].includes(action) && requestedNewQuantity > entry.quantity) {
      throw new AppError('newQuantity cannot exceed the current quantity for this adjustment action', 422);
    }
  } else {
    switch (action) {
      case 'increase':
        delta = requestedQuantityChange;
        break;
      case 'decrease':
      case 'damage':
      case 'dispose':
        delta = -requestedQuantityChange;
        break;
      case 'correction':
      default:
        delta = requestedQuantityChange;
        break;
    }

    nextQuantity = entry.quantity + delta;
  }

  if (nextQuantity < 0) {
    throw new AppError('Inventory quantity cannot become negative', 422);
  }

  const beforeQuantity = entry.quantity;
  entry.quantity = nextQuantity;
  entry.updatedBy = mapActor(user);

  if (action === 'dispose' && nextQuantity === 0) {
    entry.stockStatus = 'disposed';
    entry.active = false;
    entry.archivedAt = new Date();
  } else {
    entry.stockStatus = getComputedStockStatus(entry, resolveReorderLevel(entry, medicine));
  }

  const updated = await inventoryRepository.save(entry);

  await recordMovement({
    inventoryId: updated._id,
    medicine,
    batchNumber: updated.batchNumber,
    type: action === 'dispose' ? 'dispose' : 'adjust',
    reason,
    quantityChange: nextQuantity - beforeQuantity,
    beforeQuantity,
    afterQuantity: nextQuantity,
    fromLocation: updated.location,
    toLocation: updated.location,
    metadata: { action },
    user,
  });
  await syncMedicineInventorySnapshot(medicine._id);

  return serializeBatch(await inventoryRepository.findByIdLean(updated._id, { populate: true }));
}

async function listMovements(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
  const filter = {};

  if (query.medicineId) {
    filter.medicineId = query.medicineId;
  }

  if (query.inventoryId) {
    filter.inventoryId = query.inventoryId;
  }

  if (query.type) {
    filter.type = query.type;
  }

  const [items, total] = await Promise.all([
    movementRepository.findMany(filter, {
      sort: { createdAt: -1 },
      skip: (page - 1) * limit,
      limit,
    }),
    movementRepository.count(filter),
  ]);

  return {
    items: items.map((item) => ({
      id: String(item._id),
      inventoryId: String(item.inventoryId),
      medicineId: String(item.medicineId),
      medicine: item.medicineSnapshot || null,
      batchNumber: item.batchNumber,
      type: item.type,
      reason: item.reason,
      quantityChange: item.quantityChange,
      beforeQuantity: item.beforeQuantity,
      afterQuantity: item.afterQuantity,
      fromLocation: item.fromLocation || '',
      toLocation: item.toLocation || '',
      metadata: item.metadata || {},
      createdBy: item.createdBy || null,
      createdAt: item.createdAt || null,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getLowStockAlerts() {
  const batches = await inventoryRepository.findMany(
    { active: true },
    { sort: { expiryDate: 1 }, skip: 0, limit: 1000, populate: true }
  );

  const grouped = new Map();

  for (const entry of batches) {
    const medicine = entry.medicineId;
    const threshold = resolveReorderLevel(entry, medicine);
    const availableQuantity = getAvailableQuantity(entry, threshold);
    const key = String(medicine?._id || entry.medicineId);

    if (!grouped.has(key)) {
      grouped.set(key, {
        medicine: medicine
          ? {
              id: String(medicine._id),
              medicineId: medicine.medicineId || '',
              name: medicine.name || medicine.displayName || '',
              displayName: medicine.displayName || medicine.name || '',
              category: medicine.category || 'General',
            }
          : null,
        threshold,
        totalAvailableQuantity: 0,
        batches: [],
      });
    }

    const item = grouped.get(key);
    item.totalAvailableQuantity += availableQuantity;
    item.threshold = Math.max(item.threshold, threshold);
    item.batches.push(serializeBatch(entry));
  }

  const alerts = Array.from(grouped.values())
    .filter((item) => item.totalAvailableQuantity <= item.threshold)
    .map((item) => ({
      ...item,
      alertLevel:
        item.totalAvailableQuantity === 0
          ? 'out_of_stock'
          : item.totalAvailableQuantity <= Math.max(1, Math.floor(item.threshold / 2))
            ? 'critical'
            : 'low',
    }))
    .sort((left, right) => left.totalAvailableQuantity - right.totalAvailableQuantity);

  return {
    items: alerts,
    summary: {
      totalAlerts: alerts.length,
      critical: alerts.filter((item) => item.alertLevel === 'critical').length,
      outOfStock: alerts.filter((item) => item.alertLevel === 'out_of_stock').length,
    },
  };
}

async function getExpiryView() {
  const entries = await inventoryRepository.findMany(
    { active: true },
    { sort: { expiryDate: 1 }, skip: 0, limit: 1000, populate: true }
  );

  const items = entries.map(serializeBatch);

  return {
    expired: items.filter((item) => item.expiryBucket === 'expired'),
    expiringIn7Days: items.filter((item) => item.expiryBucket === 'expiring_in_7_days'),
    expiringIn30Days: items.filter((item) => item.expiryBucket === 'expiring_in_30_days'),
    summary: {
      expired: items.filter((item) => item.expiryBucket === 'expired').length,
      expiringIn7Days: items.filter((item) => item.expiryBucket === 'expiring_in_7_days').length,
      expiringIn30Days: items.filter((item) => item.expiryBucket === 'expiring_in_30_days').length,
    },
  };
}

async function getInventoryByMedicine(medicineId, query) {
  await findMedicineOrThrow(medicineId);

  return listInventory({
    ...query,
    medicineId,
  });
}

module.exports = {
  listInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  adjustInventory,
  listMovements,
  getLowStockAlerts,
  getExpiryView,
  getInventoryByMedicine,
};
