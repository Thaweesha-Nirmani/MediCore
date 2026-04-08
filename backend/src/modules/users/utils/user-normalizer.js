const AppError = require('../../../core/app-error');

const ROLES = {
  ADMIN: 'admin',
  PHARMACIST: 'pharmacist',
  CASHIER: 'cashier',
  INVENTORY_MANAGER: 'inventory_manager',
  PURCHASING_MANAGER: 'purchasing_manager',
  SUPPLIER_MANAGER: 'supplier_manager',
};

const STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
};

const ROLE_ALIASES = {
  admin: ROLES.ADMIN,
  administrator: ROLES.ADMIN,
  pharmacist: ROLES.PHARMACIST,
  staff: ROLES.PHARMACIST,
  cashier: ROLES.CASHIER,
  'inventory manager': ROLES.INVENTORY_MANAGER,
  inventory_manager: ROLES.INVENTORY_MANAGER,
  inventorymanager: ROLES.INVENTORY_MANAGER,
  'purchasing manager': ROLES.PURCHASING_MANAGER,
  purchasing_manager: ROLES.PURCHASING_MANAGER,
  purchase_manager: ROLES.PURCHASING_MANAGER,
  buyer: ROLES.PURCHASING_MANAGER,
  'supplier manager': ROLES.SUPPLIER_MANAGER,
  supplier_manager: ROLES.SUPPLIER_MANAGER,
};

const STATUS_ALIASES = {
  active: STATUSES.ACTIVE,
  approved: STATUSES.ACTIVE,
  inactive: STATUSES.INACTIVE,
  disabled: STATUSES.INACTIVE,
  suspended: STATUSES.INACTIVE,
  pending: STATUSES.PENDING,
  'awaiting approval': STATUSES.PENDING,
  awaiting_approval: STATUSES.PENDING,
};

function trimString(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
}

function normalizeEmail(value, { required = false } = {}) {
  const email = trimString(value).toLowerCase();

  if (!email) {
    if (required) {
      throw new AppError('email is required', 422);
    }

    return '';
  }

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isValid) {
    throw new AppError('email must be a valid email address', 422);
  }

  return email;
}

function normalizeContactNumber(value, { required = false } = {}) {
  const raw = trimString(value);

  if (!raw) {
    if (required) {
      throw new AppError('contactNumber is required', 422);
    }

    return '';
  }

  const digits = raw.replace(/[^\d+]/g, '');

  if (!/^\+?\d{10,15}$/.test(digits)) {
    throw new AppError('contactNumber must contain 10 to 15 digits', 422);
  }

  return digits;
}

function normalizeRole(value, { required = false, fallback = ROLES.PHARMACIST } = {}) {
  const raw = trimString(value).toLowerCase().replace(/\s+/g, '_');

  if (!raw) {
    if (required) {
      throw new AppError('role is required', 422);
    }

    return fallback;
  }

  return ROLE_ALIASES[raw] || ROLE_ALIASES[raw.replace(/_/g, ' ')] || raw;
}

function assertSupportedRole(role) {
  const normalized = normalizeRole(role, { required: true });

  if (!Object.values(ROLES).includes(normalized)) {
    throw new AppError('role is not supported', 422, {
      role,
      supportedRoles: Object.values(ROLES),
    });
  }

  return normalized;
}

function normalizeStatus(value, { required = false, fallback = STATUSES.ACTIVE } = {}) {
  const raw = trimString(value).toLowerCase().replace(/\s+/g, '_');

  if (!raw) {
    if (required) {
      throw new AppError('status is required', 422);
    }

    return fallback;
  }

  return STATUS_ALIASES[raw] || STATUS_ALIASES[raw.replace(/_/g, ' ')] || raw;
}

function assertSupportedStatus(status) {
  const normalized = normalizeStatus(status, { required: true });

  if (!Object.values(STATUSES).includes(normalized)) {
    throw new AppError('status is not supported', 422, {
      status,
      supportedStatuses: Object.values(STATUSES),
    });
  }

  return normalized;
}

function buildInitials(name) {
  const cleaned = trimString(name);

  if (!cleaned) {
    return '';
  }

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function normalizeColor(value, fallback = '#0a2a5e') {
  const color = trimString(value);

  if (!color) {
    return fallback;
  }

  return color;
}

function isActiveStatus(status) {
  return normalizeStatus(status, { fallback: STATUSES.ACTIVE }) === STATUSES.ACTIVE;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return ['true', '1', 'yes'].includes(String(value).trim().toLowerCase());
}

function mapActor(user) {
  if (!user) {
    return {
      id: null,
      role: null,
      name: null,
      email: null,
    };
  }

  return {
    id: user._id ? String(user._id) : user.id ? String(user.id) : null,
    role: normalizeRole(user.role, { fallback: null }),
    name: user.name || null,
    email: user.email || null,
  };
}

module.exports = {
  ROLES,
  STATUSES,
  trimString,
  normalizeEmail,
  normalizeContactNumber,
  normalizeRole,
  assertSupportedRole,
  normalizeStatus,
  assertSupportedStatus,
  buildInitials,
  normalizeColor,
  isActiveStatus,
  toBoolean,
  mapActor,
};
