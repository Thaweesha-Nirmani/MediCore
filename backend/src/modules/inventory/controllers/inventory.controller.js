const { ok, created } = require('../../../core/api-response');
const asyncHandler = require('../../../core/async-handler');
const inventoryService = require('../services/inventory.service');

const listInventory = asyncHandler(async (req, res) => {
  const result = await inventoryService.listInventory(req.query);
  return ok(res, result.items, result.meta);
});

const getInventoryById = asyncHandler(async (req, res) => {
  const item = await inventoryService.getInventoryById(req.params.id);
  return ok(res, item);
});

const createInventory = asyncHandler(async (req, res) => {
  const item = await inventoryService.createInventory(req.body, req.user);
  return created(res, item);
});

const updateInventory = asyncHandler(async (req, res) => {
  const item = await inventoryService.updateInventory(req.params.id, req.body, req.user);
  return ok(res, item);
});

const adjustInventory = asyncHandler(async (req, res) => {
  const item = await inventoryService.adjustInventory(req.body, req.user);
  return ok(res, item);
});

const listMovements = asyncHandler(async (req, res) => {
  const result = await inventoryService.listMovements(req.query);
  return ok(res, result.items, result.meta);
});

const getLowStockAlerts = asyncHandler(async (_req, res) => {
  const item = await inventoryService.getLowStockAlerts();
  return ok(res, item);
});

const getExpiryView = asyncHandler(async (_req, res) => {
  const item = await inventoryService.getExpiryView();
  return ok(res, item);
});

const getInventoryByMedicine = asyncHandler(async (req, res) => {
  const result = await inventoryService.getInventoryByMedicine(req.params.medicineId, req.query);
  return ok(res, result.items, result.meta);
});

module.exports = {
  listInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  adjustInventory,
  listMovements,
  getLowStockAlerts,
  getExpiryView,
  getInventoryByMedicine,
};
