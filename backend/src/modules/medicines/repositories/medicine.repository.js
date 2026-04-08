const Medicine = require('../models/medicine-master.model');

async function findMany(filter, { sort = { updatedAt: -1 }, skip = 0, limit = 20 } = {}) {
  return Medicine.find(filter).sort(sort).skip(skip).limit(limit).lean();
}

async function count(filter) {
  return Medicine.countDocuments(filter);
}

async function findById(id, { includeDeleted = false } = {}) {
  const filter = { _id: id };

  if (!includeDeleted) {
    filter.$or = [{ isDeleted: false }, { isDeleted: { $exists: false } }];
  }

  return Medicine.findOne(filter);
}

async function findByIdLean(id, { includeDeleted = false } = {}) {
  const filter = { _id: id };

  if (!includeDeleted) {
    filter.$or = [{ isDeleted: false }, { isDeleted: { $exists: false } }];
  }

  return Medicine.findOne(filter).lean();
}

async function findOne(filter) {
  return Medicine.findOne(filter).lean();
}

async function distinct(field, filter = {}) {
  return Medicine.distinct(field, filter);
}

async function create(payload) {
  return Medicine.create(payload);
}

async function save(document) {
  return document.save();
}

async function deleteById(id) {
  return Medicine.findByIdAndDelete(id);
}

module.exports = {
  findMany,
  count,
  findById,
  findByIdLean,
  findOne,
  distinct,
  create,
  save,
  deleteById,
};
