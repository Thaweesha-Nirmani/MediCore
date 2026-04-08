const mongoose = require('mongoose');

const AppError = require('../../../core/app-error');
const saleRepository = require('../repositories/sale.repository');
const MedicineCatalog = require('../../medicines/models/medicine-master.model');
const InventoryBatch = require('../../inventory/models/inventory-batch.model');
const InventoryMovement = require('../../inventory/models/inventory-movement.model');
const { mapActor } = require('../../inventory/utils/audit');
const {
  getAvailableQuantity,
  getComputedStockStatus,
} = require('../../inventory/utils/inventory-status');
const {
  trimString,
  escapeRegex,
  roundMoney,
  roundQuantity,
  toMoney,
  toQuantity,
  normalizePaymentMethod,
  extractRawItems,
  buildSoldByLabel,
  generateBillNumber,
  moneyMatches,
} = require('../utils/sale-normalizer');
const {
  toSaleListResponse,
  toSaleDetailResponse,
  toBillingMedicineLookup,
} = require('../mappers/sale.mapper');

function mergeFilters(...filters) {
  const parts = filters.filter(Boolean);

  if (!parts.length) {
    return {};
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return { $and: parts };
}

function buildSalesSearchFilter(search) {
  const token = trimString(search);

  if (!token) {
    return null;
  }

  const regex = new RegExp(escapeRegex(token), 'i');

  return {
    $or: [
      { billNumber: regex },
      { billNo: regex },
      { customerName: regex },
      { patient: regex },
      { soldBy: regex },
      { servedBy: regex },
      { 'medicines.name': regex },
      { 'items.medicineSnapshot.name': regex },
      { 'items.medicineSnapshot.displayName': regex },
      { 'items.medicineSnapshot.barcode': regex },
    ],
  };
}

function buildStatusFilter(status) {
  const normalized = trimString(status).toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized === 'completed' || normalized === 'paid') {
    return {
      $or: [{ status: 'completed' }, { status: 'paid' }, { status: { $exists: false } }],
    };
  }

  return { status: normalized };
}

function buildDateFilter(query = {}) {
  if (!query.from && !query.to) {
    return null;
  }

  const dateFilter = {};

  if (query.from) {
    dateFilter.$gte = new Date(query.from);
  }

  if (query.to) {
    dateFilter.$lte = new Date(query.to);
  }

  return {
    $or: [{ date: dateFilter }, { createdAt: dateFilter }],
  };
}

function buildSalesSort(query = {}) {
  const allowedFields = new Set(['date', 'createdAt', 'updatedAt', 'billNumber', 'customerName', 'total']);
  const sortBy = allowedFields.has(query.sortBy) ? query.sortBy : 'date';
  const sortOrder = String(query.sortOrder || query.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;

  if (sortBy === 'date') {
    return { date: sortOrder, createdAt: sortOrder };
  }

  return { [sortBy]: sortOrder, date: -1, createdAt: -1 };
}

function resolveReorderLevel(medicine, batch = null) {
  const candidates = [
    batch?.reorderLevel,
    medicine?.reorderLevel,
    medicine?.threshold,
    medicine?.restock_threshold,
  ]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0);

  return candidates.length ? candidates[0] : 0;
}

function resolveFallbackPrice(batch, medicine) {
  const sellingPrice = Number(batch?.sellingPrice);

  if (Number.isFinite(sellingPrice) && sellingPrice >= 0) {
    return roundMoney(sellingPrice);
  }

  const medicinePrice = Number(medicine?.unitPrice ?? medicine?.price);
  return Number.isFinite(medicinePrice) && medicinePrice >= 0 ? roundMoney(medicinePrice) : null;
}

async function findMedicineOrThrow(id, session = null, { requireActive = true } = {}) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('medicineId must be a valid ObjectId reference', 422);
  }

  const filter = {
    _id: id,
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  };

  if (requireActive) {
    filter.active = { $ne: false };
  }

  let query = MedicineCatalog.findOne(filter);

  if (session) {
    query = query.session(session);
  }

  const medicine = await query;

  if (!medicine) {
    throw new AppError('Medicine not found', 404, {
      medicineId: String(id),
    });
  }

  return medicine;
}

async function findSaleOrThrow(id, session = null) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Sale id must be a valid ObjectId reference', 422);
  }

  const sale = await saleRepository.findById(id, { session });

  if (!sale) {
    throw new AppError('Sale not found', 404);
  }

  return sale;
}

async function ensureBillNumberAvailable(billNumber, session = null) {
  const existing = await saleRepository.findOne({ billNumber }, { session });

  if (existing) {
    throw new AppError('billNumber already exists', 409, {
      billNumber,
    });
  }
}

async function resolveBillNumber(requestedBillNumber, session = null) {
  const normalized = trimString(requestedBillNumber).toUpperCase();

  if (normalized) {
    await ensureBillNumberAvailable(normalized, session);
    return normalized;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const generated = generateBillNumber();
    const existing = await saleRepository.findOne({ billNumber: generated }, { session });

    if (!existing) {
      return generated;
    }
  }

  throw new AppError('Unable to generate a unique billNumber', 500);
}

async function syncMedicineInventorySnapshot(medicineId, session = null) {
  let medicineQuery = MedicineCatalog.findById(medicineId);

  if (session) {
    medicineQuery = medicineQuery.session(session);
  }

  const medicine = await medicineQuery;

  if (!medicine) {
    return;
  }

  let batchesQuery = InventoryBatch.find({
    medicineId,
    active: true,
  }).sort({ expiryDate: 1, createdAt: 1 });

  if (session) {
    batchesQuery = batchesQuery.session(session);
  }

  const batches = await batchesQuery;
  const eligibleBatches = batches
    .map((batch) => ({
      batch,
      availableQuantity: getAvailableQuantity(batch, resolveReorderLevel(medicine, batch)),
      stockStatus: getComputedStockStatus(batch, resolveReorderLevel(medicine, batch)),
    }))
    .filter((item) => item.availableQuantity > 0 && ['available', 'low_stock'].includes(item.stockStatus));

  const totalAvailable = roundQuantity(
    eligibleBatches.reduce((sum, item) => sum + Number(item.availableQuantity || 0), 0)
  );
  const nextBatch = eligibleBatches[0];

  medicine.inventorySnapshot = {
    stockOnHand: totalAvailable,
    nextExpiryDate: nextBatch?.batch?.expiryDate || null,
    batchNumber: nextBatch?.batch?.batchNumber || '',
  };
  medicine.stock = totalAvailable;
  medicine.quantity = totalAvailable;
  medicine.expiryDate = nextBatch?.batch?.expiryDate || null;
  medicine.batchNumber = nextBatch?.batch?.batchNumber || '';
  medicine.batchNo = nextBatch?.batch?.batchNumber || '';
  medicine.updatedAt = new Date();

  await medicine.save({ session });
}

function buildMedicineLookupFilter(search, includeOutOfStock) {
  const parts = [
    {
      active: { $ne: false },
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    },
  ];

  if (!includeOutOfStock) {
    parts.push({
      $or: [
        { 'inventorySnapshot.stockOnHand': { $gt: 0 } },
        { stock: { $gt: 0 } },
        { quantity: { $gt: 0 } },
      ],
    });
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    parts.push({
      $or: [
        { medicineId: regex },
        { barcode: regex },
        { name: regex },
        { displayName: regex },
        { genericName: regex },
        { generic_name: regex },
        { brandName: regex },
        { brand_name: regex },
        { category: regex },
        { searchText: regex },
      ],
    });
  }

  return mergeFilters(...parts);
}

function sortMedicineLookup(items, search) {
  if (!search) {
    return items;
  }

  const normalized = search.toLowerCase();

  return items.sort((left, right) => {
    const leftName = String(left.displayName || left.name || '').toLowerCase();
    const rightName = String(right.displayName || right.name || '').toLowerCase();
    const leftStarts = leftName.startsWith(normalized) ? 1 : 0;
    const rightStarts = rightName.startsWith(normalized) ? 1 : 0;

    if (leftStarts !== rightStarts) {
      return rightStarts - leftStarts;
    }

    return leftName.localeCompare(rightName);
  });
}

async function buildSellableLookupItems(medicines, { includeOutOfStock = false } = {}) {
  if (!medicines.length) {
    return [];
  }

  const medicineIds = medicines.map((medicine) => medicine._id);
  const batches = await InventoryBatch.find({
    medicineId: { $in: medicineIds },
    active: true,
  }).lean();
  const groupedBatches = new Map();

  for (const batch of batches) {
    const key = String(batch.medicineId);
    const current = groupedBatches.get(key) || [];
    current.push(batch);
    groupedBatches.set(key, current);
  }

  return medicines
    .map((medicine) => {
      const medicineBatches = groupedBatches.get(String(medicine._id)) || [];
      const reorderLevel = resolveReorderLevel(medicine);
      const availableQuantity = roundQuantity(
        medicineBatches.reduce(
          (sum, batch) => sum + getAvailableQuantity(batch, resolveReorderLevel(medicine, batch) || reorderLevel),
          0
        )
      );
      const nextBatch = medicineBatches
        .filter((batch) => getAvailableQuantity(batch, resolveReorderLevel(medicine, batch) || reorderLevel) > 0)
        .sort((left, right) => {
          const leftTime = left.expiryDate ? new Date(left.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
          const rightTime = right.expiryDate ? new Date(right.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
          return leftTime - rightTime;
        })[0];

      return toBillingMedicineLookup(medicine, {
        availableQuantity,
        stock: availableQuantity,
        stockStatus: availableQuantity > 0 ? 'available' : 'out_of_stock',
        nextExpiryDate: nextBatch?.expiryDate || null,
      });
    })
    .filter((item) => includeOutOfStock || item.availableQuantity > 0);
}

async function listSales(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const filter = mergeFilters(
    buildSalesSearchFilter(query.search),
    buildStatusFilter(query.status),
    buildDateFilter(query)
  );
  const sort = buildSalesSort(query);

  const [items, total] = await Promise.all([
    saleRepository.findMany(filter, {
      sort,
      skip: (page - 1) * limit,
      limit,
    }),
    saleRepository.count(filter),
  ]);

  return {
    items: items.map(toSaleListResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      filters: {
        search: query.search || '',
        status: query.status || null,
        from: query.from || null,
        to: query.to || null,
      },
    },
  };
}

async function getSaleById(id) {
  const sale = await saleRepository.findByIdLean(id);

  if (!sale) {
    throw new AppError('Sale not found', 404);
  }

  return toSaleDetailResponse(sale);
}

async function searchMedicines(query) {
  const search = trimString(query.q || query.search);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 20);
  const includeOutOfStock = String(query.includeOutOfStock || '').toLowerCase() === 'true';

  const medicines = await MedicineCatalog.find(buildMedicineLookupFilter(search, includeOutOfStock))
    .sort({ updatedAt: -1, name: 1 })
    .limit(Math.max(limit * 5, 25))
    .lean();

  const items = sortMedicineLookup(
    await buildSellableLookupItems(medicines, { includeOutOfStock }),
    search
  ).slice(0, limit);

  return {
    items,
    meta: {
      count: items.length,
      limit,
      query: search,
      includeOutOfStock,
    },
  };
}

async function getMedicineByBarcode(barcode) {
  const normalizedBarcode = trimString(barcode).toUpperCase();

  const medicine = await MedicineCatalog.findOne({
    barcode: normalizedBarcode,
    active: { $ne: false },
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  }).lean();

  if (!medicine) {
    throw new AppError('Medicine not found for barcode', 404);
  }

  const [lookup] = await buildSellableLookupItems([medicine], { includeOutOfStock: true });

  if (!lookup || lookup.availableQuantity <= 0) {
    throw new AppError('Medicine is not available for sale', 409, {
      medicineId: String(medicine._id),
      availableQuantity: 0,
    });
  }

  return lookup;
}

async function createSale(payload, user) {
  const rawItems = extractRawItems(payload);

  if (!rawItems.length) {
    throw new AppError('At least one sale item is required', 422);
  }

  const session = await mongoose.startSession();
  let createdSale = null;

  try {
    session.startTransaction();

    const now = new Date();
    const billNumber = await resolveBillNumber(payload.billNumber, session);
    const touchedMedicineIds = new Set();
    const movementDocs = [];
    const processedItems = [];
    const medicines = [];

    for (const rawItem of rawItems) {
      const medicineId = rawItem.medicineId || rawItem.medicine;
      const medicine = await findMedicineOrThrow(medicineId, session);
      const quantity = toQuantity(rawItem.quantity ?? rawItem.qty, 'quantity', {
        required: true,
      });

      let batchQuery = InventoryBatch.find({
        medicineId: medicine._id,
        active: true,
      }).sort({ expiryDate: 1, createdAt: 1 });

      batchQuery = batchQuery.session(session);

      const batches = await batchQuery;
      let remaining = quantity;
      let totalAvailable = 0;
      let fallbackPrice = null;
      const batchAllocations = [];

      for (const batch of batches) {
        const availableQuantity = getAvailableQuantity(batch, resolveReorderLevel(medicine, batch));
        totalAvailable = roundQuantity(totalAvailable + availableQuantity);

        if (availableQuantity <= 0 || remaining <= 0) {
          continue;
        }

        fallbackPrice = fallbackPrice ?? resolveFallbackPrice(batch, medicine);

        const beforeQuantity = Number(batch.quantity || 0);
        const deduction = roundQuantity(Math.min(availableQuantity, remaining));
        batch.quantity = roundQuantity(beforeQuantity - deduction);
        batch.stockStatus = getComputedStockStatus(batch, resolveReorderLevel(medicine, batch));
        batch.updatedBy = mapActor(user);
        await batch.save({ session });

        batchAllocations.push({
          inventoryId: batch._id,
          batchNumber: batch.batchNumber,
          quantity: deduction,
          location: batch.location || 'MAIN_STORE',
          expiryDate: batch.expiryDate || null,
          sellingPrice:
            batch.sellingPrice === null || batch.sellingPrice === undefined
              ? null
              : roundMoney(batch.sellingPrice),
        });

        movementDocs.push({
          inventoryId: batch._id,
          medicineId: medicine._id,
          medicineSnapshot: {
            medicineId: medicine.medicineId || '',
            name: medicine.name || medicine.displayName || '',
          },
          batchNumber: batch.batchNumber,
          type: 'sale',
          reason: `Sale completed for ${billNumber}`,
          quantityChange: -deduction,
          beforeQuantity,
          afterQuantity: batch.quantity,
          fromLocation: batch.location || 'MAIN_STORE',
          toLocation: batch.location || 'MAIN_STORE',
          metadata: {
            billNumber,
            soldAt: now,
            source: 'sales',
          },
          createdBy: mapActor(user),
        });

        remaining = roundQuantity(remaining - deduction);
      }

      if (remaining > 0) {
        throw new AppError(`Insufficient stock for ${medicine.displayName || medicine.name || 'selected medicine'}`, 409, {
          medicineId: String(medicine._id),
          requestedQuantity: quantity,
          availableQuantity: totalAvailable,
        });
      }

      const unitPrice =
        rawItem.unitPrice !== undefined || rawItem.price !== undefined
          ? toMoney(rawItem.unitPrice ?? rawItem.price, 'price', { required: true, min: 0 })
          : resolveFallbackPrice(batchAllocations[0], medicine);

      if (unitPrice === null) {
        throw new AppError('Unable to resolve price for sale item', 422, {
          medicineId: String(medicine._id),
        });
      }

      const lineTotal = roundMoney(unitPrice * quantity);
      const providedLineTotal = rawItem.lineTotal ?? rawItem.total;

      if (providedLineTotal !== undefined && !moneyMatches(providedLineTotal, lineTotal)) {
        throw new AppError('Invoice line calculation mismatch', 422, {
          medicineId: String(medicine._id),
          providedLineTotal: roundMoney(providedLineTotal),
          expectedLineTotal: lineTotal,
        });
      }

      const itemPayload = {
        medicineId: medicine._id,
        medicineSnapshot: {
          medicineId: medicine.medicineId || '',
          name: medicine.name || medicine.displayName || '',
          displayName: medicine.displayName || medicine.name || '',
          genericName: medicine.genericName || '',
          barcode: medicine.barcode || '',
          category: medicine.category || 'General',
          strength: medicine.strength || medicine.dosageStrength || '',
          dosageForm: medicine.dosageForm || '',
        },
        quantity,
        unitPrice,
        lineTotal,
        batchAllocations,
        notes: trimString(rawItem.notes) || '',
      };

      processedItems.push(itemPayload);
      medicines.push({
        medicineId: String(medicine._id),
        name: itemPayload.medicineSnapshot.name,
        quantity,
        price: unitPrice,
        lineTotal,
      });
      touchedMedicineIds.add(String(medicine._id));
    }

    const subtotal = roundMoney(processedItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const discount = toMoney(payload.discount, 'discount', { required: false, min: 0 }) || 0;
    const tax = toMoney(payload.tax, 'tax', { required: false, min: 0 }) || 0;
    const serviceFee = toMoney(payload.serviceFee, 'serviceFee', { required: false, min: 0 }) || 0;
    const total = roundMoney(subtotal + tax + serviceFee - discount);

    if (total < 0) {
      throw new AppError('Sale total cannot be negative', 422);
    }

    if (payload.subtotal !== undefined && !moneyMatches(payload.subtotal, subtotal)) {
      throw new AppError('Provided subtotal does not match server calculation', 422, {
        providedSubtotal: roundMoney(payload.subtotal),
        expectedSubtotal: subtotal,
      });
    }

    if (payload.total !== undefined && !moneyMatches(payload.total, total)) {
      throw new AppError('Provided sale total does not match server calculation', 422, {
        providedTotal: roundMoney(payload.total),
        expectedTotal: total,
      });
    }

    createdSale = await saleRepository.create(
      {
        billNumber,
        customerName: trimString(payload.customerName) || 'Walk-in Customer',
        items: processedItems,
        medicines,
        subtotal,
        tax,
        discount,
        serviceFee,
        total,
        refundTotal: 0,
        netTotal: total,
        soldBy: buildSoldByLabel(user, payload),
        servedBy: user?._id ? String(user._id) : user?.id ? String(user.id) : null,
        paymentMethod: normalizePaymentMethod(payload.paymentMethod || payload.payMethod),
        payMethod: normalizePaymentMethod(payload.payMethod || payload.paymentMethod),
        status: 'completed',
        refundStatus: 'none',
        notes: trimString(payload.notes) || '',
        source: 'pos',
        saleDate: now,
        date: now,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        createdBy: mapActor(user),
        updatedBy: mapActor(user),
        auditTrail: [
          {
            action: 'created',
            at: now,
            by: mapActor(user),
            note: 'Sale completed through mobile-ready POS API',
          },
        ],
        refunds: [],
      },
      { session }
    );

    if (movementDocs.length) {
      await InventoryMovement.insertMany(
        movementDocs.map((movement) => ({
          ...movement,
          metadata: {
            ...(movement.metadata || {}),
            saleId: createdSale._id,
          },
        })),
        { session }
      );
    }

    for (const medicineId of touchedMedicineIds) {
      await syncMedicineInventorySnapshot(medicineId, session);
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  const sale = await saleRepository.findByIdLean(createdSale._id);
  return toSaleDetailResponse(sale);
}

function getRefundableQuantity(item) {
  return roundQuantity(Number(item.quantity || 0) - Number(item.refundedQuantity || 0));
}

function findRefundItemTarget(sale, requestItem) {
  const requestedSaleItemId = trimString(requestItem.saleItemId);
  const requestedMedicineId = trimString(requestItem.medicineId);

  if (requestedSaleItemId) {
    const item = sale.items.find((candidate) => String(candidate._id) === requestedSaleItemId);

    if (!item) {
      throw new AppError('Sale item not found for refund', 404, {
        saleItemId: requestedSaleItemId,
      });
    }

    return item;
  }

  if (requestedMedicineId) {
    const matches = sale.items.filter((candidate) => String(candidate.medicineId) === requestedMedicineId);

    if (!matches.length) {
      throw new AppError('Sale item not found for refund', 404, {
        medicineId: requestedMedicineId,
      });
    }

    if (matches.length > 1) {
      throw new AppError('Refund by medicineId is ambiguous for this sale; provide saleItemId instead', 422, {
        medicineId: requestedMedicineId,
      });
    }

    return matches[0];
  }

  throw new AppError('Each refund item must include saleItemId or medicineId', 422);
}

function applyRefundState(sale) {
  const refundTotal = roundMoney(
    (Array.isArray(sale.refunds) ? sale.refunds : []).reduce(
      (sum, entry) => sum + Number(entry.refundTotal || 0),
      0
    )
  );
  const fullyRefunded =
    Array.isArray(sale.items) &&
    sale.items.length > 0 &&
    sale.items.every((item) => getRefundableQuantity(item) === 0);

  sale.refundTotal = refundTotal;
  sale.netTotal = roundMoney(Math.max(0, Number(sale.total || 0) - refundTotal));
  sale.refundStatus = fullyRefunded ? 'refunded' : refundTotal > 0 ? 'partial' : 'none';
  sale.status = fullyRefunded ? 'refunded' : refundTotal > 0 ? 'partially_refunded' : 'completed';
}

async function refundSale(id, payload, user) {
  const reason = trimString(payload.reason);

  if (!reason) {
    throw new AppError('reason is required for sale refunds', 422);
  }

  const session = await mongoose.startSession();
  let refundedSaleId = null;

  try {
    session.startTransaction();

    const sale = await findSaleOrThrow(id, session);

    if (sale.status === 'voided') {
      throw new AppError('Voided sales cannot be refunded', 422);
    }

    if (sale.status === 'refunded' && sale.refundStatus === 'refunded') {
      throw new AppError('This sale has already been fully refunded', 409);
    }

    const requestItems =
      Array.isArray(payload.items) && payload.items.length
        ? payload.items
        : sale.items.map((item) => ({
            saleItemId: String(item._id),
            quantity: getRefundableQuantity(item),
          }));
    const now = new Date();
    const refundNumber = generateBillNumber('REF');
    const touchedMedicineIds = new Set();
    const movementDocs = [];
    const refundItems = [];

    for (const requestItem of requestItems) {
      const saleItem = findRefundItemTarget(sale, requestItem);
      const refundableQuantity = getRefundableQuantity(saleItem);

      if (refundableQuantity <= 0) {
        throw new AppError('Selected sale item has no refundable quantity remaining', 409, {
          saleItemId: String(saleItem._id),
        });
      }

      const refundQuantity =
        requestItem.quantity !== undefined && requestItem.quantity !== null && requestItem.quantity !== ''
          ? toQuantity(requestItem.quantity, 'quantity', { required: true })
          : refundableQuantity;

      if (refundQuantity > refundableQuantity) {
        throw new AppError('Refund quantity exceeds the remaining refundable quantity', 422, {
          saleItemId: String(saleItem._id),
          requestedQuantity: refundQuantity,
          refundableQuantity,
        });
      }

      const medicine = await findMedicineOrThrow(saleItem.medicineId, session, {
        requireActive: false,
      });
      let remainingToRestore = refundQuantity;

      for (const allocation of saleItem.batchAllocations || []) {
        const refundableAllocationQuantity = roundQuantity(
          Number(allocation.quantity || 0) - Number(allocation.refundedQuantity || 0)
        );

        if (refundableAllocationQuantity <= 0 || remainingToRestore <= 0) {
          continue;
        }

        const restoreQuantity = roundQuantity(
          Math.min(refundableAllocationQuantity, remainingToRestore)
        );
        let batchQuery = InventoryBatch.findById(allocation.inventoryId);
        batchQuery = batchQuery.session(session);
        const batch = await batchQuery;

        if (!batch) {
          throw new AppError('Original inventory batch could not be found for refund restoration', 409, {
            inventoryId: String(allocation.inventoryId),
            saleItemId: String(saleItem._id),
          });
        }

        const beforeQuantity = Number(batch.quantity || 0);
        batch.quantity = roundQuantity(beforeQuantity + restoreQuantity);
        batch.stockStatus = getComputedStockStatus(batch, resolveReorderLevel(medicine, batch));
        batch.updatedBy = mapActor(user);
        await batch.save({ session });

        allocation.refundedQuantity = roundQuantity(
          Number(allocation.refundedQuantity || 0) + restoreQuantity
        );

        movementDocs.push({
          inventoryId: batch._id,
          medicineId: medicine._id,
          medicineSnapshot: {
            medicineId: medicine.medicineId || '',
            name: medicine.name || medicine.displayName || '',
          },
          batchNumber: batch.batchNumber,
          type: 'refund',
          reason: `Refund processed for ${sale.billNumber}: ${reason}`,
          quantityChange: restoreQuantity,
          beforeQuantity,
          afterQuantity: batch.quantity,
          fromLocation: batch.location || 'MAIN_STORE',
          toLocation: batch.location || 'MAIN_STORE',
          metadata: {
            saleId: sale._id,
            billNumber: sale.billNumber,
            refundNumber,
            source: 'sales_refund',
            refundedAt: now,
          },
          createdBy: mapActor(user),
        });

        remainingToRestore = roundQuantity(remainingToRestore - restoreQuantity);
      }

      if (remainingToRestore > 0) {
        throw new AppError('Refund could not be fully restored back into inventory', 409, {
          saleItemId: String(saleItem._id),
          remainingQuantity: remainingToRestore,
        });
      }

      saleItem.refundedQuantity = roundQuantity(
        Number(saleItem.refundedQuantity || 0) + refundQuantity
      );

      const unitPrice = roundMoney(saleItem.unitPrice ?? saleItem.price ?? 0);
      refundItems.push({
        saleItemId: saleItem._id,
        medicineId: saleItem.medicineId,
        quantity: refundQuantity,
        unitPrice,
        lineTotal: roundMoney(unitPrice * refundQuantity),
      });
      touchedMedicineIds.add(String(saleItem.medicineId));
    }

    if (!refundItems.length) {
      throw new AppError('No refundable items were supplied', 422);
    }

    sale.refunds = Array.isArray(sale.refunds) ? sale.refunds : [];
    sale.refunds.push({
      refundNumber,
      reason,
      notes: trimString(payload.notes) || '',
      refundTotal: roundMoney(refundItems.reduce((sum, item) => sum + item.lineTotal, 0)),
      items: refundItems,
      createdBy: mapActor(user),
      createdAt: now,
    });
    sale.updatedBy = mapActor(user);
    sale.auditTrail = Array.isArray(sale.auditTrail) ? sale.auditTrail : [];
    sale.auditTrail.push({
      action: 'refunded',
      at: now,
      by: mapActor(user),
      note: reason,
    });
    applyRefundState(sale);

    await saleRepository.save(sale, { session });

    if (movementDocs.length) {
      await InventoryMovement.insertMany(movementDocs, { session });
    }

    for (const medicineId of touchedMedicineIds) {
      await syncMedicineInventorySnapshot(medicineId, session);
    }

    await session.commitTransaction();
    refundedSaleId = sale._id;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  const sale = await saleRepository.findByIdLean(refundedSaleId);
  return toSaleDetailResponse(sale);
}

module.exports = {
  listSales,
  getSaleById,
  createSale,
  refundSale,
  searchMedicines,
  getMedicineByBarcode,
};
