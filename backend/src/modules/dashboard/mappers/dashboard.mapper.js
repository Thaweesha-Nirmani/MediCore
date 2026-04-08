function toRecentActivityItem(type, item) {
  if (type === 'sale') {
    return {
      type: 'sale',
      id: String(item._id),
      at: item.date || item.saleDate || item.createdAt,
      label: item.billNumber || 'Sale',
      subtitle: item.customerName || 'Walk-in Customer',
      amount: Number(item.total || 0),
      status: item.status || 'completed',
      actor: item.soldBy || item.createdBy?.name || null,
    };
  }

  if (type === 'purchase') {
    return {
      type: 'purchase',
      id: String(item._id),
      at: item.updatedAt || item.purchaseDate || item.createdAt,
      label: item.purchaseNumber || 'Purchase',
      subtitle: item.supplierSnapshot?.name || 'Supplier',
      amount: Number(item.totalAmount || 0),
      status: item.orderStatus || 'placed',
      actor: item.updatedBy?.name || item.createdBy?.name || null,
    };
  }

  return {
    type: 'inventory',
    id: String(item._id),
    at: item.createdAt,
    label: item.medicineSnapshot?.name || item.batchNumber || 'Inventory movement',
    subtitle: item.reason || item.type || 'Inventory update',
    amount: Number(item.quantityChange || 0),
    status: item.type || 'adjust',
    actor: item.createdBy?.name || null,
  };
}

function toFastMovingMedicine(row) {
  const snapshot = row.medicineSnapshot || {};

  return {
    medicineId: row.medicineId ? String(row.medicineId) : '',
    catalogMedicineId: snapshot.medicineId || '',
    name: snapshot.displayName || snapshot.name || '',
    genericName: snapshot.genericName || '',
    barcode: snapshot.barcode || '',
    unitsSold: Number(row.unitsSold || 0),
    revenue: Number(row.revenue || 0),
    invoiceCount: Number(row.invoiceCount || 0),
  };
}

module.exports = {
  toRecentActivityItem,
  toFastMovingMedicine,
};
