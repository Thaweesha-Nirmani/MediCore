const mongoose = require('mongoose');

const actorSchema = new mongoose.Schema(
  {
    id: { type: String, default: null },
    role: { type: String, default: null },
    name: { type: String, default: null },
    email: { type: String, default: null },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    postalCode: { type: String, default: '', trim: true },
    country: { type: String, default: 'Sri Lanka', trim: true },
  },
  { _id: false }
);

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    contactPerson: {
      type: String,
      default: '',
      trim: true,
    },
    alternateContact: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
      index: true,
    },
    address: {
      type: addressSchema,
      default: () => ({}),
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    searchText: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    normalized: {
      name: { type: String, default: '', index: true },
      contactNumber: { type: String, default: '', index: true },
      email: { type: String, default: '', index: true },
      city: { type: String, default: '', index: true },
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active',
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: actorSchema,
      default: null,
    },
    updatedBy: {
      type: actorSchema,
      default: null,
    },
    deletedBy: {
      type: actorSchema,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: 'suppliers',
    timestamps: true,
    versionKey: false,
  }
);

supplierSchema.index({ active: 1, isDeleted: 1, status: 1, updatedAt: -1 });
supplierSchema.index({ searchText: 1 });

module.exports = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);
