require('dns').setServers(['8.8.8.8', '8.8.4.4']); // Force Google DNS for SRV resolution
const app = require('./src/app');
const env = require('./src/config/env');
const connectDatabase = require('./src/database/mongoose');
const logger = require('./src/utils/logger');

let server = null;
let shutdownRequested = false;

async function bootstrap() {
  await connectDatabase({ allowRetry: true }).catch((error) => {
    logger.error('Initial MongoDB connection failed; backend will continue in degraded mode', {
      error,
      database: connectDatabase.getState(),
    });
  });

  server = app.listen(env.port, () => {
    logger.info('HTTP server listening', {
      port: env.port,
      environment: env.nodeEnv,
      apiPrefix: env.apiPrefix,
    });
  });
  server.on('error', (error) => {
    logger.error('HTTP server error', { error });
    process.exit(1);
  });
}

async function shutdown(signal) {
  if (shutdownRequested) {
    return;
  }

  shutdownRequested = true;
  logger.warn('Shutdown requested', { signal });

  if (!server) {
    try {
      await connectDatabase.disconnect();
    } catch (_error) {
      // The disconnect path already logs the failure.
    }
    process.exit(0);
    return;
  }

  server.close(async () => {
    logger.info('HTTP server stopped', { signal });

    try {
      await connectDatabase.disconnect();
    } catch (_error) {
      process.exit(1);
      return;
    }

    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout', { signal });
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

bootstrap().catch((error) => {
  logger.error('Backend bootstrap failed', { error });
  process.exit(1);
});
