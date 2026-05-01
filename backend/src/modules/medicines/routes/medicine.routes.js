const express = require('express');

const controller = require('../controllers/medicine.controller');
const validators = require('../validators/medicine.validators');
const { protect, allowRoles, ROLES } = require('../utils/access-control');

const router = express.Router();

router.use(protect);

router.get(
  '/duplicate-check',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  validators.duplicateCheck,
  controller.checkDuplicateMedicines
);

router.get(
  '/autocomplete',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  validators.autocomplete,
  controller.autocompleteMedicines
);

router.get(
  '/generic-names/autocomplete',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  validators.autocomplete,
  controller.autocompleteGenericNames
);

router.get(
  '/expiry/alerts',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  controller.getExpiryAlerts
);

router.get(
  '/expiry-alert',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  controller.getExpiryAlerts
);

router.get(
  '/barcode/:barcode',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  validators.barcodeLookup,
  controller.getMedicineByBarcode
);

router.get(
  '/',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  validators.listMedicines,
  controller.listMedicines
);

router.get(
  '/:id',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER, ROLES.CASHIER),
  validators.medicineById,
  controller.getMedicineById
);

router.post(
  '/',
  allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.INVENTORY_MANAGER),
  validators.createMedicine,
  controller.createMedicine
);

router.put(
  '/:id',
  allowRoles(ROLES.ADMIN),
  validators.updateMedicine,
  controller.updateMedicine
);

router.patch(
  '/:id',
  allowRoles(ROLES.ADMIN),
  validators.updateMedicine,
  controller.updateMedicine
);

router.post(
  '/:id/restore',
  allowRoles(ROLES.ADMIN),
  validators.restoreMedicine,
  controller.restoreMedicine
);

router.delete(
  '/:id',
  allowRoles(ROLES.ADMIN),
  validators.deleteMedicine,
  controller.deleteMedicine
);

module.exports = router;
