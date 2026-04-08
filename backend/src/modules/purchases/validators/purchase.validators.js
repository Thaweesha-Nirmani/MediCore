const { body, param, query } = require('express-validator');
const validate = require('../../../validations/validate');

const listPurchases = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim().isLength({ max: 120 }),
  query('supplierId').optional().isMongoId(),
  query('orderStatus').optional().isIn(['draft', 'placed', 'partially_received', 'received', 'cancelled']),
  query('receiveStatus').optional().isIn(['not_received', 'partially_received', 'fully_received']),
  query('purchaseDateFrom').optional().isISO8601(),
  query('purchaseDateTo').optional().isISO8601(),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'purchaseDate', 'purchaseNumber', 'totalAmount']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('order').optional().isIn(['asc', 'desc']),
  query('includeDeleted').optional().isBoolean().toBoolean(),
  validate,
];

const purchaseById = [
  param('id').isMongoId(),
  validate,
];

const createPurchase = [
  body().isObject(),
  body('supplierId').optional({ checkFalsy: true }).isMongoId(),
  body('supplier').optional({ checkFalsy: true }).isMongoId(),
  body('purchaseDate').exists({ values: 'falsy' }).isISO8601(),
  body('expectedDeliveryDate').optional({ checkFalsy: true }).isISO8601(),
  body('orderStatus').optional({ checkFalsy: true }).isIn(['draft', 'placed']),
  body('notes').optional({ checkFalsy: true }).isString().trim().isLength({ max: 500 }),
  body('items').isArray({ min: 1 }),
  body('items.*.medicineId').exists({ values: 'falsy' }).isMongoId(),
  body('items.*.orderedQuantity').optional().isFloat({ gt: 0 }).toFloat(),
  body('items.*.quantity').optional().isFloat({ gt: 0 }).toFloat(),
  body('items.*.unitCost').optional().isFloat({ gt: 0 }).toFloat(),
  body('items.*.costPrice').optional().isFloat({ gt: 0 }).toFloat(),
  body('items.*.sellingPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  body('items.*.notes').optional({ checkFalsy: true }).isString().trim().isLength({ max: 300 }),
  body().custom((value) => {
    if (!value.supplierId && !value.supplier) {
      throw new Error('supplierId is required');
    }

    for (const item of value.items || []) {
      if (
        (item.orderedQuantity === undefined || item.orderedQuantity === null || item.orderedQuantity === '') &&
        (item.quantity === undefined || item.quantity === null || item.quantity === '')
      ) {
        throw new Error('Each purchase item requires orderedQuantity or quantity');
      }

      if (
        (item.unitCost === undefined || item.unitCost === null || item.unitCost === '') &&
        (item.costPrice === undefined || item.costPrice === null || item.costPrice === '')
      ) {
        throw new Error('Each purchase item requires unitCost or costPrice');
      }
    }

    return true;
  }),
  validate,
];

const updatePurchase = [
  param('id').isMongoId(),
  body().isObject(),
  body('supplierId').optional({ checkFalsy: true }).isMongoId(),
  body('supplier').optional({ checkFalsy: true }).isMongoId(),
  body('purchaseDate').optional({ checkFalsy: true }).isISO8601(),
  body('expectedDeliveryDate').optional({ checkFalsy: true }).isISO8601(),
  body('orderStatus').optional({ checkFalsy: true }).isIn(['draft', 'placed', 'cancelled']),
  body('notes').optional({ checkFalsy: true }).isString().trim().isLength({ max: 500 }),
  body('items').optional().isArray({ min: 1 }),
  body('items.*.medicineId').optional({ checkFalsy: true }).isMongoId(),
  body('items.*.orderedQuantity').optional().isFloat({ gt: 0 }).toFloat(),
  body('items.*.quantity').optional().isFloat({ gt: 0 }).toFloat(),
  body('items.*.unitCost').optional().isFloat({ gt: 0 }).toFloat(),
  body('items.*.costPrice').optional().isFloat({ gt: 0 }).toFloat(),
  body('items.*.sellingPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  body('items.*.notes').optional({ checkFalsy: true }).isString().trim().isLength({ max: 300 }),
  body().custom((value) => {
    for (const item of value.items || []) {
      if (
        item.orderedQuantity === undefined &&
        item.quantity === undefined &&
        item.unitCost === undefined &&
        item.costPrice === undefined &&
        item.notes === undefined &&
        item.sellingPrice === undefined
      ) {
        throw new Error('Each updated purchase item must include at least one editable field');
      }
    }

    return true;
  }),
  validate,
];

const receivePurchase = [
  param('id').isMongoId(),
  body().isObject(),
  body('receivedAt').optional({ checkFalsy: true }).isISO8601(),
  body('notes').optional({ checkFalsy: true }).isString().trim().isLength({ max: 500 }),
  body('items').isArray({ min: 1 }),
  body('items.*.purchaseItemId').optional({ checkFalsy: true }).isMongoId(),
  body('items.*.itemId').optional({ checkFalsy: true }).isMongoId(),
  body('items.*.quantityReceived').exists({ values: 'falsy' }).isFloat({ gt: 0 }).toFloat(),
  body('items.*.batchNumber').exists({ values: 'falsy' }).isString().trim().isLength({ min: 1, max: 80 }),
  body('items.*.expiryDate').exists({ values: 'falsy' }).isISO8601(),
  body('items.*.manufactureDate').optional({ checkFalsy: true }).isISO8601(),
  body('items.*.location').optional({ checkFalsy: true }).isString().trim().isLength({ max: 60 }),
  body('items.*.purchasePrice').optional({ checkFalsy: true }).isFloat({ gt: 0 }).toFloat(),
  body('items.*.sellingPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  body('items.*.notes').optional({ checkFalsy: true }).isString().trim().isLength({ max: 300 }),
  body('items.*.mergeIfExists').optional().isBoolean().toBoolean(),
  body().custom((value) => {
    for (const item of value.items || []) {
      if (!item.purchaseItemId && !item.itemId) {
        throw new Error('Each received item requires purchaseItemId');
      }
    }

    return true;
  }),
  validate,
];

module.exports = {
  listPurchases,
  purchaseById,
  createPurchase,
  updatePurchase,
  receivePurchase,
};
