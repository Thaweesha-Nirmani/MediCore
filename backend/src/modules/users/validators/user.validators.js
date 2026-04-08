const { body, param, query } = require('express-validator');
const validate = require('../../../validations/validate');

const listUsers = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim().isLength({ max: 120 }),
  query('role').optional().isString().trim().isLength({ max: 40 }),
  query('status').optional().isString().trim().isLength({ max: 40 }),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'email', 'role', 'status', 'lastLogin']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('order').optional().isIn(['asc', 'desc']),
  validate,
];

const userById = [
  param('id').isMongoId(),
  validate,
];

const updateUser = [
  param('id').isMongoId(),
  body().isObject(),
  body('name').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('contactNumber').optional({ nullable: true }).isString().trim().isLength({ max: 20 }),
  body('color').optional({ nullable: true }).isString().trim().isLength({ max: 20 }),
  body('role').optional().isString().trim().isLength({ max: 40 }),
  validate,
];

const updateUserStatus = [
  param('id').isMongoId(),
  body().isObject(),
  body('status').exists({ values: 'falsy' }).isString().trim().isLength({ min: 3, max: 40 }),
  validate,
];

module.exports = {
  listUsers,
  userById,
  updateUser,
  updateUserStatus,
};
