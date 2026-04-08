const { body, param, query } = require('express-validator');
const validate = require('../../../validations/validate');

const listSales = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim().isLength({ max: 120 }),
  query('status').optional().isIn(['completed', 'refunded', 'partially_refunded', 'voided', 'paid']),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('sortBy').optional().isIn(['date', 'createdAt', 'updatedAt', 'billNumber', 'customerName', 'total']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('order').optional().isIn(['asc', 'desc']),
  validate,
];

const saleById = [
  param('id').isMongoId(),
  validate,
];

const refundSale = [
  param('id').isMongoId(),
  body().isObject(),
  body('reason').isString().trim().isLength({ min: 3, max: 240 }),
  body('notes').optional({ checkFalsy: true }).isString().trim().isLength({ max: 400 }),
  body('items').optional().isArray({ min: 1 }),
  body('items.*.saleItemId').optional({ checkFalsy: true }).isMongoId(),
  body('items.*.medicineId').optional({ checkFalsy: true }).isMongoId(),
  body('items.*.quantity').optional().isFloat({ gt: 0 }).toFloat(),
  body().custom((value) => {
    if (!Array.isArray(value.items) || !value.items.length) {
      return true;
    }

    for (const item of value.items) {
      if (!item.saleItemId && !item.medicineId) {
        throw new Error('Each refund item must include saleItemId or medicineId');
      }
    }

    return true;
  }),
  validate,
];

const createSale = [
  body().isObject(),
  body('billNumber').optional({ checkFalsy: true }).isString().trim().isLength({ max: 60 }),
  body('customerName').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
  body('soldBy').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
  body('notes').optional({ checkFalsy: true }).isString().trim().isLength({ max: 400 }),
  body('paymentMethod').optional({ checkFalsy: true }).isString().trim().isLength({ max: 40 }),
  body('payMethod').optional({ checkFalsy: true }).isString().trim().isLength({ max: 40 }),
  body('subtotal').optional().isFloat({ min: 0 }).toFloat(),
  body('discount').optional().isFloat({ min: 0 }).toFloat(),
  body('tax').optional().isFloat({ min: 0 }).toFloat(),
  body('serviceFee').optional().isFloat({ min: 0 }).toFloat(),
  body('total').optional().isFloat({ min: 0 }).toFloat(),
  body('items').optional().isArray({ min: 1 }),
  body('medicines').optional().isArray({ min: 1 }),
  body('items.*.medicineId').optional({ checkFalsy: true }).isMongoId(),
  body('items.*.medicine').optional({ checkFalsy: true }).isMongoId(),
  body('items.*.quantity').optional().isFloat({ gt: 0 }).toFloat(),
  body('items.*.qty').optional().isFloat({ gt: 0 }).toFloat(),
  body('items.*.price').optional().isFloat({ min: 0 }).toFloat(),
  body('items.*.unitPrice').optional().isFloat({ min: 0 }).toFloat(),
  body('items.*.lineTotal').optional().isFloat({ min: 0 }).toFloat(),
  body('items.*.total').optional().isFloat({ min: 0 }).toFloat(),
  body('medicines.*.medicineId').optional({ checkFalsy: true }).isMongoId(),
  body('medicines.*.medicine').optional({ checkFalsy: true }).isMongoId(),
  body('medicines.*.quantity').optional().isFloat({ gt: 0 }).toFloat(),
  body('medicines.*.qty').optional().isFloat({ gt: 0 }).toFloat(),
  body('medicines.*.price').optional().isFloat({ min: 0 }).toFloat(),
  body('medicines.*.unitPrice').optional().isFloat({ min: 0 }).toFloat(),
  body('medicines.*.lineTotal').optional().isFloat({ min: 0 }).toFloat(),
  body('medicines.*.total').optional().isFloat({ min: 0 }).toFloat(),
  body().custom((value) => {
    const items = Array.isArray(value.items) && value.items.length
      ? value.items
      : Array.isArray(value.medicines) && value.medicines.length
        ? value.medicines
        : [];

    if (!items.length) {
      throw new Error('At least one sale item is required');
    }

    for (const item of items) {
      const medicineId = item.medicineId || item.medicine;

      if (!medicineId) {
        throw new Error('Each sale item must include medicineId');
      }
    }

    return true;
  }),
  validate,
];

const searchMedicines = [
  query('q').optional().isString().trim().isLength({ max: 120 }),
  query('search').optional().isString().trim().isLength({ max: 120 }),
  query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
  query('includeOutOfStock').optional().isBoolean().toBoolean(),
  validate,
];

const barcodeLookup = [
  param('barcode').isString().trim().isLength({ min: 1, max: 80 }),
  validate,
];

module.exports = {
  listSales,
  saleById,
  createSale,
  refundSale,
  searchMedicines,
  barcodeLookup,
};
