const { body, param, query } = require('express-validator');
const validate = require('../../../validations/validate');

const allowedSortFields = [
  'createdAt',
  'updatedAt',
  'medicineId',
  'name',
  'category',
  'supplier',
  'price',
  'unitPrice',
  'quantity',
  'expiryDate',
];
const allowedSortOrders = ['asc', 'desc'];
const allowedExpiryStatuses = [
  'expired',
  'expiring_soon',
  'expiring_in_7_days',
  'expiring_in_30_days',
  'safe',
  'valid',
];
const allowedStockLevels = ['available', 'low', 'low_stock', 'out_of_stock'];
const acceptsDatasetDate = (value) => {
  if (value === undefined || value === null || value === '') {
    return true;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(String(value).trim()) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(value).trim());
};

const listMedicines = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('top').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim().isLength({ max: 120 }),
  query('q').optional().isString().trim().isLength({ max: 120 }),
  query('category').optional().isString().trim().isLength({ max: 100 }),
  query('supplier').optional().isString().trim().isLength({ max: 120 }),
  query('status').optional().isString().trim().isLength({ max: 30 }),
  query('sortBy').optional().isIn(allowedSortFields),
  query('sortOrder').optional().isIn(allowedSortOrders),
  query('expiryStatus').optional().isIn(allowedExpiryStatuses),
  query('stockLevel').optional().isIn(allowedStockLevels),
  query('includeDeleted').optional().isBoolean().toBoolean(),
  validate,
];

const createMedicine = [
  body().isObject(),
  body('name').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
  body('genericName').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
  body('generic_name').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
  body('brandName').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
  body('brand_name').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
  body('category').optional({ checkFalsy: true }).isString().trim().isLength({ max: 100 }),
  body('supplier').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
  body('medicineId').optional({ checkFalsy: true }).isString().trim().isLength({ min: 2, max: 64 }),
  body('medicine_id').optional({ checkFalsy: true }).isLength({ min: 1, max: 64 }),
  body('barcode').optional({ checkFalsy: true }).isString().trim().isLength({ max: 64 }),
  body('manufacturer').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
  body('description').optional({ checkFalsy: true }).isString().trim().isLength({ max: 500 }),
  body('unitPrice').optional().isFloat({ gt: 0 }).toFloat(),
  body('price').optional().isFloat({ gt: 0 }).toFloat(),
  body('unit_price_LKR').optional().isFloat({ gt: 0 }).toFloat(),
  body('restockThreshold').optional().isFloat({ min: 0 }).toFloat(),
  body('restock_threshold').optional().isFloat({ min: 0 }).toFloat(),
  body('threshold').optional().isFloat({ min: 0 }).toFloat(),
  body('leadTimeDays').optional().isInt({ min: 0 }).toInt(),
  body('lead_time_days').optional().isInt({ min: 0 }).toInt(),
  body('stockQty').optional().isFloat({ min: 0 }).toFloat(),
  body('stock_qty').optional().isFloat({ min: 0 }).toFloat(),
  body('quantity').optional().isFloat({ min: 0 }).toFloat(),
  body('stock').optional().isFloat({ min: 0 }).toFloat(),
  body('batchNumber').optional({ checkFalsy: true }).isString().trim().isLength({ max: 80 }),
  body('batch_number').optional({ checkFalsy: true }).isString().trim().isLength({ max: 80 }),
  body('batch_id').optional({ checkFalsy: true }).isString().trim().isLength({ max: 80 }),
  body('manufactureDate').optional({ checkFalsy: true }).custom(acceptsDatasetDate),
  body('manufacture_date').optional({ checkFalsy: true }).custom(acceptsDatasetDate),
  body('expiryDate').optional({ checkFalsy: true }).custom(acceptsDatasetDate),
  body('expiry_date').optional({ checkFalsy: true }).custom(acceptsDatasetDate),
  body().custom((payload) => {
    const identity = payload.name || payload.brandName || payload.brand_name || payload.genericName || payload.generic_name;

    if (!identity || !String(identity).trim()) {
      throw new Error('Either brand_name or generic_name is required');
    }

    const rawPrice = payload.unitPrice ?? payload.price ?? payload.unit_price_LKR;
    const parsedPrice = Number(rawPrice);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      throw new Error('unit_price_LKR must be greater than 0');
    }

    const rawQty = payload.stockQty ?? payload.stock_qty ?? payload.quantity ?? payload.stock;
    const parsedQty = Number(rawQty);

    if (!Number.isFinite(parsedQty) || parsedQty < 0) {
      throw new Error('stock_qty must be 0 or greater');
    }

    const manufactureDate = new Date(payload.manufactureDate ?? payload.manufacture_date);
    const expiryDate = new Date(payload.expiryDate ?? payload.expiry_date);

    if (manufactureDate > expiryDate) {
      throw new Error('manufacture_date must be before expiry_date');
    }

    return true;
  }),
  validate,
];

const updateMedicine = [
  param('id').isMongoId(),
  body().isObject(),
  body('name').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
  body('genericName').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
  body('generic_name').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
  body('brandName').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
  body('brand_name').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
  body('medicineId').optional({ checkFalsy: true }).isString().trim().isLength({ min: 2, max: 64 }),
  body('medicine_id').optional({ checkFalsy: true }).isLength({ min: 1, max: 64 }),
  body('category').optional({ checkFalsy: true }).isString().trim().isLength({ max: 100 }),
  body('supplier').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
  body('barcode').optional({ checkFalsy: true }).isString().trim().isLength({ max: 64 }),
  body('manufacturer').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
  body('description').optional({ checkFalsy: true }).isString().trim().isLength({ max: 500 }),
  body('unitPrice').optional().isFloat({ gt: 0 }).toFloat(),
  body('price').optional().isFloat({ gt: 0 }).toFloat(),
  body('unit_price_LKR').optional().isFloat({ gt: 0 }).toFloat(),
  body('restockThreshold').optional().isFloat({ min: 0 }).toFloat(),
  body('restock_threshold').optional().isFloat({ min: 0 }).toFloat(),
  body('threshold').optional().isFloat({ min: 0 }).toFloat(),
  body('leadTimeDays').optional().isInt({ min: 0 }).toInt(),
  body('lead_time_days').optional().isInt({ min: 0 }).toInt(),
  body('stockQty').optional().isFloat({ min: 0 }).toFloat(),
  body('stock_qty').optional().isFloat({ min: 0 }).toFloat(),
  body('quantity').optional().isFloat({ min: 0 }).toFloat(),
  body('stock').optional().isFloat({ min: 0 }).toFloat(),
  body('batchNumber').optional({ checkFalsy: true }).isString().trim().isLength({ max: 80 }),
  body('batch_number').optional({ checkFalsy: true }).isString().trim().isLength({ max: 80 }),
  body('batch_id').optional({ checkFalsy: true }).isString().trim().isLength({ max: 80 }),
  body('manufactureDate').optional({ checkFalsy: true }).custom(acceptsDatasetDate),
  body('manufacture_date').optional({ checkFalsy: true }).custom(acceptsDatasetDate),
  body('expiryDate').optional({ checkFalsy: true }).custom(acceptsDatasetDate),
  body('expiry_date').optional({ checkFalsy: true }).custom(acceptsDatasetDate),
  body().custom((payload) => {
    const rawPrice = payload.unitPrice ?? payload.price ?? payload.unit_price_LKR;

    if (rawPrice !== undefined && rawPrice !== null && rawPrice !== '') {
      const parsedPrice = Number(rawPrice);

      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        throw new Error('unit_price_LKR must be greater than 0');
      }
    }

    const rawQty = payload.stockQty ?? payload.stock_qty ?? payload.quantity ?? payload.stock;

    if (rawQty !== undefined && rawQty !== null && rawQty !== '') {
      const parsedQty = Number(rawQty);

      if (!Number.isFinite(parsedQty) || parsedQty < 0) {
        throw new Error('stock_qty must be 0 or greater');
      }
    }

    const manufactureRaw = payload.manufactureDate ?? payload.manufacture_date;
    const expiryRaw = payload.expiryDate ?? payload.expiry_date;

    if (manufactureRaw && expiryRaw && new Date(manufactureRaw) > new Date(expiryRaw)) {
      throw new Error('manufacture_date must be before expiry_date');
    }

    return true;
  }),
  validate,
];

const medicineById = [param('id').isMongoId(), validate];

const barcodeLookup = [
  param('barcode').isString().trim().isLength({ min: 3, max: 64 }),
  validate,
];

const autocomplete = [
  query('q').exists({ values: 'falsy' }).isString().trim().isLength({ min: 1, max: 120 }),
  query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
  validate,
];

const duplicateCheck = [
  query('excludeId').optional().isMongoId(),
  query('batchNumber').optional({ checkFalsy: true }).isString().trim().isLength({ max: 80 }),
  query().custom((value) => {
    if (!value.batchNumber) {
      throw new Error('Provide batchNumber for duplicate checking');
    }

    return true;
  }),
  validate,
];

const deleteMedicine = [param('id').isMongoId(), validate];

const restoreMedicine = [param('id').isMongoId(), validate];

module.exports = {
  listMedicines,
  createMedicine,
  updateMedicine,
  medicineById,
  barcodeLookup,
  autocomplete,
  duplicateCheck,
  deleteMedicine,
  restoreMedicine,
};
