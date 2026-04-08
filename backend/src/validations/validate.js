const { validationResult } = require('express-validator');
const AppError = require('../core/app-error');

function validate(req, _res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return next(
    new AppError('Validation failed', 422, {
      fields: result.array(),
    })
  );
}

module.exports = validate;
