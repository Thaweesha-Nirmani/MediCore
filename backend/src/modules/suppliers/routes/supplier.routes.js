const express = require('express');

const controller = require('../controllers/supplier.controller');
const validators = require('../validators/supplier.validators');
const { protect, allowRoles, ROLES } = require('../utils/access-control');

const router = express.Router();

router.use(protect);

router.get(
  '/',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.PURCHASING_MANAGER, ROLES.SUPPLIER_MANAGER),
  validators.listSuppliers,
  controller.listSuppliers
);

router.get(
  '/:id',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.PURCHASING_MANAGER, ROLES.SUPPLIER_MANAGER),
  validators.supplierById,
  controller.getSupplierById
);

router.post(
  '/',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.PURCHASING_MANAGER, ROLES.SUPPLIER_MANAGER),
  validators.createSupplier,
  controller.createSupplier
);

router.put(
  '/:id',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.PURCHASING_MANAGER, ROLES.SUPPLIER_MANAGER),
  validators.updateSupplier,
  controller.updateSupplier
);

router.patch(
  '/:id',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.PURCHASING_MANAGER, ROLES.SUPPLIER_MANAGER),
  validators.updateSupplier,
  controller.updateSupplier
);

router.delete(
  '/:id',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.PURCHASING_MANAGER, ROLES.SUPPLIER_MANAGER),
  validators.deleteSupplier,
  controller.deleteSupplier
);

module.exports = router;
