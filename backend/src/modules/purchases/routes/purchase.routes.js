const express = require('express');

const controller = require('../controllers/purchase.controller');
const validators = require('../validators/purchase.validators');
const { protect, allowRoles, ROLES } = require('../utils/access-control');

const router = express.Router();

router.use(protect);

router.get(
  '/',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.PURCHASING_MANAGER),
  validators.listPurchases,
  controller.listPurchases
);

router.get(
  '/:id',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.PURCHASING_MANAGER),
  validators.purchaseById,
  controller.getPurchaseById
);

router.post(
  '/',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.PURCHASING_MANAGER),
  validators.createPurchase,
  controller.createPurchase
);

router.put(
  '/:id',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.PURCHASING_MANAGER),
  validators.updatePurchase,
  controller.updatePurchase
);

router.patch(
  '/:id',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.PURCHASING_MANAGER),
  validators.updatePurchase,
  controller.updatePurchase
);

router.post(
  '/:id/receive',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.PURCHASING_MANAGER),
  validators.receivePurchase,
  controller.receivePurchase
);

module.exports = router;
