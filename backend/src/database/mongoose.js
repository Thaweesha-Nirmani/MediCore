require('dns').setServers(['8.8.8.8', '8.8.4.4']); // Force Google DNS for SRV resolution
const mongoose = require('mongoose');

const env = require('../config/env');
const logger = require('../utils/logger');

mongoose.set('bufferCommands', false);

const databaseState = {
  configured: Boolean(env.mongoUri),
  ready: false,
  status: env.mongoUri ? 'idle' : 'unconfigured',
  attempts: 0,
  lastAttemptAt: null,
  lastConnectedAt: null,
  lastDisconnectedAt: null,
  lastErrorAt: null,
  lastErrorMessage: null,
  retryDelayMs: env.mongoRetryDelayMs,
};

let connectPromise = null;
let reconnectTimer = null;
let shuttingDown = false;

function nowIso() {
  return new Date().toISOString();
}

function setState(partial) {
  Object.assign(databaseState, partial);
}

function getDatabaseState() {
  return { ...databaseState };
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect() {
  if (shuttingDown || !env.mongoUri || reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectDatabase({ allowRetry: true }).catch(() => {
      // Retry scheduling is handled inside connectDatabase and connection events.
    });
  }, env.mongoRetryDelayMs);

  logger.warn('MongoDB reconnect scheduled', {
    retryDelayMs: env.mongoRetryDelayMs,
  });
}

function captureError(error) {
  return {
    lastErrorAt: nowIso(),
    lastErrorMessage: error?.message || 'Unknown database error',
  };
}

async function connectInstance(instance, label) {
  if (!instance) {
    return null;
  }

  if (instance.connection.readyState === 1) {
    setState({
      ready: true,
      status: 'connected',
      lastConnectedAt: databaseState.lastConnectedAt || nowIso(),
      lastErrorMessage: null,
    });
    return instance.connection;
  }

  if (connectPromise) {
    return connectPromise;
  }

  setState({
    status: 'connecting',
    lastAttemptAt: nowIso(),
    attempts: databaseState.attempts + 1,
  });

  logger.info('Attempting MongoDB connection', {
    label,
    attempt: databaseState.attempts,
    serverSelectionTimeoutMs: env.mongoServerSelectionTimeoutMs,
  });

  connectPromise = instance
    .connect(env.mongoUri, {
      serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to avoid potential IPv6 resolution issues
      autoIndex: env.nodeEnv !== 'production',
    })
    .then((connection) => {
      clearReconnectTimer();
      setState({
        ready: true,
        status: 'connected',
        lastConnectedAt: nowIso(),
        lastErrorMessage: null,
      });
      logger.info('MongoDB connected', { label });
      return connection;
    })
    .catch((error) => {
      if (shuttingDown) {
        setState({
          ready: false,
          status: env.mongoUri ? 'disconnected' : 'unconfigured',
          lastDisconnectedAt: nowIso(),
          lastErrorMessage: null,
        });
        logger.info('MongoDB connection attempt ended during shutdown');
        return null;
      }

      setState({
        ready: false,
        status: 'error',
        ...captureError(error),
      });
      logger.error('MongoDB connection failed', {
        label,
        error,
      });
      scheduleReconnect();
      throw error;
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
}

async function connectDatabase({ allowRetry = true } = {}) {
  if (!env.mongoUri) {
    const error = new Error('MONGO_URI is required');
    setState({
      configured: false,
      ready: false,
      status: 'unconfigured',
      ...captureError(error),
    });
    throw error;
  }

  try {
    shuttingDown = false;
    return await connectInstance(mongoose, 'root');
  } catch (error) {
    if (!allowRetry) {
      throw error;
    }

    return null;
  }
}

async function disconnectDatabase() {
  shuttingDown = true;
  clearReconnectTimer();

  if (mongoose.connection.readyState === 0) {
    setState({
      ready: false,
      status: env.mongoUri ? 'disconnected' : 'unconfigured',
      lastDisconnectedAt: nowIso(),
    });
    return;
  }

  try {
    await mongoose.disconnect();
    setState({
      ready: false,
      status: env.mongoUri ? 'disconnected' : 'unconfigured',
      lastDisconnectedAt: nowIso(),
    });
    logger.info('MongoDB connection closed');
  } catch (error) {
    setState({
      ready: false,
      status: 'error',
      ...captureError(error),
    });
    logger.error('MongoDB disconnect failed', { error });
    throw error;
  }
}

mongoose.connection.on('connected', () => {
  clearReconnectTimer();
  setState({
    ready: true,
    status: 'connected',
    lastConnectedAt: nowIso(),
    lastErrorMessage: null,
  });
});

mongoose.connection.on('reconnected', () => {
  clearReconnectTimer();
  setState({
    ready: true,
    status: 'connected',
    lastConnectedAt: nowIso(),
    lastErrorMessage: null,
  });
  logger.info('MongoDB reconnected');
});

mongoose.connection.on('disconnected', () => {
  setState({
    ready: false,
    status: env.mongoUri ? 'disconnected' : 'unconfigured',
    lastDisconnectedAt: nowIso(),
  });
  logger[shuttingDown ? 'info' : 'warn'](
    shuttingDown ? 'MongoDB disconnected during shutdown' : 'MongoDB disconnected'
  );
  scheduleReconnect();
});

mongoose.connection.on('error', (error) => {
  if (shuttingDown) {
    return;
  }

  setState({
    ready: false,
    status: 'error',
    ...captureError(error),
  });
  logger.error('MongoDB connection error event', { error });
});

connectDatabase.getState = getDatabaseState;
connectDatabase.isReady = function isReady() {
  return Boolean(databaseState.ready);
};
connectDatabase.disconnect = disconnectDatabase;

module.exports = connectDatabase;
