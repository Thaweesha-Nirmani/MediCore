const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const corsOptions = require('./config/cors');
const connectDatabase = require('./database/mongoose');
const { ok } = require('./core/api-response');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');
const requireDatabaseReady = require('./middleware/require-database-ready');

const dashboardRoutes = require('./modules/dashboard');
const authRoutes = require('./modules/auth');
const usersRoutes = require('./modules/users');
const medicinesRoutes = require('./modules/medicines');
const inventoryRoutes = require('./modules/inventory');
const suppliersRoutes = require('./modules/suppliers');
const purchasesRoutes = require('./modules/purchases');
const salesRoutes = require('./modules/sales');
const reportsRoutes = require('./modules/reports');
const reviewsRoutes = require('./modules/reviews');
const uploadsRoutes = require('./modules/uploads');

const app = express();
const jsonLimitMb = Math.max(2, Math.ceil(env.uploadMaxSizeBytes / (1024 * 1024)) + 2);

app.use(cors(corsOptions));
app.use(express.json({ limit: `${jsonLimitMb}mb` }));

function buildHealthPayload() {
  const database = connectDatabase.getState();

  return {
    name: 'th-mobile-backend',
    status: database.ready ? 'ok' : 'degraded',
    environment: env.nodeEnv,
    uptimeSeconds: Math.round(process.uptime()),
    database,
  };
}

function sendHealth(_req, res) {
  return ok(res, buildHealthPayload());
}

function sendReadiness(_req, res) {
  const payload = buildHealthPayload();
  return res.status(payload.database.ready ? 200 : 503).json({
    success: payload.database.ready,
    data: payload,
    meta: {},
  });
}

app.get('/health', sendHealth);
app.get('/ready', sendReadiness);
app.get('/api/health', sendHealth);
app.get('/api/ready', sendReadiness);
app.get(`${env.apiPrefix}/health`, sendHealth);
app.get(`${env.apiPrefix}/ready`, sendReadiness);

app.use(`${env.apiPrefix}/dashboard`, requireDatabaseReady, dashboardRoutes);
app.use('/api/dashboard', requireDatabaseReady, dashboardRoutes);
app.use(`${env.apiPrefix}/auth`, requireDatabaseReady, authRoutes);
app.use('/api/auth', requireDatabaseReady, authRoutes);
app.use(`${env.apiPrefix}/users`, requireDatabaseReady, usersRoutes);
app.use('/api/users', requireDatabaseReady, usersRoutes);
app.use(`${env.apiPrefix}/medicines`, requireDatabaseReady, medicinesRoutes);
app.use('/api/medicines', requireDatabaseReady, medicinesRoutes);
app.use(`${env.apiPrefix}/inventory`, requireDatabaseReady, inventoryRoutes);
app.use('/api/inventory', requireDatabaseReady, inventoryRoutes);
app.use(`${env.apiPrefix}/suppliers`, requireDatabaseReady, suppliersRoutes);
app.use('/api/suppliers', requireDatabaseReady, suppliersRoutes);
app.use(`${env.apiPrefix}/purchases`, requireDatabaseReady, purchasesRoutes);
app.use('/api/purchases', requireDatabaseReady, purchasesRoutes);
app.use(`${env.apiPrefix}/sales`, requireDatabaseReady, salesRoutes);
app.use('/api/sales', requireDatabaseReady, salesRoutes);
app.use(`${env.apiPrefix}/reports`, requireDatabaseReady, reportsRoutes);
app.use('/api/reports', requireDatabaseReady, reportsRoutes);
app.use(`${env.apiPrefix}/reviews`, requireDatabaseReady, reviewsRoutes);
app.use('/api/reviews', requireDatabaseReady, reviewsRoutes);
app.use(`${env.apiPrefix}/uploads`, requireDatabaseReady, uploadsRoutes);
app.use('/api/uploads', requireDatabaseReady, uploadsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
