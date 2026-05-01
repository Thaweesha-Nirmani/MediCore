const { getExpiryInsight } = require('../utils/expiry.utils');

function resolveStockStatus(quantity) {
  const value = Number(quantity || 0);

  if (value <= 0) {
    return 'out_of_stock';
  }

  if (value <= 10) {
    return 'low_stock';
  }

  return 'available';
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function resolveName(document) {
  return (
    firstDefined(
      document.name,
      document.displayName,
      document.brandName,
      document.brand_name,
      document.genericName,
      document.generic_name,
      document.medicine_name,
      document.drug_name,
      document.item_name
    ) || 'Unknown Medicine'
  );
}

function resolveGenericName(document) {
  return firstDefined(document.genericName, document.generic_name, document.generic_drug_name) || '';
}

function resolveBrandName(document) {
  return firstDefined(document.brandName, document.brand_name, document.brand_drug_name) || '';
}

function resolveStrength(document) {
  return firstDefined(document.strength, document.dosageStrength) || '';
}

function resolveDosageForm(document) {
  return firstDefined(document.dosageForm, document.dosage_form, document.form) || '';
}

function resolvePrice(document) {
  return (
    firstDefined(
      document.unitPrice,
      document.price,
      document.unit_price_LKR,
      document.selling_price,
      document.retail_price
    ) || 0
  );
}

function resolveQuantity(document) {
  return (
    firstDefined(
      document.inventorySnapshot?.stockOnHand,
      document.quantity,
      document.stock,
      document.stock_qty,
      document.stock_quantity,
      document.current_stock,
      document.on_hand
    ) || 0
  );
}

function resolveExpiryDate(document) {
  return (
    firstDefined(
      document.inventorySnapshot?.nextExpiryDate,
      document.expiryDate,
      document.exp_date,
      document.expiry_date
    ) || null
  );
}

function resolveManufactureDate(document) {
  return (
    firstDefined(document.manufactureDate, document.manufacture_date, document.mfg_date) || null
  );
}

function resolveBatchNumber(document) {
  return (
    firstDefined(
      document.inventorySnapshot?.batchNumber,
      document.batchNumber,
      document.batchNo,
      document.batch_id,
      document.batch_number,
      document.lot_number
    ) || ''
  );
}

function toMedicineResponse(document) {
  const expiryDate = resolveExpiryDate(document);
  const quantity = resolveQuantity(document);
  const price = resolvePrice(document);
  const restockThreshold = firstDefined(
    document.restockThreshold,
    document.restock_threshold,
    document.threshold,
    document.reorderLevel
  );
  const leadTimeDays = firstDefined(document.leadTimeDays, document.lead_time_days);
  const { expiryStatus, daysToExpire } = getExpiryInsight(expiryDate);
  const stockStatus = resolveStockStatus(quantity);

  return {
    id: String(document._id),
    medicineId: firstDefined(document.medicineId, document.medicine_id) || '',
    datasetMedicineId: firstDefined(document.medicine_id, document.medicineId) || '',
    name: resolveName(document),
    genericName: resolveGenericName(document),
    brandName: resolveBrandName(document),
    displayName: firstDefined(document.displayName, resolveName(document)),
    strength: resolveStrength(document),
    dosageForm: resolveDosageForm(document),
    category: document.category || 'General',
    manufacturer: document.manufacturer || '',
    supplier: firstDefined(document.supplier, document.supplierId) || '',
    barcode: document.barcode || null,
    price,
    unitPrice: price,
    quantity,
    stock: quantity,
    stockQty: quantity,
    restockThreshold:
      restockThreshold === undefined || restockThreshold === null ? undefined : Number(restockThreshold),
    leadTimeDays:
      leadTimeDays === undefined || leadTimeDays === null ? undefined : Number(leadTimeDays),
    stockStatus,
    batchNumber: resolveBatchNumber(document),
    batchId: resolveBatchNumber(document),
    manufactureDate: resolveManufactureDate(document),
    expiryDate,
    expiryStatus,
    daysToExpire,
    description: document.description || '',
    status: document.status || (document.active === false ? 'Inactive' : 'Active'),
    active: document.isDeleted ? false : document.active !== false,
    isDeleted: Boolean(document.isDeleted),
    inventorySnapshot: {
      stockOnHand: quantity,
      nextExpiryDate: expiryDate,
      batchNumber: resolveBatchNumber(document),
    },
    audit: {
      createdAt: document.createdAt || null,
      updatedAt: document.updatedAt || null,
      deletedAt: document.deletedAt || null,
      auditTrailCount: Array.isArray(document.auditTrail) ? document.auditTrail.length : 0,
    },
    createdAt: document.createdAt || null,
    updatedAt: document.updatedAt || null,
  };
}

function toMedicineDetailResponse(document) {
  const base = toMedicineResponse(document);

  return {
    ...base,
    auditTrail: Array.isArray(document.auditTrail) ? document.auditTrail : [],
    deletedBy: document.deletedBy || null,
  };
}

function toAutocompleteResponse(document) {
  const mapped = toMedicineResponse(document);

  return {
    id: mapped.id,
    medicineId: mapped.medicineId,
    name: mapped.name,
    genericName: mapped.genericName,
    brandName: mapped.brandName,
    displayName: mapped.displayName,
    strength: mapped.strength,
    dosageForm: mapped.dosageForm,
    category: mapped.category,
    price: mapped.price,
    barcode: mapped.barcode,
    quantity: mapped.quantity,
    expiryStatus: mapped.expiryStatus,
    daysToExpire: mapped.daysToExpire,
  };
}

module.exports = {
  toMedicineResponse,
  toMedicineDetailResponse,
  toAutocompleteResponse,
};
