const env = require('../config/env');

const LEVEL_PRIORITY = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function normalizeLevel(level) {
  const normalized = String(level || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(LEVEL_PRIORITY, normalized) ? normalized : 'info';
}

function getCurrentPriority() {
  return LEVEL_PRIORITY[normalizeLevel(env.logLevel)];
}

function serializeError(error) {
  if (!(error instanceof Error)) {
    return error;
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode || error.status || null,
    details: error.details || null,
  };
}

function serializeMeta(meta) {
  if (meta === undefined) {
    return undefined;
  }

  if (meta instanceof Error) {
    return serializeError(meta);
  }

  if (Array.isArray(meta)) {
    return meta.map(serializeMeta);
  }

  if (meta && typeof meta === 'object') {
    return Object.fromEntries(
      Object.entries(meta).map(([key, value]) => [key, serializeMeta(value)])
    );
  }

  return meta;
}

function shouldLog(level) {
  return LEVEL_PRIORITY[level] <= getCurrentPriority();
}

function write(level, message, meta) {
  if (!shouldLog(level)) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'th-mobile-backend',
    environment: env.nodeEnv,
    message,
  };

  const serializedMeta = serializeMeta(meta);

  if (serializedMeta !== undefined) {
    entry.meta = serializedMeta;
  }

  const stream = level === 'error' ? process.stderr : process.stdout;

  if (env.nodeEnv === 'production') {
    stream.write(`${JSON.stringify(entry)}\n`);
    return;
  }

  const suffix = serializedMeta !== undefined ? ` ${JSON.stringify(serializedMeta)}` : '';
  stream.write(`[backend] ${level.toUpperCase()} ${message}${suffix}\n`);
}

const logger = {
  error(message, meta) {
    write('error', message, meta);
  },
  warn(message, meta) {
    write('warn', message, meta);
  },
  info(message, meta) {
    write('info', message, meta);
  },
  debug(message, meta) {
    write('debug', message, meta);
  },
};

module.exports = logger;
