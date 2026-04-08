const { body, param, query } = require('express-validator');

const validate = require('../../../validations/validate');

const listReviews = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim().isLength({ max: 120 }),
  query('moduleSource').optional().isString().trim().isLength({ max: 40 }),
  query('status').optional().isIn(['open', 'acknowledged', 'resolved', 'archived']),
  query('mine').optional().isBoolean().toBoolean(),
  query('includeArchived').optional().isBoolean().toBoolean(),
  validate,
];

const reviewById = [
  param('id').isMongoId(),
  validate,
];

const createReview = [
  body().isObject(),
  body('title').exists({ values: 'falsy' }).isString().trim().isLength({ min: 3, max: 120 }),
  body('content').exists({ values: 'falsy' }).isString().trim().isLength({ min: 5, max: 2000 }),
  body('rating').exists({ values: 'falsy' }).isFloat({ min: 1, max: 5 }).toFloat(),
  body('moduleSource').optional({ checkFalsy: true }).isString().trim().isLength({ max: 40 }),
  body('status').optional({ checkFalsy: true }).isIn(['open', 'acknowledged', 'resolved']),
  validate,
];

const updateReview = [
  param('id').isMongoId(),
  body().isObject(),
  body('title').optional({ checkFalsy: true }).isString().trim().isLength({ min: 3, max: 120 }),
  body('content').optional({ checkFalsy: true }).isString().trim().isLength({ min: 5, max: 2000 }),
  body('rating').optional().isFloat({ min: 1, max: 5 }).toFloat(),
  body('moduleSource').optional({ checkFalsy: true }).isString().trim().isLength({ max: 40 }),
  body('status').optional({ checkFalsy: true }).isIn(['open', 'acknowledged', 'resolved', 'archived']),
  validate,
];

module.exports = {
  listReviews,
  reviewById,
  createReview,
  updateReview,
};
