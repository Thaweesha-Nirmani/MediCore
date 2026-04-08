const Review = require('../models/review.model');

function findMany(filter = {}, { sort = { updatedAt: -1 }, skip = 0, limit = 25 } = {}) {
  return Review.find(filter).sort(sort).skip(skip).limit(limit).lean();
}

function findById(id) {
  return Review.findById(id);
}

function count(filter = {}) {
  return Review.countDocuments(filter);
}

function create(payload) {
  return Review.create(payload);
}

function save(document) {
  return document.save();
}

module.exports = {
  findMany,
  findById,
  count,
  create,
  save,
};
