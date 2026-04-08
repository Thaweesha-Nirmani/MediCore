const express = require('express');

const controller = require('../controllers/dashboard.controller');
const validators = require('../validators/dashboard.validators');
const { protect, allowRoles, ROLES } = require('../utils/access-control');

const router = express.Router();
const dashboardAccess = allowRoles(
  ROLES.ADMIN,
  ROLES.PHARMACIST,
  ROLES.CASHIER,
  ROLES.INVENTORY_MANAGER,
  ROLES.PURCHASING_MANAGER,
  ROLES.SUPPLIER_MANAGER
);

router.use(protect);

router.get('/activity', dashboardAccess, validators.activity, controller.getRecentActivity);
router.get('/fast-moving', dashboardAccess, validators.fastMoving, controller.getFastMovingMedicines);
router.get('/summary', dashboardAccess, validators.summary, controller.getSummary);
router.get('/', dashboardAccess, validators.summary, controller.getSummary);

module.exports = router;
