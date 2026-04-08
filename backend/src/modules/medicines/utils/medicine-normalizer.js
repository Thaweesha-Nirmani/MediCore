const AppError = require('../../../core/app-error');

function trimString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
}

function upperString(value) {
  const normalized = trimString(value);
  return normalized ? normalized.toUpperCase() : null;
}

function lowerString(value) {
  const normalized = trimString(value);
  return normalized ? normalized.toLowerCase() : null;
}

function coalesce(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function toNumber(value, fieldName, { required = false, min = null } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new AppError(`${fieldName} is required`, 422);
    }

    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new AppError(`${fieldName} must be a valid number`, 422);
  }

  if (min !== null && parsed < min) {
    throw new AppError(
      `${fieldName} must be ${min === 0 ? '0 or greater' : `greater than ${min}`}`,
      422
    );
  }

  return parsed;
}

function toDate(value, fieldName, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new AppError(`${fieldName} is required`, 422);
    }

    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`${fieldName} must be a valid date`, 422);
  }

  return parsed;
}

function ensureDateOrder(manufactureDate, expiryDate) {
  if (manufactureDate && expiryDate && manufactureDate > expiryDate) {
    throw new AppError('manufacture_date must be before expiry_date', 422);
  }
}

function normalizeStatus(value) {
  const normalized = lowerString(value);

  if (!normalized) {
    return 'Active';
  }

  if (normalized === 'archived') {
    return 'Archived';
  }

  if (normalized === 'inactive') {
    return 'Inactive';
  }

  return 'Active';
}

function normalizeSearchToken(value) {
  return lowerString(value) || '';
}

function buildDisplayName({ name, brandName, genericName }) {
  return (
    trimString(name) ||
    trimString(brandName) ||
    trimString(genericName) ||
    'Unknown Medicine'
  );
}

function buildSearchText(values) {
  return values
    .map((value) => normalizeSearchToken(value))
    .filter(Boolean)
    .filter((value, index, source) => source.indexOf(value) === index)
    .join(' ');
}

function mapActor(user) {
  if (!user) {
    return {
      id: null,
      role: null,
      name: null,
      email: null,
    };
  }

  return {
    id: user._id ? String(user._id) : user.id ? String(user.id) : null,
    role: user.role || null,
    name: user.name || null,
    email: user.email || null,
  };
}

function normalizeMedicineInput(payload, { isCreate = false, existing = null, generatedMedicineId = null } = {}) {
  const genericName = trimString(
    coalesce(payload.genericName, payload.generic_name, existing?.genericName, existing?.generic_name)
  );
  const brandName = trimString(
    coalesce(payload.brandName, payload.brand_name, existing?.brandName, existing?.brand_name)
  );
  const derivedName = trimString(coalesce(payload.name, existing?.name)) || brandName || genericName;
  const medicineId = upperString(
    coalesce(payload.medicineId, payload.medicine_id, existing?.medicineId, existing?.medicine_id, generatedMedicineId)
  );
  const category = trimString(coalesce(payload.category, existing?.category)) || 'General';
  const supplier = trimString(coalesce(payload.supplier, existing?.supplier)) || '';
  const manufacturer = trimString(coalesce(payload.manufacturer, existing?.manufacturer)) || '';
  const barcode = upperString(coalesce(payload.barcode, existing?.barcode));
  const description = trimString(coalesce(payload.description, existing?.description)) || '';
  const unitPrice = toNumber(
    coalesce(
      payload.unitPrice,
      payload.price,
      payload.unit_price_LKR,
      existing?.unitPrice,
      existing?.price,
      existing?.unit_price_LKR
    ),
    'unit_price_LKR',
    { required: isCreate, min: 0.01 }
  );
  const stockQty = toNumber(
    coalesce(
      payload.stockQty,
      payload.stock_qty,
      payload.quantity,
      payload.stock,
      existing?.inventorySnapshot?.stockOnHand,
      existing?.stock_qty,
      existing?.quantity,
      existing?.stock
    ),
    'stock_qty',
    { required: isCreate, min: 0 }
  );
  const batchNumber = upperString(
    coalesce(
      payload.batchNumber,
      payload.batch_number,
      payload.batch_id,
      payload.batchNo,
      existing?.inventorySnapshot?.batchNumber,
      existing?.batchNumber,
      existing?.batchNo
    )
  );
  const restockThreshold = toNumber(
    coalesce(
      payload.restockThreshold,
      payload.restock_threshold,
      payload.threshold,
      payload.reorderLevel,
      existing?.restockThreshold,
      existing?.restock_threshold,
      existing?.threshold,
      existing?.reorderLevel
    ),
    'restock_threshold',
    { required: false, min: 0 }
  );
  const leadTimeDays = toNumber(
    coalesce(
      payload.leadTimeDays,
      payload.lead_time_days,
      existing?.leadTimeDays,
      existing?.lead_time_days
    ),
    'lead_time_days',
    { required: false, min: 0 }
  );
  const manufactureDate = toDate(
    coalesce(payload.manufactureDate, payload.manufacture_date, existing?.manufactureDate),
    'manufacture_date',
    { required: isCreate }
  );
  const expiryDate = toDate(
    coalesce(
      payload.expiryDate,
      payload.expiry_date,
      payload.nextExpiryDate,
      existing?.inventorySnapshot?.nextExpiryDate,
      existing?.expiryDate
    ),
    'expiry_date',
    { required: isCreate }
  );
  const status = normalizeStatus(coalesce(payload.status, existing?.status));

  if (!medicineId) {
    throw new AppError('medicineId is required', 422);
  }

  if (!derivedName) {
    throw new AppError('Either brand_name or generic_name is required', 422);
  }

  if (!category) {
    throw new AppError('category is required', 422);
  }

  if (isCreate && !supplier) {
    throw new AppError('supplier is required', 422);
  }

  if (isCreate && !batchNumber) {
    throw new AppError('batch_number is required', 422);
  }

  ensureDateOrder(manufactureDate, expiryDate);

  const displayName = buildDisplayName({
    name: derivedName,
    brandName,
    genericName,
  });

  const normalized = {
    name: normalizeSearchToken(derivedName),
    genericName: normalizeSearchToken(genericName),
    brandName: normalizeSearchToken(brandName),
    displayName: normalizeSearchToken(displayName),
    category: normalizeSearchToken(category),
    supplier: normalizeSearchToken(supplier),
    barcode: normalizeSearchToken(barcode),
    medicineId: normalizeSearchToken(medicineId),
  };

  return {
    medicineId,
    name: derivedName,
    genericName: genericName || '',
    brandName: brandName || '',
    generic_name: genericName || '',
    brand_name: brandName || '',
    displayName,
    category,
    supplier,
    manufacturer,
    barcode,
    unitPrice,
    price: unitPrice,
    unit_price_LKR: unitPrice,
    restockThreshold,
    restock_threshold: restockThreshold,
    threshold: restockThreshold,
    reorderLevel: restockThreshold,
    leadTimeDays,
    lead_time_days: leadTimeDays,
    description,
    manufactureDate,
    status,
    active: status === 'Active',
    normalized,
    searchText: buildSearchText([
      medicineId,
      derivedName,
      genericName,
      brandName,
      displayName,
      category,
      supplier,
      manufacturer,
      barcode,
      batchNumber,
    ]),
    inventorySnapshot: {
      stockOnHand: stockQty ?? 0,
      nextExpiryDate: expiryDate,
      batchNumber: batchNumber || '',
    },
    quantity: stockQty ?? 0,
    stock: stockQty ?? 0,
    stock_qty: stockQty ?? 0,
    expiryDate,
    batchNumber: batchNumber || '',
    batch_id: batchNumber || '',
    batchNo: batchNumber || '',
    manufacture_date: manufactureDate,
    expiry_date: expiryDate,
  };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  trimString,
  upperString,
  lowerString,
  coalesce,
  toNumber,
  toDate,
  ensureDateOrder,
  normalizeStatus,
  normalizeSearchToken,
  buildDisplayName,
  buildSearchText,
  mapActor,
  normalizeMedicineInput,
  escapeRegex,
};
