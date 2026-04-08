const SaleRecord = require('../models/sale-record.model');

async function findMany(filter, { sort = { date: -1, createdAt: -1 }, skip = 0, limit = 25, session = null } = {}) {
  let query = SaleRecord.find(filter).sort(sort).skip(skip).limit(limit);

  if (session) {
    query = query.session(session);
  }

  return query.lean();
}

async function count(filter, { session = null } = {}) {
  let query = SaleRecord.countDocuments(filter);

  if (session) {
    query = query.session(session);
  }

  return query;
}

async function findById(id, { session = null } = {}) {
  let query = SaleRecord.findById(id);

  if (session) {
    query = query.session(session);
  }

  return query;
}

async function findByIdLean(id, { session = null } = {}) {
  let query = SaleRecord.findById(id);

  if (session) {
    query = query.session(session);
  }

  return query.lean();
}

async function findOne(filter, { session = null, lean = true } = {}) {
  let query = SaleRecord.findOne(filter);

  if (session) {
    query = query.session(session);
  }

  return lean ? query.lean() : query;
}

async function create(payload, { session = null } = {}) {
  const document = new SaleRecord(payload);
  return document.save({ session });
}

async function save(document, { session = null } = {}) {
  return document.save({ session });
}

module.exports = {
  findMany,
  count,
  findById,
  findByIdLean,
  findOne,
  create,
  save,
};
