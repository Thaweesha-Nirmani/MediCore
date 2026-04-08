const {
  getComputedStockStatus,
  getAvailableQuantity,
  getExpiryBucket,
  daysToExpire,
} = require('../../inventory/utils/inventory-status');

function buildSearchText(parts) {
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function buildStockItem(row) {
  const medicine = row.medicineId || {};
  const stockStatus = getComputedStockStatus(row, Number(row.reorderLevel || 0));
  const expiryStatus = getExpiryBucket(row.expiryDate);

  return {
    id: String(row._id),
    medicineId: medicine?._id ? String(medicine._id) : String(row.medicineId?._id || row.medicineId || ''),
    catalogMedicineId: medicine.medicineId || '',
    name: medicine.displayName || medicine.name || '',
    genericName: medicine.genericName || '',
    category: medicine.category || '',
    barcode: medicine.barcode || '',
    batchNumber: row.batchNumber || '',
    location: row.location || '',
    quantity: Number(row.quantity || 0),
    availableQuantity: Number(getAvailableQuantity(row, Number(row.reorderLevel || 0)) || 0),
    reorderLevel: Number(row.reorderLevel || 0),
    stockStatus,
    expiryStatus,
    daysToExpire: daysToExpire(row.expiryDate),
    expiryDate: row.expiryDate || null,
    manufactureDate: row.manufactureDate || null,
    purchasePrice: Number(row.purchasePrice || 0),
    sellingPrice: row.sellingPrice === undefined || row.sellingPrice === null ? null : Number(row.sellingPrice),
    supplierId: row.supplierId ? String(row.supplierId) : null,
    active: row.active !== false,
    searchText: buildSearchText([
      medicine.medicineId,
      medicine.displayName,
      medicine.name,
      medicine.genericName,
      medicine.category,
      medicine.barcode,
      row.batchNumber,
      row.location,
    ]),
  };
}

function buildTimelinePoint(row) {
  return {
    date: row._id,
    saleCount: Number(row.saleCount || 0),
    purchaseCount: Number(row.purchaseCount || 0),
    totalAmount: Number(row.totalAmount || 0),
  };
}

function buildPaymentMethodSummary(row) {
  return {
    method: row._id || 'unknown',
    saleCount: Number(row.saleCount || 0),
    grossAmount: Number(row.grossAmount || row.totalAmount || 0),
    refundAmount: Number(row.refundAmount || 0),
    totalAmount: Number(row.totalAmount || 0),
  };
}

function buildTopMedicineSummary(row) {
  const snapshot = row.medicineSnapshot || {};

  return {
    medicineId: row.medicineId ? String(row.medicineId) : '',
    catalogMedicineId: snapshot.medicineId || '',
    name: snapshot.displayName || snapshot.name || '',
    genericName: snapshot.genericName || '',
    unitsSold: Number(row.unitsSold || 0),
    revenue: Number(row.revenue || 0),
    invoiceCount: Number(row.invoiceCount || 0),
  };
}

function buildTopSupplierSummary(row) {
  return {
    supplierId: row._id ? String(row._id) : '',
    supplierName: row.supplierName || 'Unknown supplier',
    purchaseCount: Number(row.purchaseCount || 0),
    totalAmount: Number(row.totalAmount || 0),
  };
}

module.exports = {
  buildStockItem,
  buildTimelinePoint,
  buildPaymentMethodSummary,
  buildTopMedicineSummary,
  buildTopSupplierSummary,
};
