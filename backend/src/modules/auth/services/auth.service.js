const AppError = require('../../../core/app-error');
const env = require('../../../config/env');
const userService = require('../../users/services/user.service');
const { toUserResponse } = require('../../users/mappers/user.mapper');
const {
  ROLES,
  STATUSES,
  normalizeRole,
  normalizeStatus,
} = require('../../users/utils/user-normalizer');
const {
  signAccessToken,
  buildRefreshTokenRecord,
  hashRefreshToken,
} = require('../utils/token-service');

function buildClientContext(req = {}) {
  return {
    userAgent: req.headers?.['user-agent'] || '',
    ipAddress:
      req.ip ||
      req.headers?.['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      '',
  };
}

function buildAuthResponse(user, rawRefreshToken = null) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: rawRefreshToken,
    tokenType: 'Bearer',
    expiresIn: env.jwtAccessExpiresIn,
    user: toUserResponse(user.toObject ? user.toObject() : user),
  };
}

async function register(payload, actor, req) {
  const actorRole = normalizeRole(actor?.role, { fallback: null });
  const isAdmin = actorRole === ROLES.ADMIN;

  if (!env.allowPublicRegister && !isAdmin) {
    throw new AppError('Public registration is disabled', 403);
  }

  const createdUser = await userService.createUser(payload, actor, {
    allowRoleOverride: isAdmin,
    allowStatusOverride: isAdmin,
    defaultRole: ROLES.PHARMACIST,
    defaultStatus: isAdmin ? STATUSES.ACTIVE : STATUSES.PENDING,
  });

  return {
    user: createdUser,
    registrationMode: isAdmin ? 'admin' : 'public',
    requiresApproval: createdUser.status !== STATUSES.ACTIVE,
  };
}

async function login(payload, req) {
  const user = await userService.findUserForAuthByEmail(payload.email);

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const matches = await userService.verifyPassword(user, payload.password);

  if (!matches) {
    throw new AppError('Invalid credentials', 401);
  }

  const status = normalizeStatus(user.status);

  if (status !== STATUSES.ACTIVE) {
    throw new AppError('Account is not active', 403, {
      status,
    });
  }

  const refreshToken = buildRefreshTokenRecord(buildClientContext(req));
  user.lastLogin = new Date();
  userService.attachRefreshToken(user, refreshToken.record);
  await userService.persistAuthUser(user);

  return buildAuthResponse(user, refreshToken.rawToken);
}

async function refresh(payload, req) {
  const providedToken = String(payload.refreshToken || '').trim();

  if (!providedToken) {
    throw new AppError('refreshToken is required', 422);
  }

  const user = await userService.findUserByRefreshTokenHash(hashRefreshToken(providedToken));

  if (!user) {
    throw new AppError('Refresh token is invalid', 401);
  }

  const tokenRecord = (Array.isArray(user.refreshTokens) ? user.refreshTokens : []).find(
    (token) => token.tokenHash === hashRefreshToken(providedToken)
  );

  if (!tokenRecord) {
    throw new AppError('Refresh token is invalid', 401);
  }

  if (tokenRecord.revokedAt) {
    throw new AppError('Refresh token has already been revoked', 401);
  }

  if (new Date(tokenRecord.expiresAt).getTime() <= Date.now()) {
    throw new AppError('Refresh token has expired', 401);
  }

  if (normalizeStatus(user.status) !== STATUSES.ACTIVE) {
    userService.revokeAllRefreshTokens(user);
    await userService.persistAuthUser(user);
    throw new AppError('Account is not active', 403, {
      status: normalizeStatus(user.status),
    });
  }

  const nextRefreshToken = buildRefreshTokenRecord(buildClientContext(req));
  userService.revokeRefreshToken(user, tokenRecord.tokenId, nextRefreshToken.record.tokenId);
  userService.attachRefreshToken(user, nextRefreshToken.record);
  await userService.persistAuthUser(user);

  return buildAuthResponse(user, nextRefreshToken.rawToken);
}

async function logout(payload, actor) {
  const user = await userService.findUserForAuthById(actor?.id || actor?._id);

  if (!user) {
    throw new AppError('Authenticated user was not found', 401);
  }

  const providedToken = String(payload.refreshToken || '').trim();

  if (providedToken) {
    const hashed = hashRefreshToken(providedToken);
    const matchingToken = (Array.isArray(user.refreshTokens) ? user.refreshTokens : []).find(
      (token) => token.tokenHash === hashed && !token.revokedAt
    );

    if (matchingToken) {
      userService.revokeRefreshToken(user, matchingToken.tokenId);
    }
  } else {
    userService.revokeAllRefreshTokens(user);
  }

  await userService.persistAuthUser(user);

  return {
    loggedOut: true,
  };
}

async function getMe(actor) {
  return userService.getUserById(actor?.id || actor?._id, actor);
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
