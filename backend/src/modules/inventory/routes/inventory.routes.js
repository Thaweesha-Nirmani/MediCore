const express = require('express');

const controller = require('../controllers/inventory.controller');
const validators = require('../validators/inventory.validators');
const { protect, allowRoles, ROLES } = require('../utils/access-control');

const router = express.Router();

router.use(protect);

router.get(
  '/movements',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  validators.movements,
  controller.listMovements
);

router.get(
  '/history',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  validators.movements,
  controller.listMovements
);

router.get(
  '/low-stock',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  controller.getLowStockAlerts
);

router.get(
  '/alerts',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  controller.getLowStockAlerts
);

router.get(
  '/expiry',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  controller.getExpiryView
);

router.post(
  '/adjust',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER),
  validators.adjustInventory,
  controller.adjustInventory
);

router.get(
  '/medicine/:medicineId',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  validators.medicineInventory,
  controller.getInventoryByMedicine
);

router.get(
  '/stocks',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  validators.listInventory,
  controller.listInventory
);

router.post(
  '/stocks',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER),
  validators.createInventory,
  controller.createInventory
);

router.patch(
  '/stocks/:id',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER),
  validators.updateInventory,
  controller.updateInventory
);

router.get(
  '/',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  validators.listInventory,
  controller.listInventory
);

router.get(
  '/:id',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  validators.itemById,
  controller.getInventoryById
);

router.post(
  '/',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER),
  validators.createInventory,
  controller.createInventory
);

router.patch(
  '/:id',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER),
  validators.updateInventory,
  controller.updateInventory
);

module.exports = router;
