function toId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    if (value._id) {
      return String(value._id);
    }

    if (value.id) {
      return String(value.id);
    }
  }

  return String(value);
}

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function mapCompatibilityMedicine(item) {
  const quantity = Number(item.quantity ?? item.qty ?? 0);
  const price = roundMoney(item.price ?? item.unitPrice ?? 0);

  return {
    medicineId: toId(item.medicineId) || toId(item.medicine) || '',
    name: item.name || item.medicineSnapshot?.name || item.displayName || 'Unknown Medicine',
    quantity,
    price,
    lineTotal: roundMoney(item.lineTotal ?? price * quantity),
    barcode: item.barcode || item.medicineSnapshot?.barcode || '',
  };
}

function getCompatibilityMedicines(sale) {
  if (Array.isArray(sale.medicines) && sale.medicines.length) {
    return sale.medicines.map(mapCompatibilityMedicine);
  }

  if (Array.isArray(sale.items) && sale.items.length) {
    return sale.items.map((item) =>
      mapCompatibilityMedicine({
        medicineId: item.medicineId,
        name: item.medicineSnapshot?.name || item.name,
        quantity: item.quantity,
        price: item.unitPrice ?? item.price,
        lineTotal: item.lineTotal,
        barcode: item.medicineSnapshot?.barcode || '',
      })
    );
  }

  return [];
}

function deriveSubtotal(medicines) {
  return roundMoney(
    medicines.reduce((sum, item) => sum + roundMoney(Number(item.price || 0) * Number(item.quantity || 0)), 0)
  );
}

function toSaleListResponse(sale) {
  const medicines = getCompatibilityMedicines(sale);
  const subtotal = roundMoney(sale.subtotal ?? deriveSubtotal(medicines));
  const tax = roundMoney(sale.tax ?? 0);
  const discount = roundMoney(sale.discount ?? 0);
  const serviceFee = roundMoney(sale.serviceFee ?? 0);
  const total = roundMoney(sale.total ?? subtotal + tax + serviceFee - discount);
  const refundTotal = roundMoney(sale.refundTotal ?? 0);
  const netTotal = roundMoney(sale.netTotal ?? total - refundTotal);
  const date = sale.date || sale.saleDate || sale.createdAt || null;

  return {
    id: toId(sale._id),
    _id: toId(sale._id),
    billNumber: sale.billNumber || sale.billNo || '',
    invoiceNumber: sale.billNumber || sale.billNo || '',
    customerName: sale.customerName || sale.patient || 'Walk-in Customer',
    medicines,
    itemCount: medicines.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    subtotal,
    tax,
    discount,
    serviceFee,
    total,
    refundTotal,
    netTotal,
    soldBy: sale.soldBy || sale.servedBy || sale.createdBy?.name || 'Staff',
    paymentMethod: sale.paymentMethod || sale.payMethod || 'cash',
    payMethod: sale.payMethod || sale.paymentMethod || 'cash',
    status: sale.status || 'completed',
    refundStatus: sale.refundStatus || (sale.status === 'refunded' ? 'refunded' : 'none'),
    date,
    month: sale.month || (date ? new Date(date).getMonth() + 1 : null),
    year: sale.year || (date ? new Date(date).getFullYear() : null),
    createdAt: sale.createdAt || null,
    updatedAt: sale.updatedAt || null,
  };
}

function toSaleDetailResponse(sale) {
  const base = toSaleListResponse(sale);
  const items = Array.isArray(sale.items) && sale.items.length
    ? sale.items.map((item) => ({
        id: toId(item._id),
        medicineId: toId(item.medicineId),
        name: item.medicineSnapshot?.name || item.name || 'Unknown Medicine',
        displayName: item.medicineSnapshot?.displayName || item.medicineSnapshot?.name || item.name || 'Unknown Medicine',
        genericName: item.medicineSnapshot?.genericName || '',
        barcode: item.medicineSnapshot?.barcode || '',
        category: item.medicineSnapshot?.category || '',
        strength: item.medicineSnapshot?.strength || '',
        dosageForm: item.medicineSnapshot?.dosageForm || '',
        quantity: Number(item.quantity || 0),
        refundedQuantity: Number(item.refundedQuantity || 0),
        unitPrice: roundMoney(item.unitPrice ?? item.price ?? 0),
        price: roundMoney(item.unitPrice ?? item.price ?? 0),
        lineTotal: roundMoney(item.lineTotal ?? Number(item.quantity || 0) * Number(item.unitPrice ?? item.price ?? 0)),
        batchAllocations: Array.isArray(item.batchAllocations)
          ? item.batchAllocations.map((allocation) => ({
              inventoryId: toId(allocation.inventoryId),
              batchNumber: allocation.batchNumber || '',
              quantity: Number(allocation.quantity || 0),
              location: allocation.location || 'MAIN_STORE',
              expiryDate: allocation.expiryDate || null,
              sellingPrice:
                allocation.sellingPrice === null || allocation.sellingPrice === undefined
                  ? null
                  : roundMoney(allocation.sellingPrice),
              refundedQuantity: Number(allocation.refundedQuantity || 0),
            }))
          : [],
      }))
    : base.medicines.map((item) => ({
        id: null,
        medicineId: item.medicineId,
        name: item.name,
        displayName: item.name,
        genericName: '',
        barcode: item.barcode || '',
        category: '',
        strength: '',
        dosageForm: '',
        quantity: Number(item.quantity || 0),
        refundedQuantity: 0,
        unitPrice: roundMoney(item.price || 0),
        price: roundMoney(item.price || 0),
        lineTotal: roundMoney(item.lineTotal ?? Number(item.quantity || 0) * Number(item.price || 0)),
        batchAllocations: [],
      }));

  return {
    ...base,
    items,
    invoice: {
      number: base.billNumber,
      issuedAt: base.date,
      subtotal: base.subtotal,
      tax: base.tax,
      discount: base.discount,
      serviceFee: base.serviceFee,
      total: base.total,
      refundTotal: base.refundTotal,
      netTotal: base.netTotal,
      paymentMethod: base.paymentMethod,
      status: base.status,
    },
    notes: sale.notes || '',
    refunds: Array.isArray(sale.refunds)
      ? sale.refunds.map((refund) => ({
          id: toId(refund._id),
          refundNumber: refund.refundNumber || '',
          reason: refund.reason || '',
          notes: refund.notes || '',
          refundTotal: roundMoney(refund.refundTotal || 0),
          createdAt: refund.createdAt || null,
          createdBy: refund.createdBy || null,
          items: Array.isArray(refund.items)
            ? refund.items.map((item) => ({
                saleItemId: toId(item.saleItemId),
                medicineId: toId(item.medicineId),
                quantity: Number(item.quantity || 0),
                unitPrice: roundMoney(item.unitPrice || 0),
                lineTotal: roundMoney(item.lineTotal || 0),
              }))
            : [],
        }))
      : [],
    audit: {
      createdBy: sale.createdBy || null,
      updatedBy: sale.updatedBy || null,
      auditTrail: Array.isArray(sale.auditTrail) ? sale.auditTrail : [],
    },
  };
}

function toBillingMedicineLookup(medicine, overrides = {}) {
  const stockOnHand = Number(
    overrides.availableQuantity ??
      overrides.stock ??
      medicine?.inventorySnapshot?.stockOnHand ??
      medicine?.stock ??
      medicine?.quantity ??
      0
  );

  return {
    id: toId(medicine._id),
    _id: toId(medicine._id),
    medicineId: medicine.medicineId || '',
    name: medicine.displayName || medicine.name || 'Unknown Medicine',
    displayName: medicine.displayName || medicine.name || 'Unknown Medicine',
    genericName: medicine.genericName || medicine.generic_name || '',
    strength: medicine.strength || medicine.dosageStrength || '',
    dosageForm: medicine.dosageForm || '',
    category: medicine.category || 'General',
    barcode: medicine.barcode || '',
    price: roundMoney(medicine.unitPrice ?? medicine.price ?? 0),
    stock: stockOnHand,
    availableQuantity: stockOnHand,
    stockStatus: overrides.stockStatus || (stockOnHand > 0 ? 'available' : 'out_of_stock'),
    nextExpiryDate:
      overrides.nextExpiryDate || medicine?.inventorySnapshot?.nextExpiryDate || medicine?.expiryDate || null,
  };
}

module.exports = {
  toSaleListResponse,
  toSaleDetailResponse,
  toBillingMedicineLookup,
};
