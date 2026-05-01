const { ok, created } = require('../../../core/api-response');
const asyncHandler = require('../../../core/async-handler');
const medicineService = require('../services/medicine.service');

const listMedicines = asyncHandler(async (req, res) => {
  const result = await medicineService.listMedicines(req.query);
  return ok(res, result.items, result.meta);
});

const getMedicineById = asyncHandler(async (req, res) => {
  const item = await medicineService.getMedicineById(req.params.id);
  return ok(res, item);
});

const getMedicineByBarcode = asyncHandler(async (req, res) => {
  const item = await medicineService.getMedicineByBarcode(req.params.barcode);
  return ok(res, item);
});

const autocompleteMedicines = asyncHandler(async (req, res) => {
  const result = await medicineService.autocompleteMedicines(req.query);
  return ok(res, result.items, result.meta);
});

const autocompleteGenericNames = asyncHandler(async (req, res) => {
  const result = await medicineService.autocompleteGenericNames(req.query);
  return ok(res, result.items, result.meta);
});

const checkDuplicateMedicines = asyncHandler(async (req, res) => {
  const item = await medicineService.checkDuplicateMedicines(req.query);
  return ok(res, item);
});

const createMedicine = asyncHandler(async (req, res) => {
  const item = await medicineService.createMedicine(req.body, req.user);
  return created(res, item);
});

const updateMedicine = asyncHandler(async (req, res) => {
  const item = await medicineService.updateMedicine(req.params.id, req.body, req.user);
  return ok(res, item);
});

const deleteMedicine = asyncHandler(async (req, res) => {
  const item = await medicineService.softDeleteMedicine(req.params.id, req.user);
  return ok(res, item, {
    archived: true,
  });
});

const restoreMedicine = asyncHandler(async (req, res) => {
  const item = await medicineService.restoreMedicine(req.params.id, req.user);
  return ok(res, item, {
    restored: true,
  });
});

const getExpiryAlerts = asyncHandler(async (_req, res) => {
  const item = await medicineService.getExpiryAlerts();
  return ok(res, item);
});

module.exports = {
  listMedicines,
  getMedicineById,
  getMedicineByBarcode,
  autocompleteMedicines,
  autocompleteGenericNames,
  checkDuplicateMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  restoreMedicine,
  getExpiryAlerts,
};
