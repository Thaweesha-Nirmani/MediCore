const AppError = require('../../../core/app-error');
const repository = require('../repositories/medicine.repository');
const inventoryRepository = require('../../inventory/repositories/inventory.repository');
const inventoryService = require('../../inventory/services/inventory.service');
const SaleRecord = require('../../sales/models/sale-record.model');
const PurchaseOrder = require('../../purchases/models/purchase-order.model');
const {
  normalizeMedicineInput,
  mapActor,
  escapeRegex,
  normalizeSearchToken,
  trimString,
  toNumber,
} = require('../utils/medicine-normalizer');
const { getExpiryStatus } = require('../utils/expiry.utils');
const { findPotentialDuplicateMatches } = require('../utils/duplicate-detection');
const {
  toMedicineResponse,
  toMedicineDetailResponse,
  toAutocompleteResponse,
} = require('../mappers/medicine.mapper');

const SORT_FIELDS = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  medicineId: 'medicineId',
  name: 'displayName',
  category: 'category',
  supplier: 'supplier',
  price: 'unitPrice',
  unitPrice: 'unitPrice',
  quantity: 'inventorySnapshot.stockOnHand',
  expiryDate: 'inventorySnapshot.nextExpiryDate',
};

const LOW_STOCK_THRESHOLD = 10;

function buildBaseFilter({ includeDeleted = false }) {
  if (includeDeleted) {
    return {};
  }

  return {
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  };
}

function buildSearchFilter(search) {
  if (!search) {
    return null;
  }

  const safeRegex = new RegExp(escapeRegex(search), 'i');

  return {
    $or: [
      { medicineId: safeRegex },
      { barcode: safeRegex },
      { name: safeRegex },
      { genericName: safeRegex },
      { generic_name: safeRegex },
      { brandName: safeRegex },
      { brand_name: safeRegex },
      { category: safeRegex },
      { supplier: safeRegex },
      { batchNumber: safeRegex },
      { 'normalized.name': safeRegex },
      { 'normalized.genericName': safeRegex },
      { 'normalized.brandName': safeRegex },
      { 'normalized.category': safeRegex },
      { 'normalized.supplier': safeRegex },
      { 'normalized.barcode': safeRegex },
      { searchText: safeRegex },
    ],
  };
}

function buildExactCategoryFilter(category) {
  if (!category) {
    return null;
  }

  const normalizedCategory = normalizeSearchToken(category);

  return {
    $or: [
      { category: new RegExp(`^${escapeRegex(category)}$`, 'i') },
      { 'normalized.category': normalizedCategory },
    ],
  };
}

function buildSupplierFilter(supplier) {
  if (!supplier) {
    return null;
  }

  const normalizedSupplier = normalizeSearchToken(supplier);

  return {
    $or: [
      { supplier: new RegExp(`^${escapeRegex(supplier)}$`, 'i') },
      { 'normalized.supplier': normalizedSupplier },
    ],
  };
}

function buildStatusFilter(status) {
  if (!status) {
    return null;
  }

  const normalized = String(status).trim().toLowerCase();

  if (normalized === 'active') {
    return {
      $or: [
        { status: 'Active', active: true },
        { active: { $exists: false } },
        { status: { $exists: false } }
      ]
    };
  }

  if (normalized === 'inactive') {
    return { status: 'Inactive' };
  }

  if (normalized === 'archived') {
    return { status: 'Archived', isDeleted: true };
  }

  return null;
}

function buildExpiryFilter(expiryStatus) {
  if (!expiryStatus) {
    return null;
  }

  const normalized = String(expiryStatus).trim().toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const in30Days = new Date(today);
  in30Days.setDate(in30Days.getDate() + 30);

  const expiryPaths = ['inventorySnapshot.nextExpiryDate', 'expiryDate'];

  if (normalized === 'expired') {
    return {
      $or: expiryPaths.map((path) => ({ [path]: { $lt: today } })),
    };
  }

  if (normalized === 'expiring_in_7_days') {
    return {
      $or: expiryPaths.map((path) => ({ [path]: { $gte: today, $lte: in7Days } })),
    };
  }

  if (normalized === 'expiring_soon' || normalized === 'expiring_in_30_days') {
    return {
      $or: expiryPaths.map((path) => ({ [path]: { $gte: today, $lte: in30Days } })),
    };
  }

  if (normalized === 'safe' || normalized === 'valid') {
    return {
      $or: expiryPaths.map((path) => ({ [path]: { $gt: in30Days } })),
    };
  }

  return null;
}

function buildStockFilter(stockLevel) {
  if (!stockLevel) {
    return null;
  }

  const normalized = String(stockLevel).trim().toLowerCase();
  const quantityPaths = ['inventorySnapshot.stockOnHand', 'stock', 'quantity'];

  if (normalized === 'out_of_stock') {
    return {
      $or: quantityPaths.map((path) => ({ [path]: { $lte: 0 } })),
    };
  }

  if (normalized === 'low' || normalized === 'low_stock') {
    return {
      $and: [
        {
          $or: quantityPaths.map((path) => ({ [path]: { $gt: 0 } })),
        },
        {
          $or: quantityPaths.map((path) => ({ [path]: { $lte: LOW_STOCK_THRESHOLD } })),
        },
      ],
    };
  }

  if (normalized === 'available') {
    return {
      $or: quantityPaths.map((path) => ({ [path]: { $gt: LOW_STOCK_THRESHOLD } })),
    };
  }

  return null;
}

function mergeFilters(...filters) {
  const parts = filters.filter(Boolean);

  if (!parts.length) {
    return {};
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return {
    $and: parts,
  };
}

function buildSort(sortBy = 'updatedAt', sortOrder = 'desc') {
  const field = SORT_FIELDS[sortBy] || SORT_FIELDS.updatedAt;

  return {
    [field]: sortOrder === 'asc' ? 1 : -1,
  };
}

function extractChangedFields(previousDocument, nextPayload) {
  return Object.keys(nextPayload).filter((key) => {
    if (key === 'auditTrail') {
      return false;
    }

    return JSON.stringify(previousDocument[key]) !== JSON.stringify(nextPayload[key]);
  });
}

async function generateMedicineId() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = `MED-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
    const existing = await repository.findOne({ medicineId: candidate });

    if (!existing) {
      return candidate;
    }
  }

  throw new AppError('Unable to auto-generate a unique medicine ID', 500);
}

async function findDuplicateMatches(input, excludeId = null) {
  const documents = await repository.findMany(
    mergeFilters(buildBaseFilter({ includeDeleted: false }), excludeId ? { _id: { $ne: excludeId } } : null),
    {
      sort: { updatedAt: -1 },
      skip: 0,
      limit: 300,
    }
  );

  return findPotentialDuplicateMatches(input, documents, { limit: 5 });
}

async function ensureUniqueBatchNumber(batchNumber, excludeInventoryId = null) {
  if (!batchNumber) {
    return;
  }

  const duplicateBatch = await inventoryRepository.findLeanOne({
    batchNumber: String(batchNumber).trim().toUpperCase(),
    active: true,
    ...(excludeInventoryId ? { _id: { $ne: excludeInventoryId } } : {}),
  });

  if (duplicateBatch) {
    throw new AppError('Batch number already exists in inventory', 409, {
      field: 'batchNumber',
      batchNumber,
    });
  }
}

async function ensureNoDuplicateMedicine(normalizedPayload, excludeId = null) {
  const duplicateChecks = [];

  duplicateChecks.push(
    repository.findOne({
      medicineId: normalizedPayload.medicineId,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  );

  if (normalizedPayload.barcode) {
    duplicateChecks.push(
      repository.findOne({
        barcode: normalizedPayload.barcode,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      })
    );
  } else {
    duplicateChecks.push(Promise.resolve(null));
  }

  const [duplicateById, duplicateByBarcode] = await Promise.all(duplicateChecks);

  if (duplicateById) {
    throw new AppError('Medicine with this medicine ID already exists', 409, {
      field: 'medicineId',
      medicineId: normalizedPayload.medicineId,
    });
  }

  if (duplicateByBarcode) {
    throw new AppError('Medicine with this barcode already exists', 409, {
      field: 'barcode',
      barcode: normalizedPayload.barcode,
    });
  }

  const duplicateMatches = await findDuplicateMatches(normalizedPayload, excludeId);

  return duplicateMatches;
}

function hasInventoryMutation(payload) {
  const trackedFields = [
    'stockQty',
    'stock_qty',
    'quantity',
    'stock',
    'batchNumber',
    'batch_number',
    'manufactureDate',
    'manufacture_date',
    'expiryDate',
    'expiry_date',
  ];

  return trackedFields.some((field) => Object.prototype.hasOwnProperty.call(payload, field));
}

function stripInventoryManagedFields(payload) {
  const next = { ...payload };

  delete next.inventorySnapshot;
  delete next.quantity;
  delete next.stock;
  delete next.stock_qty;
  delete next.expiryDate;
  delete next.expiry_date;
  delete next.batchNumber;
  delete next.batchNo;

  return next;
}

function collectRequestedInventoryFields(payload) {
  const fieldMap = {
    stockQty: 'stock_qty',
    stock_qty: 'stock_qty',
    quantity: 'stock_qty',
    stock: 'stock_qty',
    batchNumber: 'batch_number',
    batch_number: 'batch_number',
    manufactureDate: 'manufacture_date',
    manufacture_date: 'manufacture_date',
    expiryDate: 'expiry_date',
    expiry_date: 'expiry_date',
  };

  return Object.keys(payload)
    .filter((key) => fieldMap[key])
    .map((key) => fieldMap[key]);
}

async function getSingleActiveInventoryBatchOrThrow(medicineId) {
  const batches = await inventoryRepository.findMany(
    { medicineId, active: true },
    {
      sort: { expiryDate: 1 },
      skip: 0,
      limit: 5,
    }
  );

  if (batches.length !== 1) {
    throw new AppError(
      'Inventory-linked updates require exactly one active batch. Use the inventory module when multiple batches exist.',
      409,
      { activeBatchCount: batches.length }
    );
  }

  return batches[0];
}

function buildInventoryUpdatePayload(payload, normalizedPayload, existingBatch) {
  const nextPayload = {
    adjustmentReason: 'Updated from medicine management module',
  };

  if (
    Object.prototype.hasOwnProperty.call(payload, 'stockQty') ||
    Object.prototype.hasOwnProperty.call(payload, 'stock_qty') ||
    Object.prototype.hasOwnProperty.call(payload, 'quantity') ||
    Object.prototype.hasOwnProperty.call(payload, 'stock')
  ) {
    nextPayload.quantity = toNumber(
      payload.stockQty ?? payload.stock_qty ?? payload.quantity ?? payload.stock,
      'stock_qty',
      { required: true, min: 0 }
    );
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'batchNumber') || Object.prototype.hasOwnProperty.call(payload, 'batch_number')) {
    nextPayload.batchNumber = normalizedPayload.batchNumber;
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, 'manufactureDate') ||
    Object.prototype.hasOwnProperty.call(payload, 'manufacture_date')
  ) {
    nextPayload.manufactureDate = normalizedPayload.manufactureDate;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'expiryDate') || Object.prototype.hasOwnProperty.call(payload, 'expiry_date')) {
    nextPayload.expiryDate = normalizedPayload.expiryDate;
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, 'unitPrice') ||
    Object.prototype.hasOwnProperty.call(payload, 'price') ||
    Object.prototype.hasOwnProperty.call(payload, 'unit_price_LKR')
  ) {
    nextPayload.sellingPrice = normalizedPayload.unitPrice;
  }

  if (existingBatch?.purchasePrice !== undefined && nextPayload.sellingPrice === undefined) {
    nextPayload.sellingPrice = existingBatch.sellingPrice;
  }

  return nextPayload;
}

async function assertMedicineNotLinked(medicineId) {
  const [hasSalesLinks, hasPurchaseLinks] = await Promise.all([
    SaleRecord.exists({
      $or: [{ 'items.medicineId': medicineId }, { 'refunds.items.medicineId': medicineId }],
    }),
    PurchaseOrder.exists({
      $or: [{ 'items.medicineId': medicineId }, { 'receivingEvents.items.medicineId': medicineId }],
    }),
  ]);

  if (hasSalesLinks || hasPurchaseLinks) {
    throw new AppError('Linked sales or purchase history prevents this medicine from being archived', 409, {
      salesLinked: Boolean(hasSalesLinks),
      purchasesLinked: Boolean(hasPurchaseLinks),
    });
  }
}

async function listMedicines(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit || query.top) || 20, 1), 100);
  const requestedStatus = trimString(query.status);
  const includeDeleted =
    String(query.includeDeleted || '').toLowerCase() === 'true' ||
    String(requestedStatus || '').toLowerCase() === 'archived';
  const filter = mergeFilters(
    buildBaseFilter({ includeDeleted }),
    buildSearchFilter(query.search || query.q),
    buildExactCategoryFilter(query.category),
    buildSupplierFilter(query.supplier),
    buildStatusFilter(query.status),
    buildExpiryFilter(query.expiryStatus),
    buildStockFilter(query.stockLevel)
  );
  const sort = buildSort(query.sortBy, query.sortOrder);
  const skip = (page - 1) * limit;
  const baseFilter = buildBaseFilter({ includeDeleted: false });

  const [documents, total, categories, suppliers] = await Promise.all([
    repository.findMany(filter, { sort, skip, limit }),
    repository.count(filter),
    repository.distinct('category', baseFilter),
    repository.distinct('supplier', baseFilter),
  ]);

  return {
    items: documents.map(toMedicineResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      sortBy: query.sortBy || 'updatedAt',
      sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
      filters: {
        search: query.search || query.q || '',
        category: query.category || null,
        supplier: query.supplier || null,
        status: query.status || null,
        expiryStatus: query.expiryStatus || null,
        stockLevel: query.stockLevel || null,
        includeDeleted,
      },
      filterOptions: {
        categories: categories.filter(Boolean).sort((left, right) => String(left).localeCompare(String(right))),
        suppliers: suppliers.filter(Boolean).sort((left, right) => String(left).localeCompare(String(right))),
      },
    },
  };
}

async function getMedicineById(id, { includeDeleted = false } = {}) {
  const document = await repository.findByIdLean(id, { includeDeleted });

  if (!document) {
    throw new AppError('Medicine not found', 404);
  }

  return toMedicineDetailResponse(document);
}

async function getMedicineByBarcode(barcode) {
  const document = await repository.findOne({
    barcode: String(barcode).trim().toUpperCase(),
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  });

  if (!document) {
    throw new AppError('Medicine not found for barcode', 404);
  }

  return toMedicineDetailResponse(document);
}

async function autocompleteMedicines(query) {
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 20);
  const search = String(query.q || query.search || '').trim();

  if (!search) {
    return {
      items: [],
      meta: {
        count: 0,
        limit,
        query: '',
      },
    };
  }

  const documents = await repository.findMany(
    mergeFilters(buildBaseFilter({ includeDeleted: false }), buildSearchFilter(search)),
    {
      sort: { displayName: 1, updatedAt: -1 },
      skip: 0,
      limit,
    }
  );

  const normalizedQuery = search.toLowerCase();
  const sorted = documents.sort((left, right) => {
    const leftName = String(left.displayName || left.name || '').toLowerCase();
    const rightName = String(right.displayName || right.name || '').toLowerCase();
    const leftStarts = leftName.startsWith(normalizedQuery) ? 1 : 0;
    const rightStarts = rightName.startsWith(normalizedQuery) ? 1 : 0;

    if (leftStarts !== rightStarts) {
      return rightStarts - leftStarts;
    }

    return leftName.localeCompare(rightName);
  });

  return {
    items: sorted.map(toAutocompleteResponse),
    meta: {
      count: sorted.length,
      limit,
      query: search,
    },
  };
}

async function autocompleteGenericNames(query) {
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 20);
  const search = String(query.q || query.search || '').trim();

  if (!search || search.length < 2) {
    return { items: [], meta: { count: 0, limit, query: '' } };
  }

  const safeRegex = new RegExp(escapeRegex(search), 'i');

  const pipeline = [
    {
      $match: {
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
        $or: [{ genericName: safeRegex }, { generic_name: safeRegex }],
      },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $ifNull: ['$genericName', false] },
            '$genericName',
            '$generic_name'
          ]
        }
      }
    },
    { $match: { _id: { $ne: null, $ne: '' } } },
    { $limit: limit },
    { $project: { _id: 0, name: '$_id' } },
    { $sort: { name: 1 } }
  ];

  const results = await repository.aggregate(pipeline);
  const items = results.map(r => r.name).filter(Boolean);

  return {
    items,
    meta: {
      count: items.length,
      limit,
      query: search,
    },
  };
}

async function checkDuplicateMedicines(query) {
  const batchNumber = String(query.batchNumber || '').trim().toUpperCase();
  const excludeId = query.excludeId || null;

  if (!batchNumber) {
    return {
      blocking: false,
      count: 0,
      matches: [],
      query: { batchNumber },
    };
  }

  const filter = {
    batchNumber,
    active: true,
  };

  if (excludeId) {
    filter.medicineId = { $ne: excludeId };
  }

  const duplicateBatch = await inventoryRepository.findLeanOne(filter);

  if (duplicateBatch) {
    return {
      blocking: true,
      count: 1,
      matches: [
        {
          id: String(duplicateBatch._id),
          medicineId: duplicateBatch.medicineId,
          name: `Batch ${duplicateBatch.batchNumber}`,
          score: 1.0,
          blocking: true,
          matchReason: 'This batch number already exists in inventory',
        },
      ],
      query: { batchNumber },
    };
  }

  return {
    blocking: false,
    count: 0,
    matches: [],
    query: { batchNumber },
  };
}

async function createMedicine(payload, user) {
  const generatedMedicineId = payload.medicineId ? null : await generateMedicineId();
  const normalizedPayload = normalizeMedicineInput(payload, {
    isCreate: true,
    generatedMedicineId,
  });

  const duplicateMatches = await ensureNoDuplicateMedicine(normalizedPayload);
  await ensureUniqueBatchNumber(normalizedPayload.batchNumber);

  const documentPayload = {
    ...normalizedPayload,
    status: 'Active',
    active: true,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    auditTrail: [
      {
        action: 'created',
        at: new Date(),
        by: mapActor(user),
        changedFields: [
          'medicineId',
          'medicine_id',
          'name',
          'generic_name',
          'brand_name',
          'unit_price_LKR',
          'restock_threshold',
          'lead_time_days',
          'stock_qty',
          'batch_number',
          'manufacture_date',
          'expiry_date',
        ],
        note: 'Medicine created through medicine management module',
      },
    ],
  };

  const document = await repository.create(documentPayload);

  try {
    await inventoryService.createInventory(
      {
        medicineId: String(document._id),
        batchNumber: normalizedPayload.batchNumber,
        quantity: normalizedPayload.stock_qty ?? normalizedPayload.quantity ?? 0,
        expiryDate: normalizedPayload.expiryDate,
        manufactureDate: normalizedPayload.manufactureDate,
        purchasePrice: normalizedPayload.unitPrice,
        sellingPrice: normalizedPayload.unitPrice,
        location: 'MAIN_STORE',
        notes: 'Initialized automatically from medicine creation',
      },
      user
    );
  } catch (error) {
    await repository.deleteById(document._id);
    throw error;
  }

  const createdDocument = await repository.findByIdLean(document._id, { includeDeleted: true });
  const response = toMedicineDetailResponse(createdDocument);

  if (duplicateMatches.length) {
    response.duplicateWarnings = duplicateMatches;
  }

  return response;
}

async function updateMedicine(id, payload, user) {
  const existing = await repository.findById(id, { includeDeleted: true });

  if (!existing) {
    throw new AppError('Medicine not found', 404);
  }

  if (existing.isDeleted) {
    throw new AppError('Archived medicines cannot be updated', 409);
  }

  if (payload.medicineId && String(payload.medicineId).trim().toUpperCase() !== existing.medicineId) {
    throw new AppError('medicineId cannot be changed once created', 422);
  }

  const normalizedPayload = normalizeMedicineInput(payload, {
    isCreate: false,
    existing: existing.toObject(),
  });

  const duplicateMatches = await ensureNoDuplicateMedicine(normalizedPayload, id);
  const inventoryMutationRequested = hasInventoryMutation(payload);

  if (inventoryMutationRequested) {
    const inventoryBatch = await getSingleActiveInventoryBatchOrThrow(id);
    await ensureUniqueBatchNumber(normalizedPayload.batchNumber, inventoryBatch._id);

    await inventoryService.updateInventory(
      String(inventoryBatch._id),
      buildInventoryUpdatePayload(payload, normalizedPayload, inventoryBatch),
      user
    );
  }

  const sanitizedPayload = stripInventoryManagedFields(normalizedPayload);
  const changedFields = extractChangedFields(existing.toObject(), sanitizedPayload);
  const inventoryFields = inventoryMutationRequested ? collectRequestedInventoryFields(payload) : [];
  const auditFields = [...new Set([...changedFields, ...inventoryFields])];

  if (!auditFields.length) {
    const current = await repository.findByIdLean(id, { includeDeleted: true });
    return toMedicineDetailResponse(current);
  }

  Object.assign(existing, sanitizedPayload);
  existing.auditTrail = Array.isArray(existing.auditTrail) ? existing.auditTrail : [];
  existing.auditTrail.push({
    action: 'updated',
    at: new Date(),
    by: mapActor(user),
    changedFields: auditFields,
    note: inventoryMutationRequested
      ? 'Medicine and linked inventory batch updated through medicine management module'
      : 'Medicine updated through medicine management module',
  });

  const updated = await repository.save(existing);
  const response = toMedicineDetailResponse(
    await repository.findByIdLean(updated._id, { includeDeleted: true })
  );

  if (duplicateMatches.length) {
    response.duplicateWarnings = duplicateMatches;
  }

  return response;
}

async function softDeleteMedicine(id, user) {
  const existing = await repository.findById(id, { includeDeleted: true });

  if (!existing) {
    throw new AppError('Medicine not found', 404);
  }

  if (existing.isDeleted) {
    return toMedicineDetailResponse(existing.toObject());
  }

  await assertMedicineNotLinked(id);

  existing.isDeleted = true;
  existing.active = false;
  existing.status = 'Archived';
  existing.deletedAt = new Date();
  existing.deletedBy = mapActor(user);
  existing.auditTrail = Array.isArray(existing.auditTrail) ? existing.auditTrail : [];
  existing.auditTrail.push({
    action: 'deleted',
    at: new Date(),
    by: mapActor(user),
    changedFields: ['isDeleted', 'status', 'active'],
    note: 'Medicine soft deleted through medicine management module',
  });

  const archived = await repository.save(existing);
  return toMedicineDetailResponse(archived.toObject());
}

async function restoreMedicine(id, user) {
  const existing = await repository.findById(id, { includeDeleted: true });

  if (!existing) {
    throw new AppError('Medicine not found', 404);
  }

  if (!existing.isDeleted) {
    return toMedicineDetailResponse(existing.toObject());
  }

  existing.isDeleted = false;
  existing.active = true;
  existing.status = 'Active';
  existing.deletedAt = null;
  existing.deletedBy = null;
  existing.auditTrail = Array.isArray(existing.auditTrail) ? existing.auditTrail : [];
  existing.auditTrail.push({
    action: 'updated',
    at: new Date(),
    by: mapActor(user),
    changedFields: ['isDeleted', 'status', 'active'],
    note: 'Medicine restored through medicine management module',
  });

  const restored = await repository.save(existing);
  return toMedicineDetailResponse(restored.toObject());
}

async function getExpiryAlerts() {
  const documents = await repository.findMany(buildBaseFilter({ includeDeleted: false }), {
    sort: { 'inventorySnapshot.nextExpiryDate': 1, expiryDate: 1 },
    skip: 0,
    limit: 500,
  });

  const medicines = documents.map(toMedicineResponse);
  const expired = medicines.filter((medicine) => medicine.expiryStatus === 'expired');
  const expiringIn30Days = medicines.filter((medicine) =>
    ['expiring_in_7_days', 'expiring_in_30_days'].includes(medicine.expiryStatus)
  );
  const safe = medicines.filter((medicine) => getExpiryStatus(medicine.expiryDate) === 'valid');

  return {
    expired,
    expiringSoon: expiringIn30Days,
    expiringIn7Days: medicines.filter((medicine) => medicine.expiryStatus === 'expiring_in_7_days'),
    expiringIn30Days,
    safe,
    summary: {
      expired: expired.length,
      expiringSoon: expiringIn30Days.length,
      expiringIn7Days: medicines.filter((medicine) => medicine.expiryStatus === 'expiring_in_7_days').length,
      expiringIn30Days: expiringIn30Days.length,
      valid: safe.length,
      noExpiry: medicines.filter((medicine) => getExpiryStatus(medicine.expiryDate) === 'no_expiry').length,
    },
  };
}

module.exports = {
  listMedicines,
  getMedicineById,
  getMedicineByBarcode,
  autocompleteMedicines,
  autocompleteGenericNames,
  checkDuplicateMedicines,
  createMedicine,
  updateMedicine,
  softDeleteMedicine,
  restoreMedicine,
  getExpiryAlerts,
};
