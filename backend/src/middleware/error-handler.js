const { fail } = require('../core/api-response');
const env = require('../config/env');
const logger = require('../utils/logger');

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || error.status || 500;
  const rawMessage = error.message || 'Internal server error';
  const details = error.details || null;
  const message =
    statusCode >= 500 && env.nodeEnv === 'production'
      ? 'Internal server error'
      : rawMessage;

  if (statusCode >= 500) {
    logger.error('Unhandled backend error', { error });
  }

  return fail(res, statusCode, message, details);
}

module.exports = errorHandler;
