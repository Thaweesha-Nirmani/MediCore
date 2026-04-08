const { body, param } = require('express-validator');

const validate = require('../../../validations/validate');

const uploadBase64 = [
  body().isObject(),
  body('fileName').isString().trim().isLength({ min: 1, max: 180 }),
  body('mimeType').isString().trim().isLength({ min: 3, max: 120 }),
  body('base64Data').isString().trim().isLength({ min: 8 }),
  body('folder').optional({ checkFalsy: true }).isString().trim().isLength({ max: 60 }),
  body('purpose').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
  body('linkedEntity').optional().isObject(),
  body('linkedEntity.type').optional({ checkFalsy: true }).isString().trim().isLength({ max: 60 }),
  body('linkedEntity.id').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
  validate,
];

const uploadById = [
  param('id').isMongoId(),
  validate,
];

module.exports = {
  uploadBase64,
  uploadById,
};
