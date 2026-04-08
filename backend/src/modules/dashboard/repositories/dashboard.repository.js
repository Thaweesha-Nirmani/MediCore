const MedicineCatalog = require('../../medicines/models/medicine-master.model');
const InventoryBatch = require('../../inventory/models/inventory-batch.model');
const InventoryMovement = require('../../inventory/models/inventory-movement.model');
const PurchaseOrder = require('../../purchases/models/purchase-order.model');
const SaleRecord = require('../../sales/models/sale-record.model');

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysAgo(days) {
  const date = startOfToday();
  date.setDate(date.getDate() - days);
  return date;
}

function matchSalesFrom(dateFrom) {
  return {
    status: { $ne: 'voided' },
    date: { $gte: dateFrom },
  };
}

function matchPurchasesFrom(dateFrom) {
  return {
    isDeleted: { $ne: true },
    purchaseDate: { $gte: dateFrom },
  };
}

async function aggregateSalesWindow(dateFrom) {
  const [summaryRow] = await SaleRecord.aggregate([
    { $match: matchSalesFrom(dateFrom) },
    {
      $unwind: {
        path: '$items',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
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
        totalSales: { $sum: '$netTotal' },
        unitsSold: { $sum: { $subtract: ['$itemQuantity', '$refundedQuantity'] } },
        averageSaleValue: { $avg: '$netTotal' },
      },
    },
  ]);

  return {
    saleCount: Number(summaryRow?.saleCount || 0),
    totalSales: Number(summaryRow?.totalSales || 0),
    unitsSold: Number(summaryRow?.unitsSold || 0),
    averageSaleValue: Number(summaryRow?.averageSaleValue || 0),
  };
}

async function aggregatePurchaseWindow(dateFrom) {
  const [summaryRow] = await PurchaseOrder.aggregate([
    { $match: matchPurchasesFrom(dateFrom) },
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

async function countActiveMedicines() {
  return MedicineCatalog.countDocuments({
    active: { $ne: false },
    isDeleted: { $ne: true },
  });
}

async function countLowStockMedicines() {
  const today = startOfToday();
  const result = await InventoryBatch.aggregate([
    {
      $match: {
        active: true,
        $or: [{ stockStatus: { $exists: false } }, { stockStatus: { $nin: ['disposed', 'damaged', 'quarantined', 'archived'] } }],
        expiryDate: { $gte: today },
      },
    },
    {
      $match: {
        $or: [
          { stockStatus: 'low_stock' },
          {
            $expr: {
              $and: [
                { $gt: ['$quantity', 0] },
                { $lte: ['$quantity', { $ifNull: ['$reorderLevel', 0] }] },
              ],
            },
          },
        ],
      },
    },
    { $group: { _id: '$medicineId' } },
    { $count: 'count' },
  ]);

  return Number(result[0]?.count || 0);
}

async function countExpiredStockMedicines() {
  const today = startOfToday();
  const result = await InventoryBatch.aggregate([
    {
      $match: {
        active: true,
        quantity: { $gt: 0 },
        expiryDate: { $lt: today },
      },
    },
    { $group: { _id: '$medicineId' } },
    { $count: 'count' },
  ]);

  return Number(result[0]?.count || 0);
}

async function getSalesSummary() {
  const today = startOfToday();
  const sevenDaysAgo = daysAgo(6);
  const thirtyDaysAgo = daysAgo(29);

  const [todaySummary, last7Days, last30Days] = await Promise.all([
    aggregateSalesWindow(today),
    aggregateSalesWindow(sevenDaysAgo),
    aggregateSalesWindow(thirtyDaysAgo),
  ]);

  return {
    today: todaySummary,
    last7Days,
    last30Days,
  };
}

async function getPurchaseSummary() {
  const thirtyDaysAgo = daysAgo(29);
  const [last30Days, openOrders, receivedOrders] = await Promise.all([
    aggregatePurchaseWindow(thirtyDaysAgo),
    PurchaseOrder.countDocuments({
      isDeleted: { $ne: true },
      orderStatus: { $in: ['draft', 'placed', 'partially_received'] },
    }),
    PurchaseOrder.countDocuments({
      isDeleted: { $ne: true },
      orderStatus: 'received',
    }),
  ]);

  return {
    last30Days,
    openOrders: Number(openOrders || 0),
    receivedOrders: Number(receivedOrders || 0),
  };
}

async function getRecentSales(limit = 10) {
  return SaleRecord.find({
    status: { $ne: 'voided' },
  })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .lean();
}

async function getRecentPurchases(limit = 10) {
  return PurchaseOrder.find({
    isDeleted: { $ne: true },
  })
    .sort({ updatedAt: -1, purchaseDate: -1 })
    .limit(limit)
    .lean();
}

async function getRecentInventoryMovements(limit = 10) {
  return InventoryMovement.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

async function getFastMovingMedicines(days = 30, limit = 5) {
  const dateFrom = daysAgo(days - 1);

  return SaleRecord.aggregate([
    { $match: matchSalesFrom(dateFrom) },
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

module.exports = {
  countActiveMedicines,
  countLowStockMedicines,
  countExpiredStockMedicines,
  getSalesSummary,
  getPurchaseSummary,
  getRecentSales,
  getRecentPurchases,
  getRecentInventoryMovements,
  getFastMovingMedicines,
};
