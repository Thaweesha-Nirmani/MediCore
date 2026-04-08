const { body } = require('express-validator');
const validate = require('../../../validations/validate');

const register = [
  body().isObject(),
  body('name').exists({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 120 }),
  body('email').exists({ values: 'falsy' }).isEmail().normalizeEmail(),
  body('password').exists({ values: 'falsy' }).isString().isLength({ min: 6, max: 100 }),
  body('contactNumber').optional({ nullable: true }).isString().trim().isLength({ max: 20 }),
  body('role').optional().isString().trim().isLength({ max: 40 }),
  body('status').optional().isString().trim().isLength({ max: 40 }),
  validate,
];

const login = [
  body().isObject(),
  body('email').exists({ values: 'falsy' }).isEmail().normalizeEmail(),
  body('password').exists({ values: 'falsy' }).isString().isLength({ min: 1, max: 100 }),
  validate,
];

const refresh = [
  body().isObject(),
  body('refreshToken').exists({ values: 'falsy' }).isString().trim().isLength({ min: 20, max: 500 }),
  validate,
];

const logout = [
  body().optional().isObject(),
  body('refreshToken').optional({ nullable: true }).isString().trim().isLength({ min: 20, max: 500 }),
  validate,
];

module.exports = {
  register,
  login,
  refresh,
  logout,
};
