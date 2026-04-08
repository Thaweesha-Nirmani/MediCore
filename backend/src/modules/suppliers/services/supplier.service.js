const AppError = require('../../../core/app-error');
const { mapActor } = require('../../inventory/utils/audit');
const supplierRepository = require('../repositories/supplier.repository');
const { toSupplierResponse } = require('../mappers/supplier.mapper');
const {
  trimString,
  normalizeEmail,
  normalizePhone,
  normalizeAddress,
  normalizeStatus,
  buildSearchText,
} = require('../utils/supplier-normalizer');

function baseFilter({ includeDeleted = false } = {}) {
  return includeDeleted ? {} : { isDeleted: false };
}

function getSupplierSort(query = {}) {
  const allowedSortFields = new Set(['createdAt', 'updatedAt', 'name']);
  const sortBy = allowedSortFields.has(query.sortBy) ? query.sortBy : 'updatedAt';
  const sortOrder = String(query.sortOrder || query.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;

  return { [sortBy]: sortOrder, createdAt: -1 };
}

function buildSearchFilter(query) {
  const filter = baseFilter({
    includeDeleted: String(query.includeDeleted || '').toLowerCase() === 'true',
  });

  if (query.status) {
    filter.status = normalizeStatus(query.status);
  }

  const search = trimString(query.search);

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { name: regex },
      { contactNumber: regex },
      { email: regex },
      { 'address.city': regex },
      { searchText: regex },
    ];
  }

  return filter;
}

async function ensureDuplicateDoesNotExist({ name, contactNumber, email, excludeId = null }) {
  const filter = {
    _id: excludeId ? { $ne: excludeId } : { $exists: true },
    isDeleted: false,
    $or: [
      {
        'normalized.name': name.toLowerCase(),
        'normalized.contactNumber': contactNumber,
      },
    ],
  };

  if (email) {
    filter.$or.push({ 'normalized.email': email });
  }

  const duplicate = await supplierRepository.findLeanOne(filter);

  if (duplicate) {
    throw new AppError('A supplier with the same name and contact details already exists', 409, {
      duplicateId: String(duplicate._id),
    });
  }
}

async function getSupplierDocumentOrThrow(id, { lean = false, allowDeleted = false } = {}) {
  const supplier = lean ? await supplierRepository.findByIdLean(id) : await supplierRepository.findById(id);

  if (!supplier || (!allowDeleted && supplier.isDeleted)) {
    throw new AppError('Supplier not found', 404);
  }

  return supplier;
}

function buildSupplierPayload(payload, current = null) {
  const name = payload.name !== undefined ? trimString(payload.name) : current?.name;
  const contactNumber =
    payload.contactNumber !== undefined || payload.contact !== undefined
      ? normalizePhone(payload.contactNumber || payload.contact, 'contactNumber', { required: true })
      : current?.contactNumber;

  if (!name) {
    throw new AppError('name is required', 422);
  }

  if (!contactNumber) {
    throw new AppError('contactNumber is required', 422);
  }

  const email = payload.email !== undefined ? normalizeEmail(payload.email) : current?.email || '';
  const address = normalizeAddress({
    address: payload.address !== undefined ? payload.address : current?.address,
    street: payload.street !== undefined ? payload.street : current?.address?.street,
    city: payload.city !== undefined ? payload.city : current?.address?.city,
    state: payload.state !== undefined ? payload.state : current?.address?.state,
    postalCode: payload.postalCode !== undefined ? payload.postalCode : current?.address?.postalCode,
    country: payload.country !== undefined ? payload.country : current?.address?.country,
  });
  const status = normalizeStatus(payload.status, current?.status || 'Active');
  const active = status === 'Active';

  return {
    name,
    contactNumber,
    contactPerson:
      payload.contactPerson !== undefined ? trimString(payload.contactPerson) || '' : current?.contactPerson || '',
    alternateContact:
      payload.alternateContact !== undefined
        ? normalizePhone(payload.alternateContact, 'alternateContact') || ''
        : current?.alternateContact || '',
    email,
    address,
    notes: payload.notes !== undefined ? trimString(payload.notes) || '' : current?.notes || '',
    status,
    active,
    normalized: {
      name: name.toLowerCase(),
      contactNumber,
      email,
      city: (address.city || '').toLowerCase(),
    },
    searchText: buildSearchText([name, contactNumber, email, address.street, address.city, address.state, address.country]),
  };
}

async function listSuppliers(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const filter = buildSearchFilter(query);
  const sort = getSupplierSort(query);

  const [items, total] = await Promise.all([
    supplierRepository.findMany(filter, {
      sort,
      skip: (page - 1) * limit,
      limit,
    }),
    supplierRepository.count(filter),
  ]);

  return {
    items: items.map(toSupplierResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getSupplierById(id) {
  const supplier = await getSupplierDocumentOrThrow(id, { lean: true });
  return toSupplierResponse(supplier);
}

async function createSupplier(payload, user) {
  const normalized = buildSupplierPayload(payload);
  await ensureDuplicateDoesNotExist(normalized);

  const supplier = await supplierRepository.create({
    ...normalized,
    isDeleted: normalized.status === 'Archived',
    deletedAt: normalized.status === 'Archived' ? new Date() : null,
    deletedBy: normalized.status === 'Archived' ? mapActor(user) : null,
    createdBy: mapActor(user),
    updatedBy: mapActor(user),
  });

  return toSupplierResponse(supplier.toObject ? supplier.toObject() : supplier);
}

async function updateSupplier(id, payload, user) {
  const supplier = await getSupplierDocumentOrThrow(id);
  const normalized = buildSupplierPayload(payload, supplier);
  await ensureDuplicateDoesNotExist({ ...normalized, excludeId: supplier._id });

  Object.assign(supplier, normalized, {
    updatedBy: mapActor(user),
  });

  if (normalized.status === 'Archived') {
    supplier.active = false;
    supplier.isDeleted = true;
    supplier.deletedAt = supplier.deletedAt || new Date();
    supplier.deletedBy = supplier.deletedBy || mapActor(user);
  } else if (normalized.status === 'Inactive') {
    supplier.active = false;
    supplier.isDeleted = false;
    supplier.deletedAt = null;
    supplier.deletedBy = null;
  } else {
    supplier.active = true;
    supplier.isDeleted = false;
    supplier.deletedAt = null;
    supplier.deletedBy = null;
  }

  const updated = await supplierRepository.save(supplier);
  return toSupplierResponse(updated.toObject ? updated.toObject() : updated);
}

async function deleteSupplier(id, user) {
  const supplier = await getSupplierDocumentOrThrow(id);

  supplier.status = 'Archived';
  supplier.active = false;
  supplier.isDeleted = true;
  supplier.deletedAt = new Date();
  supplier.deletedBy = mapActor(user);
  supplier.updatedBy = mapActor(user);

  const updated = await supplierRepository.save(supplier);
  return toSupplierResponse(updated.toObject ? updated.toObject() : updated);
}

async function findActiveSupplierOrThrow(id, { allowInactive = false } = {}) {
  const supplier = await getSupplierDocumentOrThrow(id, { lean: true, allowDeleted: allowInactive });

  if (!allowInactive && (supplier.isDeleted || supplier.status !== 'Active')) {
    throw new AppError('Referenced supplier is not active', 422);
  }

  return supplier;
}

module.exports = {
  listSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  findActiveSupplierOrThrow,
};
