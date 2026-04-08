function toSupplierResponse(document) {
  return {
    id: String(document._id),
    name: document.name || '',
    contactNumber: document.contactNumber || '',
    contact: document.contactNumber || '',
    contactPerson: document.contactPerson || '',
    alternateContact: document.alternateContact || '',
    email: document.email || '',
    address: {
      street: document.address?.street || '',
      city: document.address?.city || '',
      state: document.address?.state || '',
      postalCode: document.address?.postalCode || '',
      country: document.address?.country || 'Sri Lanka',
    },
    status: document.status || (document.active === false ? 'Inactive' : 'Active'),
    active: document.isDeleted ? false : document.active !== false,
    isDeleted: Boolean(document.isDeleted),
    notes: document.notes || '',
    audit: {
      createdAt: document.createdAt || null,
      updatedAt: document.updatedAt || null,
      deletedAt: document.deletedAt || null,
      createdBy: document.createdBy || null,
      updatedBy: document.updatedBy || null,
      deletedBy: document.deletedBy || null,
    },
    createdAt: document.createdAt || null,
    updatedAt: document.updatedAt || null,
  };
}

module.exports = {
  toSupplierResponse,
};
