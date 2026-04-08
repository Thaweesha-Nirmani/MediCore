const { ok, created } = require('../../../core/api-response');
const asyncHandler = require('../../../core/async-handler');
const supplierService = require('../services/supplier.service');

const listSuppliers = asyncHandler(async (req, res) => {
  const result = await supplierService.listSuppliers(req.query);
  return ok(res, result.items, result.meta);
});

const getSupplierById = asyncHandler(async (req, res) => {
  const item = await supplierService.getSupplierById(req.params.id);
  return ok(res, item);
});

const createSupplier = asyncHandler(async (req, res) => {
  const item = await supplierService.createSupplier(req.body, req.user);
  return created(res, item);
});

const updateSupplier = asyncHandler(async (req, res) => {
  const item = await supplierService.updateSupplier(req.params.id, req.body, req.user);
  return ok(res, item);
});

const deleteSupplier = asyncHandler(async (req, res) => {
  const item = await supplierService.deleteSupplier(req.params.id, req.user);
  return ok(res, item, { archived: true });
});

module.exports = {
  listSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
