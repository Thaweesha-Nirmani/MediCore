function resolveSupplier(document) {
  const populated =
    document.supplierId && typeof document.supplierId === 'object' && document.supplierId._id
      ? document.supplierId
      : null;

  if (populated) {
    return {
      id: String(populated._id),
      name: populated.name || document.supplierSnapshot?.name || '',
      contactNumber: populated.contactNumber || document.supplierSnapshot?.contactNumber || '',
      email: populated.email || document.supplierSnapshot?.email || '',
      status: populated.status || 'Active',
    };
  }

  return {
    id: document.supplierId ? String(document.supplierId) : '',
    name: document.supplierSnapshot?.name || '',
    contactNumber: document.supplierSnapshot?.contactNumber || '',
    email: document.supplierSnapshot?.email || '',
    status: 'Unknown',
  };
}

function mapPurchaseItem(item) {
  return {
    id: String(item._id),
    medicineId: String(item.medicineId),
    medicine: {
      medicineId: item.medicineSnapshot?.medicineId || '',
      name: item.medicineSnapshot?.name || '',
      displayName: item.medicineSnapshot?.displayName || item.medicineSnapshot?.name || '',
      genericName: item.medicineSnapshot?.genericName || '',
    },
    medicineName: item.medicineSnapshot?.displayName || item.medicineSnapshot?.name || '',
    orderedQuantity: item.orderedQuantity,
    quantity: item.orderedQuantity,
    receivedQuantity: item.receivedQuantity || 0,
    remainingQuantity: Math.max(0, item.orderedQuantity - (item.receivedQuantity || 0)),
    unitCost: item.unitCost,
    costPrice: item.unitCost,
    sellingPrice: item.sellingPrice ?? null,
    subtotal: item.subtotal,
    status: item.status || 'pending',
    notes: item.notes || '',
  };
}

function mapReceivingEvent(event) {
  return {
    id: String(event._id),
    receivedAt: event.receivedAt || null,
    receivedBy: event.receivedBy || null,
    notes: event.notes || '',
    items: Array.isArray(event.items)
      ? event.items.map((item) => ({
          purchaseItemId: String(item.purchaseItemId),
          medicineId: String(item.medicineId),
          inventoryId: item.inventoryId || null,
          batchNumber: item.batchNumber,
          quantityReceived: item.quantityReceived,
          expiryDate: item.expiryDate || null,
          manufactureDate: item.manufactureDate || null,
          location: item.location || 'MAIN_STORE',
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice ?? null,
          notes: item.notes || '',
        }))
      : [],
  };
}

function toPurchaseResponse(document) {
  const supplier = resolveSupplier(document);
  const items = Array.isArray(document.items) ? document.items.map(mapPurchaseItem) : [];
  const deliveryStatus =
    document.receiveStatus === 'fully_received'
      ? 'Delivered'
      : document.receiveStatus === 'partially_received'
        ? 'Partially Delivered'
        : 'Pending';

  return {
    id: String(document._id),
    purchaseNumber: document.purchaseNumber || '',
    supplierId: supplier.id,
    supplier,
    supplierName: supplier.name,
    purchaseDate: document.purchaseDate || null,
    expectedDeliveryDate: document.expectedDeliveryDate || null,
    orderStatus: document.orderStatus || 'placed',
    receiveStatus: document.receiveStatus || 'not_received',
    deliveryStatus,
    totalAmount: document.totalAmount || 0,
    totalCost: document.totalAmount || 0,
    items,
    notes: document.notes || '',
    active: document.isDeleted ? false : document.active !== false,
    isDeleted: Boolean(document.isDeleted),
    receivingEvents: Array.isArray(document.receivingEvents)
      ? document.receivingEvents.map(mapReceivingEvent)
      : [],
    audit: {
      createdAt: document.createdAt || null,
      updatedAt: document.updatedAt || null,
      deletedAt: document.deletedAt || null,
      createdBy: document.createdBy || null,
      updatedBy: document.updatedBy || null,
      deletedBy: document.deletedBy || null,
    },
    createdAt: document.createdAt || null,
    updatedAt: document.updatedAt || null,
  };
}

module.exports = {
  toPurchaseResponse,
};
