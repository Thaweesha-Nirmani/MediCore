const { body, param, query } = require('express-validator');
const validate = require('../../../validations/validate');

const listInventory = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim().isLength({ max: 120 }),
  query('medicineId').optional().isMongoId(),
  query('stockStatus')
    .optional()
    .isIn(['available', 'low_stock', 'out_of_stock', 'expired', 'damaged', 'quarantined', 'disposed', 'archived']),
  query('location').optional().isString().trim().isLength({ max: 60 }),
  query('batchNumber').optional().isString().trim().isLength({ max: 80 }),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'expiryDate', 'quantity', 'location', 'batchNumber']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('order').optional().isIn(['asc', 'desc']),
  query('includeArchived').optional().isBoolean().toBoolean(),
  validate,
];

const createInventory = [
  body().isObject(),
  body('medicineId').exists({ values: 'falsy' }).isMongoId(),
  body('batchNumber').exists({ values: 'falsy' }).isString().trim().isLength({ min: 1, max: 80 }),
  body('quantity').exists().isFloat({ min: 0 }).toFloat(),
  body('expiryDate').exists({ values: 'falsy' }).isISO8601(),
  body('manufactureDate').optional({ checkFalsy: true }).isISO8601(),
  body('purchasePrice').exists({ values: 'falsy' }).isFloat({ min: 0 }).toFloat(),
  body('sellingPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  body('location').optional({ checkFalsy: true }).isString().trim().isLength({ max: 60 }),
  body('supplierId').optional({ checkFalsy: true }).isMongoId(),
  body('reorderLevel').optional().isFloat({ min: 0 }).toFloat(),
  body('notes').optional({ checkFalsy: true }).isString().trim().isLength({ max: 400 }),
  body('mergeIfExists').optional().isBoolean().toBoolean(),
  validate,
];

const updateInventory = [
  param('id').isMongoId(),
  body().isObject(),
  body('medicineId').optional().isMongoId(),
  body('batchNumber').optional({ checkFalsy: true }).isString().trim().isLength({ min: 1, max: 80 }),
  body('quantity').optional().isFloat({ min: 0 }).toFloat(),
  body('expiryDate').optional({ checkFalsy: true }).isISO8601(),
  body('manufactureDate').optional({ checkFalsy: true }).isISO8601(),
  body('purchasePrice').optional().isFloat({ min: 0 }).toFloat(),
  body('sellingPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  body('location').optional({ checkFalsy: true }).isString().trim().isLength({ max: 60 }),
  body('supplierId').optional({ checkFalsy: true }).isMongoId(),
  body('reorderLevel').optional().isFloat({ min: 0 }).toFloat(),
  body('notes').optional({ checkFalsy: true }).isString().trim().isLength({ max: 400 }),
  body('adjustmentReason').optional({ checkFalsy: true }).isString().trim().isLength({ min: 3, max: 200 }),
  validate,
];

const adjustInventory = [
  body().isObject(),
  body('inventoryId').exists({ values: 'falsy' }).isMongoId(),
  body('reason').exists({ values: 'falsy' }).isString().trim().isLength({ min: 3, max: 200 }),
  body('action').optional({ checkFalsy: true }).isIn(['increase', 'decrease', 'correction', 'damage', 'dispose', 'transfer']),
  body('quantityChange').optional().isFloat(),
  body('newQuantity').optional().isFloat({ min: 0 }).toFloat(),
  body('toLocation').optional({ checkFalsy: true }).isString().trim().isLength({ max: 60 }),
  body().custom((value) => {
    const action = String(value.action || 'correction').toLowerCase();
    const hasQuantityChange =
      value.quantityChange !== undefined && value.quantityChange !== null && value.quantityChange !== '';
    const hasNewQuantity =
      value.newQuantity !== undefined && value.newQuantity !== null && value.newQuantity !== '';

    if (!hasQuantityChange && !hasNewQuantity) {
      throw new Error('Either quantityChange or newQuantity is required');
    }

    if (action === 'transfer' && !hasQuantityChange) {
      throw new Error('quantityChange is required for transfer adjustments');
    }

    if (action === 'transfer' && !value.toLocation) {
      throw new Error('toLocation is required for transfer adjustments');
    }

    return true;
  }),
  validate,
];

const itemById = [
  param('id').isMongoId(),
  validate,
];

const movements = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('medicineId').optional().isMongoId(),
  query('inventoryId').optional().isMongoId(),
  query('type').optional().isIn(['add', 'update', 'adjust', 'transfer_in', 'transfer_out', 'dispose', 'expire', 'sale', 'refund']),
  validate,
];

const medicineInventory = [
  param('medicineId').isMongoId(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
];

module.exports = {
  listInventory,
  createInventory,
  updateInventory,
  adjustInventory,
  itemById,
  movements,
  medicineInventory,
};
