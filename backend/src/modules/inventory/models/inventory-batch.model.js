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

const inventoryBatchSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineCatalog',
      required: true,
      index: true,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    manufactureDate: {
      type: Date,
      default: null,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      default: 'MAIN_STORE',
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
      index: true,
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    stockStatus: {
      type: String,
      enum: ['available', 'low_stock', 'out_of_stock', 'expired', 'damaged', 'quarantined', 'disposed', 'archived'],
      default: 'available',
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
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
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: 'inventory_batches',
    timestamps: true,
    versionKey: false,
  }
);

inventoryBatchSchema.index(
  { medicineId: 1, batchNumber: 1, location: 1, active: 1 },
  {
    unique: true,
    partialFilterExpression: { active: true },
  }
);

module.exports =
  mongoose.models.InventoryBatch ||
  mongoose.model('InventoryBatch', inventoryBatchSchema);
