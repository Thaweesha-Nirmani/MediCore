const express = require('express');

const controller = require('../controllers/sale.controller');
const validators = require('../validators/sale.validators');
const { protect, allowRoles, ROLES } = require('../utils/access-control');

const router = express.Router();
const salesAccess = allowRoles(ROLES.ADMIN, ROLES.PHARMACIST, ROLES.CASHIER);
const refundAccess = allowRoles(ROLES.ADMIN, ROLES.PHARMACIST);

router.use(protect);

router.get('/history', salesAccess, validators.listSales, controller.listSales);
router.get('/invoices/:id', salesAccess, validators.saleById, controller.getSaleById);
router.get('/search-medicines', salesAccess, validators.searchMedicines, controller.searchMedicines);
router.get('/barcode/:barcode', salesAccess, validators.barcodeLookup, controller.getMedicineByBarcode);
router.post('/create', salesAccess, validators.createSale, controller.createSale);
router.post('/:id/refund', refundAccess, validators.refundSale, controller.refundSale);

router.get('/', salesAccess, validators.listSales, controller.listSales);
router.get('/:id', salesAccess, validators.saleById, controller.getSaleById);
router.post('/', salesAccess, validators.createSale, controller.createSale);

module.exports = router;
