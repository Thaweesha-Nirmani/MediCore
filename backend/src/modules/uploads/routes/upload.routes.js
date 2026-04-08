const express = require('express');

const controller = require('../controllers/upload.controller');
const validators = require('../validators/upload.validators');
const { protect, allowRoles, ROLES } = require('../utils/access-control');

const router = express.Router();
const uploadReadAccess = allowRoles(
  ROLES.ADMIN,
  ROLES.PHARMACIST,
  ROLES.CASHIER,
  ROLES.INVENTORY_MANAGER,
  ROLES.PURCHASING_MANAGER,
  ROLES.SUPPLIER_MANAGER
);
const uploadManageAccess = allowRoles(
  ROLES.ADMIN,
  ROLES.PHARMACIST,
  ROLES.INVENTORY_MANAGER,
  ROLES.PURCHASING_MANAGER,
  ROLES.SUPPLIER_MANAGER
);
const uploadDeleteAccess = allowRoles(ROLES.ADMIN);

router.use(protect);

router.post('/', uploadManageAccess, validators.uploadBase64, controller.uploadBase64);
router.get('/:id/meta', uploadReadAccess, validators.uploadById, controller.getUploadMeta);
router.get('/:id/download', uploadReadAccess, validators.uploadById, controller.downloadUpload);
router.delete('/:id', uploadDeleteAccess, validators.uploadById, controller.archiveUpload);

module.exports = router;
