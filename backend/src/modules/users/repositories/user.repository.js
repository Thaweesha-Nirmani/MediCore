const AppUser = require('../models/user.model');

function applySecrets(query, withSecrets = false) {
  if (!withSecrets) {
    return query;
  }

  return query.select('+passwordHash +password +password_hash +refreshTokens');
}

async function findMany(filter, { sort = { createdAt: -1 }, skip = 0, limit = 25 } = {}) {
  return AppUser.find(filter).sort(sort).skip(skip).limit(limit).lean();
}

async function count(filter) {
  return AppUser.countDocuments(filter);
}

async function findById(id, { withSecrets = false } = {}) {
  let query = AppUser.findById(id);
  query = applySecrets(query, withSecrets);
  return query;
}

async function findByIdLean(id, { withSecrets = false } = {}) {
  let query = AppUser.findById(id);
  query = applySecrets(query, withSecrets);
  return query.lean();
}

async function findByEmail(email, { withSecrets = false, lean = false } = {}) {
  let query = AppUser.findOne({ email });
  query = applySecrets(query, withSecrets);
  return lean ? query.lean() : query;
}

async function findOne(filter, { withSecrets = false, lean = false } = {}) {
  let query = AppUser.findOne(filter);
  query = applySecrets(query, withSecrets);
  return lean ? query.lean() : query;
}

async function findByRefreshTokenHash(tokenHash) {
  return AppUser.findOne({ 'refreshTokens.tokenHash': tokenHash }).select(
    '+passwordHash +password +password_hash +refreshTokens'
  );
}

async function create(payload) {
  return AppUser.create(payload);
}

async function save(document) {
  return document.save();
}

module.exports = {
  findMany,
  count,
  findById,
  findByIdLean,
  findByEmail,
  findOne,
  findByRefreshTokenHash,
  create,
  save,
};
