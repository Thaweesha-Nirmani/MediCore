const Supplier = require('../models/supplier.model');

async function findMany(filter, { sort = { updatedAt: -1 }, skip = 0, limit = 25 } = {}) {
  return Supplier.find(filter).sort(sort).skip(skip).limit(limit).lean();
}

async function count(filter) {
  return Supplier.countDocuments(filter);
}

async function findById(id) {
  return Supplier.findById(id);
}

async function findByIdLean(id) {
  return Supplier.findById(id).lean();
}

async function findOne(filter) {
  return Supplier.findOne(filter);
}

async function findLeanOne(filter) {
  return Supplier.findOne(filter).lean();
}

async function create(payload) {
  return Supplier.create(payload);
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
