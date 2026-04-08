const mongoose = require('mongoose');

const auditEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted'],
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
    by: {
      id: { type: String, default: null },
      role: { type: String, default: null },
      name: { type: String, default: null },
      email: { type: String, default: null },
    },
    changedFields: {
      type: [String],
      default: [],
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const medicineMasterSchema = new mongoose.Schema(
  {
    medicineId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    brandName: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
      index: true,
    },
    strength: {
      type: String,
      default: '',
      trim: true,
    },
    dosageForm: {
      type: String,
      default: '',
      trim: true,
    },
    manufacturer: {
      type: String,
      default: '',
      trim: true,
    },
    supplier: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true,
      index: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0.01,
    },
    manufactureDate: {
      type: Date,
      default: null,
    },
    description: {
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
      genericName: { type: String, default: '', index: true },
      brandName: { type: String, default: '', index: true },
      displayName: { type: String, default: '', index: true },
      category: { type: String, default: '', index: true },
      supplier: { type: String, default: '', index: true },
      barcode: { type: String, default: '', index: true },
      medicineId: { type: String, default: '', index: true },
    },
    inventorySnapshot: {
      stockOnHand: {
        type: Number,
        min: 0,
        default: 0,
      },
      nextExpiryDate: {
        type: Date,
        default: null,
      },
      batchNumber: {
        type: String,
        default: '',
        trim: true,
      },
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active',
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      id: { type: String, default: null },
      role: { type: String, default: null },
      name: { type: String, default: null },
      email: { type: String, default: null },
    },
    auditTrail: {
      type: [auditEntrySchema],
      default: [],
    },
  },
  {
    collection: 'medicines',
    strict: false,
    timestamps: true,
    versionKey: false,
  }
);

medicineMasterSchema.index({ medicineId: 1 }, { unique: true });
medicineMasterSchema.index({ barcode: 1 }, { unique: true, sparse: true });
medicineMasterSchema.index({ active: 1, isDeleted: 1, category: 1, updatedAt: -1 });
medicineMasterSchema.index({ searchText: 1 });

module.exports =
  mongoose.models.MedicineCatalog ||
  mongoose.model('MedicineCatalog', medicineMasterSchema);
