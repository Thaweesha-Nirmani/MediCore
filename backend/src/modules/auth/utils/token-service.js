const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const env = require('../../../config/env');
const { normalizeRole, normalizeStatus } = require('../../users/utils/user-normalizer');

function signAccessToken(user) {
  if (!env.jwtSecret) {
    throw new Error('JWT secret is not configured');
  }

  return jwt.sign(
    {
      sub: String(user._id || user.id),
      email: user.email,
      role: normalizeRole(user.role),
      status: normalizeStatus(user.status),
      type: 'access',
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtAccessExpiresIn,
    }
  );
}

function verifyAccessToken(token) {
  if (!env.jwtSecret) {
    throw new Error('JWT secret is not configured');
  }

  return jwt.verify(token, env.jwtSecret);
}

function hashRefreshToken(refreshToken) {
  return crypto.createHash('sha256').update(String(refreshToken || '')).digest('hex');
}

function buildRefreshTokenRecord({ userAgent = '', ipAddress = '' } = {}) {
  const rawToken = crypto.randomBytes(48).toString('hex');
  const tokenId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.refreshTokenExpiresInDays);

  return {
    rawToken,
    record: {
      tokenId,
      tokenHash: hashRefreshToken(rawToken),
      createdAt: new Date(),
      expiresAt,
      revokedAt: null,
      lastUsedAt: null,
      replacedByTokenId: null,
      userAgent: String(userAgent || '').slice(0, 300),
      ipAddress: String(ipAddress || '').slice(0, 100),
    },
  };
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  hashRefreshToken,
  buildRefreshTokenRecord,
};
