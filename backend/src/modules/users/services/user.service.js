const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const AppError = require('../../../core/app-error');
const repository = require('../repositories/user.repository');
const { toUserResponse } = require('../mappers/user.mapper');
const {
  ROLES,
  STATUSES,
  trimString,
  normalizeEmail,
  normalizeContactNumber,
  assertSupportedRole,
  normalizeRole,
  assertSupportedStatus,
  normalizeStatus,
  buildInitials,
  normalizeColor,
  isActiveStatus,
  mapActor,
} = require('../utils/user-normalizer');

function generateUserId() {
  return `USR-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function getUserId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    if (value._id) {
      return String(value._id);
    }

    if (value.id) {
      return String(value.id);
    }
  }

  return String(value);
}

function ensureValidObjectId(id, message = 'User id must be a valid ObjectId') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(message, 422);
  }
}

function canManageAllUsers(actor) {
  return normalizeRole(actor?.role) === ROLES.ADMIN;
}

function canAccessUser(actor, targetUserId) {
  if (canManageAllUsers(actor)) {
    return true;
  }

  return getUserId(actor?._id || actor?.id) === String(targetUserId);
}

async function ensureUniqueEmail(email, excludeId = null) {
  const existing = await repository.findOne(
    {
      email,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    },
    { lean: true }
  );

  if (existing) {
    throw new AppError('A user with this email already exists', 409, {
      email,
    });
  }
}

async function hashPassword(password) {
  const raw = trimString(password);

  if (raw.length < 6) {
    throw new AppError('password must be at least 6 characters long', 422);
  }

  return bcrypt.hash(raw, 12);
}

function extractPasswordHash(user) {
  if (!user) {
    return '';
  }

  if (typeof user.getPasswordHash === 'function') {
    return user.getPasswordHash();
  }

  return user.passwordHash || user.password_hash || user.password || '';
}

async function verifyPassword(user, password) {
  const hash = extractPasswordHash(user);

  if (!hash) {
    return false;
  }

  return bcrypt.compare(String(password || ''), hash);
}

function applyHashedPassword(user, hash) {
  if (typeof user.setPasswordHash === 'function') {
    user.setPasswordHash(hash);
    return;
  }

  user.passwordHash = hash;
  user.password = hash;
  user.password_hash = hash;
}

function pruneRefreshTokens(user, now = new Date()) {
  const tokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];
  const keepAfter = now.getTime() - 1000 * 60 * 60 * 24 * 30;

  user.refreshTokens = tokens
    .filter((token) => {
      const expiresAt = token?.expiresAt ? new Date(token.expiresAt).getTime() : 0;
      const revokedAt = token?.revokedAt ? new Date(token.revokedAt).getTime() : null;

      if (expiresAt && expiresAt > now.getTime()) {
        return true;
      }

      return revokedAt && revokedAt > keepAfter;
    })
    .slice(-20);
}

function ensureCanonicalUserState(user) {
  let changed = false;

  const normalizedRole = assertSupportedRole(user.role || ROLES.PHARMACIST);
  const normalizedStatus = assertSupportedStatus(user.status || STATUSES.ACTIVE);
  const normalizedEmail = normalizeEmail(user.email, { required: true });
  const normalizedName = trimString(user.name);
  const normalizedContact = user.contactNumber || user.phone
    ? normalizeContactNumber(user.contactNumber || user.phone)
    : '';
  const initials = trimString(user.initials) || buildInitials(normalizedName);
  const color = normalizeColor(user.color);
  const userId = trimString(user.user_id) || trimString(user.userId) || generateUserId();
  const active = isActiveStatus(normalizedStatus);

  if (user.role !== normalizedRole) {
    user.role = normalizedRole;
    changed = true;
  }

  if (user.status !== normalizedStatus) {
    user.status = normalizedStatus;
    changed = true;
  }

  if (user.email !== normalizedEmail) {
    user.email = normalizedEmail;
    changed = true;
  }

  if (user.name !== normalizedName) {
    user.name = normalizedName;
    changed = true;
  }

  if ((user.contactNumber || '') !== normalizedContact) {
    user.contactNumber = normalizedContact;
    changed = true;
  }

  if ((user.initials || '') !== initials) {
    user.initials = initials;
    changed = true;
  }

  if ((user.color || '') !== color) {
    user.color = color;
    changed = true;
  }

  if ((user.user_id || '') !== userId) {
    user.user_id = userId;
    changed = true;
  }

  if (Boolean(user.active) !== active) {
    user.active = active;
    changed = true;
  }

  return changed;
}

async function saveCanonicalUser(user) {
  pruneRefreshTokens(user);
  const currentHash = extractPasswordHash(user);

  if (currentHash) {
    applyHashedPassword(user, currentHash);
  }

  return repository.save(user);
}

async function createUser(payload, actor = null, options = {}) {
  const name = trimString(payload.name);

  if (!name) {
    throw new AppError('name is required', 422);
  }

  const email = normalizeEmail(payload.email, { required: true });
  await ensureUniqueEmail(email);

  const role = options.allowRoleOverride
    ? assertSupportedRole(payload.role || options.defaultRole || ROLES.PHARMACIST)
    : assertSupportedRole(options.defaultRole || ROLES.PHARMACIST);
  const status = options.allowStatusOverride
    ? assertSupportedStatus(payload.status || options.defaultStatus || STATUSES.ACTIVE)
    : assertSupportedStatus(options.defaultStatus || STATUSES.PENDING);
  const passwordHash = await hashPassword(payload.password);

  const user = await repository.create({
    user_id: trimString(payload.userId || payload.user_id) || generateUserId(),
    name,
    email,
    contactNumber: payload.contactNumber ? normalizeContactNumber(payload.contactNumber) : '',
    passwordHash,
    password: passwordHash,
    password_hash: passwordHash,
    role,
    status,
    active: isActiveStatus(status),
    initials: buildInitials(name),
    color: normalizeColor(payload.color),
    lastLogin: null,
    refreshTokens: [],
    createdBy: mapActor(actor),
    updatedBy: mapActor(actor),
  });

  return toUserResponse(user.toObject());
}

async function findUserForAuthByEmail(email) {
  const normalizedEmail = normalizeEmail(email, { required: true });
  const user = await repository.findByEmail(normalizedEmail, { withSecrets: true });

  if (!user) {
    return null;
  }

  if (ensureCanonicalUserState(user)) {
    await saveCanonicalUser(user);
  }

  return user;
}

async function findUserForAuthById(id) {
  ensureValidObjectId(id);
  const user = await repository.findById(id, { withSecrets: true });

  if (!user) {
    return null;
  }

  if (ensureCanonicalUserState(user)) {
    await saveCanonicalUser(user);
  }

  return user;
}

async function findUserByRefreshTokenHash(tokenHash) {
  const user = await repository.findByRefreshTokenHash(tokenHash);

  if (!user) {
    return null;
  }

  if (ensureCanonicalUserState(user)) {
    await saveCanonicalUser(user);
  }

  return user;
}

function attachRefreshToken(user, tokenRecord) {
  user.refreshTokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];
  user.refreshTokens.push(tokenRecord);
  pruneRefreshTokens(user);
}

function revokeRefreshToken(user, tokenId, replacementTokenId = null) {
  user.refreshTokens = (Array.isArray(user.refreshTokens) ? user.refreshTokens : []).map((token) => {
    if (token.tokenId !== tokenId || token.revokedAt) {
      return token;
    }

    return {
      ...token,
      revokedAt: new Date(),
      replacedByTokenId: replacementTokenId,
      lastUsedAt: new Date(),
    };
  });
}

function revokeAllRefreshTokens(user) {
  user.refreshTokens = (Array.isArray(user.refreshTokens) ? user.refreshTokens : []).map((token) => ({
    ...token,
    revokedAt: token.revokedAt || new Date(),
  }));
}

async function persistAuthUser(user) {
  user.updatedBy = mapActor(user.updatedBy || null);
  await saveCanonicalUser(user);
  return user;
}

async function listUsers(query, actor) {
  if (!canManageAllUsers(actor)) {
    throw new AppError('You do not have permission to list users', 403);
  }

  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const filter = {};
  const search = trimString(query.search);

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { name: regex },
      { email: regex },
      { contactNumber: regex },
      { user_id: regex },
    ];
  }

  if (query.role) {
    filter.role = assertSupportedRole(query.role);
  }

  if (query.status) {
    filter.status = assertSupportedStatus(query.status);
  }

  const allowedSortFields = new Set(['createdAt', 'updatedAt', 'name', 'email', 'role', 'status', 'lastLogin']);
  const sortBy = allowedSortFields.has(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = String(query.sortOrder || query.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;

  const [items, total] = await Promise.all([
    repository.findMany(filter, {
      sort: { [sortBy]: sortOrder, createdAt: -1 },
      skip: (page - 1) * limit,
      limit,
    }),
    repository.count(filter),
  ]);

  return {
    items: items.map(toUserResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getUserById(id, actor) {
  ensureValidObjectId(id);

  if (!canAccessUser(actor, id)) {
    throw new AppError('You do not have permission to view this user', 403);
  }

  const user = await repository.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (ensureCanonicalUserState(user)) {
    await saveCanonicalUser(user);
  }

  return toUserResponse(user.toObject());
}

async function updateUser(id, payload, actor) {
  ensureValidObjectId(id);

  if (!canAccessUser(actor, id)) {
    throw new AppError('You do not have permission to update this user', 403);
  }

  const user = await repository.findById(id, { withSecrets: true });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isAdmin = canManageAllUsers(actor);

  if (payload.status !== undefined) {
    throw new AppError('Use PATCH /api/users/:id/status to change user status', 422);
  }

  if (payload.password !== undefined || payload.passwordHash !== undefined || payload.password_hash !== undefined) {
    throw new AppError('Password changes are not allowed on this endpoint', 422);
  }

  if (payload.name !== undefined) {
    const name = trimString(payload.name);

    if (!name) {
      throw new AppError('name cannot be empty', 422);
    }

    user.name = name;
    user.initials = buildInitials(name);
  }

  if (payload.email !== undefined) {
    const email = normalizeEmail(payload.email, { required: true });

    if (email !== user.email) {
      await ensureUniqueEmail(email, user._id);
      user.email = email;
    }
  }

  if (payload.contactNumber !== undefined) {
    user.contactNumber = payload.contactNumber
      ? normalizeContactNumber(payload.contactNumber)
      : '';
  }

  if (payload.color !== undefined) {
    user.color = normalizeColor(payload.color);
  }

  if (payload.role !== undefined) {
    if (!isAdmin) {
      throw new AppError('Only admins can change user roles', 403);
    }

    user.role = assertSupportedRole(payload.role);
  }

  user.updatedBy = mapActor(actor);

  if (ensureCanonicalUserState(user)) {
    user.updatedBy = mapActor(actor);
  }

  const updated = await saveCanonicalUser(user);
  return toUserResponse(updated.toObject());
}

async function updateUserStatus(id, payload, actor) {
  ensureValidObjectId(id);

  if (!canManageAllUsers(actor)) {
    throw new AppError('Only admins can change user status', 403);
  }

  const user = await repository.findById(id, { withSecrets: true });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const status = assertSupportedStatus(payload.status);
  user.status = status;
  user.active = isActiveStatus(status);
  user.updatedBy = mapActor(actor);

  if (status !== STATUSES.ACTIVE) {
    revokeAllRefreshTokens(user);
  }

  if (ensureCanonicalUserState(user)) {
    user.updatedBy = mapActor(actor);
  }

  const updated = await saveCanonicalUser(user);
  return toUserResponse(updated.toObject());
}

module.exports = {
  ROLES,
  STATUSES,
  listUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  createUser,
  findUserForAuthByEmail,
  findUserForAuthById,
  findUserByRefreshTokenHash,
  verifyPassword,
  attachRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  persistAuthUser,
};
