const InventoryBatch = require('../models/inventory-batch.model');

async function findMany(filter, { sort = { expiryDate: 1 }, skip = 0, limit = 25, populate = false } = {}) {
  let query = InventoryBatch.find(filter).sort(sort).skip(skip).limit(limit);

  if (populate) {
    query = query.populate('medicineId');
  }

  return query.lean();
}

async function count(filter) {
  return InventoryBatch.countDocuments(filter);
}

async function findById(id, { populate = false } = {}) {
  let query = InventoryBatch.findById(id);

  if (populate) {
    query = query.populate('medicineId');
  }

  return query;
}

async function findByIdLean(id, { populate = false } = {}) {
  let query = InventoryBatch.findById(id);

  if (populate) {
    query = query.populate('medicineId');
  }

  return query.lean();
}

async function findOne(filter) {
  return InventoryBatch.findOne(filter);
}

async function findLeanOne(filter) {
  return InventoryBatch.findOne(filter).lean();
}

async function create(payload) {
  return InventoryBatch.create(payload);
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
