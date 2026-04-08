const PurchaseOrder = require('../models/purchase-order.model');

async function findMany(filter, { sort = { purchaseDate: -1 }, skip = 0, limit = 25, populate = false } = {}) {
  let query = PurchaseOrder.find(filter).sort(sort).skip(skip).limit(limit);

  if (populate) {
    query = query.populate('supplierId', 'name contactNumber email status');
  }

  return query.lean();
}

async function count(filter) {
  return PurchaseOrder.countDocuments(filter);
}

async function findById(id, { populate = false } = {}) {
  let query = PurchaseOrder.findById(id);

  if (populate) {
    query = query.populate('supplierId', 'name contactNumber email status');
  }

  return query;
}

async function findByIdLean(id, { populate = false } = {}) {
  let query = PurchaseOrder.findById(id);

  if (populate) {
    query = query.populate('supplierId', 'name contactNumber email status');
  }

  return query.lean();
}

async function findOne(filter) {
  return PurchaseOrder.findOne(filter);
}

async function findLeanOne(filter) {
  return PurchaseOrder.findOne(filter).lean();
}

async function create(payload) {
  return PurchaseOrder.create(payload);
}

async function save(document) {
  return document.save();
}

module.exports = {
  findMany,
  count,
  findById,
  findByIdLean,
  findOne,
  findLeanOne,
  create,
  save,
};
