const InventoryBatch = require('../../inventory/models/inventory-batch.model');
const PurchaseOrder = require('../../purchases/models/purchase-order.model');
const SaleRecord = require('../../sales/models/sale-record.model');

function startOfDay(value) {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value) {
  const date = value ? new Date(value) : new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function salesMatch(range) {
  return {
    status: { $ne: 'voided' },
    date: {
      $gte: startOfDay(range.dateFrom),
      $lte: endOfDay(range.dateTo),
    },
  };
}

function purchaseMatch(range) {
  return {
    isDeleted: { $ne: true },
    purchaseDate: {
      $gte: startOfDay(range.dateFrom),
      $lte: endOfDay(range.dateTo),
    },
  };
}

async function getSalesSummary(range) {
  const [summaryRow, statusBreakdown] = await Promise.all([
    SaleRecord.aggregate([
      { $match: salesMatch(range) },
      {
        $unwind: {
          path: '$items',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$_id',
          grossTotal: { $first: '$total' },
          refundTotal: { $first: { $ifNull: ['$refundTotal', 0] } },
          netTotal: { $first: { $ifNull: ['$netTotal', '$total'] } },
          itemQuantity: {
            $sum: {
              $ifNull: ['$items.quantity', 0],
            },
          },
          refundedQuantity: {
            $sum: {
              $ifNull: ['$items.refundedQuantity', 0],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          saleCount: { $sum: 1 },
          grossTotal: { $sum: '$grossTotal' },
          refundTotal: { $sum: '$refundTotal' },
          netTotal: { $sum: '$netTotal' },
          unitsSold: { $sum: { $subtract: ['$itemQuantity', '$refundedQuantity'] } },
          averageSaleValue: { $avg: '$netTotal' },
        },
      },
    ]),
    SaleRecord.aggregate([
      { $match: salesMatch(range) },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: { $ifNull: ['$netTotal', '$total'] } },
        },
      },
      { $sort: { count: -1, _id: 1 } },
    ]),
  ]);

  return {
    saleCount: Number(summaryRow[0]?.saleCount || 0),
    grossTotal: Number(summaryRow[0]?.grossTotal || 0),
    refundTotal: Number(summaryRow[0]?.refundTotal || 0),
    netTotal: Number(summaryRow[0]?.netTotal || 0),
    unitsSold: Number(summaryRow[0]?.unitsSold || 0),
    averageSaleValue: Number(summaryRow[0]?.averageSaleValue || 0),
    statusBreakdown: statusBreakdown.map((item) => ({
      status: item._id || 'unknown',
      count: Number(item.count || 0),
      total: Number(item.total || 0),
    })),
  };
}

async function getSalesPaymentMethods(range) {
  return SaleRecord.aggregate([
    { $match: salesMatch(range) },
    {
      $group: {
        _id: '$paymentMethod',
        saleCount: { $sum: 1 },
        grossAmount: { $sum: '$total' },
        refundAmount: { $sum: { $ifNull: ['$refundTotal', 0] } },
        totalAmount: { $sum: { $ifNull: ['$netTotal', '$total'] } },
      },
    },
    { $sort: { totalAmount: -1, saleCount: -1, _id: 1 } },
  ]);
}

async function getTopSellingMedicines(range, limit = 5) {
  return SaleRecord.aggregate([
    { $match: salesMatch(range) },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.medicineId',
        medicineId: { $first: '$items.medicineId' },
        medicineSnapshot: { $first: '$items.medicineSnapshot' },
        unitsSold: {
          $sum: {
            $subtract: [
              { $ifNull: ['$items.quantity', 0] },
              { $ifNull: ['$items.refundedQuantity', 0] },
            ],
          },
        },
        revenue: {
          $sum: {
            $multiply: [
              {
                $subtract: [
                  { $ifNull: ['$items.quantity', 0] },
                  { $ifNull: ['$items.refundedQuantity', 0] },
                ],
              },
              { $ifNull: ['$items.unitPrice', 0] },
            ],
          },
        },
        invoiceCount: { $sum: 1 },
      },
    },
    { $sort: { unitsSold: -1, revenue: -1 } },
    { $limit: limit },
  ]);
}

async function getSalesTimeline(range) {
  return SaleRecord.aggregate([
    { $match: salesMatch(range) },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$date',
          },
        },
        saleCount: { $sum: 1 },
        totalAmount: { $sum: { $ifNull: ['$netTotal', '$total'] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

async function listInventoryBatches(query = {}) {
  const filter = {};

  if (query.location) {
    filter.location = query.location;
  }

  if (query.includeInactive !== true) {
    filter.active = true;
  }

  return InventoryBatch.find(filter)
    .sort({ expiryDate: 1, createdAt: -1 })
    .populate('medicineId', 'medicineId name displayName genericName category barcode')
    .lean();
}

async function getPurchaseSummary(range) {
  const [summaryRow] = await PurchaseOrder.aggregate([
    { $match: purchaseMatch(range) },
    {
      $unwind: {
        path: '$items',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        totalAmount: { $first: '$totalAmount' },
        orderedQuantity: {
          $sum: {
            $ifNull: ['$items.orderedQuantity', 0],
          },
        },
        receivedQuantity: {
          $sum: {
            $ifNull: ['$items.receivedQuantity', 0],
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        purchaseCount: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        unitsOrdered: { $sum: '$orderedQuantity' },
        unitsReceived: { $sum: '$receivedQuantity' },
      },
    },
  ]);

  return {
    purchaseCount: Number(summaryRow?.purchaseCount || 0),
    totalAmount: Number(summaryRow?.totalAmount || 0),
    unitsOrdered: Number(summaryRow?.unitsOrdered || 0),
    unitsReceived: Number(summaryRow?.unitsReceived || 0),
  };
}

async function getPurchaseTimeline(range) {
  return PurchaseOrder.aggregate([
    { $match: purchaseMatch(range) },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$purchaseDate',
          },
        },
        purchaseCount: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

async function getTopSuppliers(range, limit = 5) {
  return PurchaseOrder.aggregate([
    { $match: purchaseMatch(range) },
    {
      $group: {
        _id: '$supplierId',
        supplierName: { $first: '$supplierSnapshot.name' },
        purchaseCount: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
      },
    },
    { $sort: { totalAmount: -1, purchaseCount: -1 } },
    { $limit: limit },
  ]);
}

async function getPurchaseStatusBreakdown(range) {
  return PurchaseOrder.aggregate([
    { $match: purchaseMatch(range) },
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
      },
    },
    { $sort: { count: -1, _id: 1 } },
  ]);
}

module.exports = {
  getSalesSummary,
  getSalesPaymentMethods,
  getTopSellingMedicines,
  getSalesTimeline,
  listInventoryBatches,
  getPurchaseSummary,
  getPurchaseTimeline,
  getTopSuppliers,
  getPurchaseStatusBreakdown,
};
