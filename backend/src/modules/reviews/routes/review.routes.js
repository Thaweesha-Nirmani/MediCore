const express = require('express');

const controller = require('../controllers/review.controller');
const validators = require('../validators/review.validators');
const { protect, allowRoles, ROLES } = require('../utils/access-control');

const router = express.Router();
const reviewAccess = allowRoles(
  ROLES.ADMIN,
  ROLES.PHARMACIST,
  ROLES.CASHIER,
  ROLES.INVENTORY_MANAGER,
  ROLES.PURCHASING_MANAGER,
  ROLES.SUPPLIER_MANAGER
);

router.use(protect);

router.get('/', reviewAccess, validators.listReviews, controller.listReviews);
router.get('/:id', reviewAccess, validators.reviewById, controller.getReviewById);
router.post('/', reviewAccess, validators.createReview, controller.createReview);
router.patch('/:id', reviewAccess, validators.updateReview, controller.updateReview);
router.delete('/:id', reviewAccess, validators.reviewById, controller.archiveReview);

module.exports = router;
