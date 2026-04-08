const InventoryMovement = require('../models/inventory-movement.model');

async function findMany(filter, { sort = { createdAt: -1 }, skip = 0, limit = 50 } = {}) {
  return InventoryMovement.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
}

async function count(filter) {
  return InventoryMovement.countDocuments(filter);
}

async function create(payload) {
  return InventoryMovement.create(payload);
}

async function createMany(payload) {
  return InventoryMovement.insertMany(payload);
}

module.exports = {
  findMany,
  count,
  create,
  createMany,
};
