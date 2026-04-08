const { ok, created } = require('../../../core/api-response');
const asyncHandler = require('../../../core/async-handler');
const saleService = require('../services/sale.service');

const listSales = asyncHandler(async (req, res) => {
  const result = await saleService.listSales(req.query);
  return ok(res, result.items, result.meta);
});

const getSaleById = asyncHandler(async (req, res) => {
  const item = await saleService.getSaleById(req.params.id);
  return ok(res, item);
});

const createSale = asyncHandler(async (req, res) => {
  const item = await saleService.createSale(req.body, req.user);
  return created(res, item);
});

const refundSale = asyncHandler(async (req, res) => {
  const item = await saleService.refundSale(req.params.id, req.body, req.user);
  return ok(res, item);
});

const searchMedicines = asyncHandler(async (req, res) => {
  const result = await saleService.searchMedicines(req.query);
  return ok(res, result.items, result.meta);
});

const getMedicineByBarcode = asyncHandler(async (req, res) => {
  const item = await saleService.getMedicineByBarcode(req.params.barcode);
  return ok(res, item);
});

module.exports = {
  listSales,
  getSaleById,
  createSale,
  refundSale,
  searchMedicines,
  getMedicineByBarcode,
};
