const { body, param, query } = require('express-validator');
const validate = require('../../../validations/validate');

const listSuppliers = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim().isLength({ max: 120 }),
  query('status').optional().isIn(['Active', 'Inactive', 'Archived', 'active', 'inactive', 'archived']),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('order').optional().isIn(['asc', 'desc']),
  query('includeDeleted').optional().isBoolean().toBoolean(),
  validate,
];

const supplierById = [
  param('id').isMongoId(),
  validate,
];

const createSupplier = [
  body().isObject(),
  body('name').exists({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 120 }),
  body('contactNumber').optional({ checkFalsy: true }).isString().trim().isLength({ min: 7, max: 25 }),
  body('contact').optional({ checkFalsy: true }).isString().trim().isLength({ min: 7, max: 25 }),
  body('contactPerson').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
  body('alternateContact').optional({ checkFalsy: true }).isString().trim().isLength({ min: 7, max: 25 }),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body('status').optional({ checkFalsy: true }).isIn(['Active', 'Inactive', 'Archived', 'active', 'inactive', 'archived']),
  body('notes').optional({ checkFalsy: true }).isString().trim().isLength({ max: 500 }),
  body('address').optional().isObject(),
  body('street').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
  body('city').optional({ checkFalsy: true }).isString().trim().isLength({ max: 80 }),
  body('state').optional({ checkFalsy: true }).isString().trim().isLength({ max: 80 }),
  body('postalCode').optional({ checkFalsy: true }).isString().trim().isLength({ max: 30 }),
  body('country').optional({ checkFalsy: true }).isString().trim().isLength({ max: 80 }),
  body().custom((value) => {
    if (!value.contactNumber && !value.contact) {
      throw new Error('contactNumber is required');
    }

    return true;
  }),
  validate,
];

const updateSupplier = [
  param('id').isMongoId(),
  body().isObject(),
  body('name').optional({ checkFalsy: true }).isString().trim().isLength({ min: 2, max: 120 }),
  body('contactNumber').optional({ checkFalsy: true }).isString().trim().isLength({ min: 7, max: 25 }),
  body('contact').optional({ checkFalsy: true }).isString().trim().isLength({ min: 7, max: 25 }),
  body('contactPerson').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
  body('alternateContact').optional({ checkFalsy: true }).isString().trim().isLength({ min: 7, max: 25 }),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body('status').optional({ checkFalsy: true }).isIn(['Active', 'Inactive', 'Archived', 'active', 'inactive', 'archived']),
  body('notes').optional({ checkFalsy: true }).isString().trim().isLength({ max: 500 }),
  body('address').optional().isObject(),
  body('street').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
  body('city').optional({ checkFalsy: true }).isString().trim().isLength({ max: 80 }),
  body('state').optional({ checkFalsy: true }).isString().trim().isLength({ max: 80 }),
  body('postalCode').optional({ checkFalsy: true }).isString().trim().isLength({ max: 30 }),
  body('country').optional({ checkFalsy: true }).isString().trim().isLength({ max: 80 }),
  validate,
];

const deleteSupplier = [
  param('id').isMongoId(),
  validate,
];

module.exports = {
  listSuppliers,
  supplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
