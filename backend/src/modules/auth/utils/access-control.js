const AppError = require('../../../core/app-error');
const userService = require('../../users/services/user.service');
const {
  ROLES,
  normalizeRole,
  normalizeStatus,
  isActiveStatus,
} = require('../../users/utils/user-normalizer');
const { verifyAccessToken } = require('./token-service');

function extractBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';

  if (!header || !String(header).startsWith('Bearer ')) {
    return null;
  }

  return String(header).slice(7).trim();
}

async function attachAuthenticatedUser(req) {
  const token = extractBearerToken(req);

  if (!token) {
    throw new AppError('Authentication token is required', 401);
  }

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch (_error) {
    throw new AppError('Invalid or expired authentication token', 401);
  }

  if (payload.type && payload.type !== 'access') {
    throw new AppError('Invalid authentication token type', 401);
  }

  const user = await userService.findUserForAuthById(payload.sub || payload.id);

  if (!user) {
    throw new AppError('Authenticated user was not found', 401);
  }

  const status = normalizeStatus(user.status);

  if (!isActiveStatus(status)) {
    throw new AppError('Account is not active', 403, {
      status,
    });
  }

  req.user = {
    _id: user._id,
    id: String(user._id),
    userId: user.user_id || '',
    name: user.name || '',
    email: user.email || '',
    role: normalizeRole(user.role),
    status,
    contactNumber: user.contactNumber || '',
    initials: user.initials || '',
    color: user.color || '#0a2a5e',
  };
  req.auth = {
    token,
    payload,
  };
}

async function protect(req, _res, next) {
  try {
    await attachAuthenticatedUser(req);
    return next();
  } catch (error) {
    return next(error);
  }
}

async function optionalProtect(req, _res, next) {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      return next();
    }

    await attachAuthenticatedUser(req);
    return next();
  } catch (error) {
    return next(error);
  }
}

function allowRoles(...roles) {
  const allowedRoles = roles.map((role) => normalizeRole(role, { fallback: null })).filter(Boolean);

  return function roleGuard(req, _res, next) {
    const currentRole = normalizeRole(req.user?.role, { fallback: null });

    if (!currentRole || !allowedRoles.includes(currentRole)) {
      return next(
        new AppError('You do not have permission to access this resource', 403, {
          allowedRoles,
          currentRole,
        })
      );
    }

    return next();
  };
}

module.exports = {
  protect,
  optionalProtect,
  allowRoles,
  normalizeRole,
  ROLES,
};
