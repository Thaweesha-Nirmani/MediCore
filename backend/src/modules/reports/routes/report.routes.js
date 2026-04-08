const express = require('express');

const controller = require('../controllers/report.controller');
const validators = require('../validators/report.validators');
const { protect, allowRoles, ROLES } = require('../utils/access-control');

const router = express.Router();
const reportAccess = allowRoles(
  ROLES.ADMIN,
  ROLES.PHARMACIST,
  ROLES.INVENTORY_MANAGER,
  ROLES.PURCHASING_MANAGER,
  ROLES.SUPPLIER_MANAGER
);

router.use(protect);

router.get('/sales', reportAccess, validators.salesReport, controller.getSalesReport);
router.get('/stock', reportAccess, validators.stockReport, controller.getStockReport);
router.get('/expiry', reportAccess, validators.expiryReport, controller.getExpiryReport);
router.get('/purchases', reportAccess, validators.purchaseReport, controller.getPurchaseReport);
router.get('/', reportAccess, controller.listReports);

module.exports = router;
