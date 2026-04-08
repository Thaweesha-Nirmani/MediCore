const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: process.env.ENV_FILE || path.resolve(__dirname, '../../.env'),
});

function toPositiveNumber(value, fallback, minimum = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
}

function normalizePathFromWorkspaceRoot(value, fallbackPath) {
  if (!value) {
    return path.resolve(__dirname, fallbackPath);
  }

  if (path.isAbsolute(value)) {
    return value;
  }

  return path.resolve(__dirname, '../../..', value);
}

function normalizeApiPrefix(value) {
  const normalized = String(value || '/api/v1').trim();

  if (!normalized) {
    return '/api/v1';
  }

  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function normalizeUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '');
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toPositiveNumber(process.env.PORT, 5000, 1),
  apiPrefix: normalizeApiPrefix(process.env.API_PREFIX),
  mongoUri: process.env.MONGO_URI || '',
  mongoServerSelectionTimeoutMs: toPositiveNumber(
    process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS,
    5000,
    1000
  ),
  mongoRetryDelayMs: toPositiveNumber(process.env.MONGO_RETRY_DELAY_MS, 5000, 1000),
  jwtSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || '',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshTokenExpiresInDays: toPositiveNumber(process.env.JWT_REFRESH_EXPIRES_IN_DAYS, 30, 1),
  allowPublicRegister: String(process.env.ALLOW_PUBLIC_REGISTER || 'false').toLowerCase() === 'true',
  corsOrigins: process.env.CORS_ORIGINS || '*',
  logLevel:
    process.env.LOG_LEVEL ||
    (String(process.env.NODE_ENV || 'development') === 'production' ? 'info' : 'debug'),
  uploadRoot: normalizePathFromWorkspaceRoot(process.env.UPLOAD_ROOT, '../../../uploads'),
  uploadMaxSizeBytes: toPositiveNumber(process.env.UPLOAD_MAX_SIZE_BYTES, 5 * 1024 * 1024, 1024),
  uploadPublicBaseUrl: normalizeUrl(process.env.UPLOAD_PUBLIC_BASE_URL),
};

module.exports = env;
