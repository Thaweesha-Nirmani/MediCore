const {
  normalizeRole,
  normalizeStatus,
  buildInitials,
} = require('../utils/user-normalizer');

function toId(value) {
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

function toUserResponse(user) {
  const role = normalizeRole(user.role);
  const status = normalizeStatus(user.status);

  return {
    id: toId(user._id),
    _id: toId(user._id),
    userId: user.user_id || user.userId || '',
    name: user.name || '',
    email: user.email || '',
    contactNumber: user.contactNumber || user.phone || '',
    role,
    status,
    active: status === 'active',
    initials: user.initials || buildInitials(user.name),
    color: user.color || '#0a2a5e',
    lastLogin: user.lastLogin || user.last_login || null,
    createdAt: user.createdAt || user.created_at || null,
    updatedAt: user.updatedAt || user.updated_at || null,
  };
}

module.exports = {
  toUserResponse,
};
