const { ok, created } = require('../../../core/api-response');
const asyncHandler = require('../../../core/async-handler');
const purchaseService = require('../services/purchase.service');

const listPurchases = asyncHandler(async (req, res) => {
  const result = await purchaseService.listPurchases(req.query);
  return ok(res, result.items, result.meta);
});

const getPurchaseById = asyncHandler(async (req, res) => {
  const item = await purchaseService.getPurchaseById(req.params.id);
  return ok(res, item);
});

const createPurchase = asyncHandler(async (req, res) => {
  const item = await purchaseService.createPurchase(req.body, req.user);
  return created(res, item);
});

const updatePurchase = asyncHandler(async (req, res) => {
  const item = await purchaseService.updatePurchase(req.params.id, req.body, req.user);
  return ok(res, item);
});

const receivePurchase = asyncHandler(async (req, res) => {
  const item = await purchaseService.receivePurchase(req.params.id, req.body, req.user);
  return ok(res, item);
});

module.exports = {
  listPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  receivePurchase,
};
