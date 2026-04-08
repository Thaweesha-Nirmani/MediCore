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

const movementSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryBatch',
      required: true,
      index: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineCatalog',
      required: true,
      index: true,
    },
    medicineSnapshot: {
      medicineId: { type: String, default: '' },
      name: { type: String, default: '' },
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['add', 'update', 'adjust', 'transfer_in', 'transfer_out', 'dispose', 'expire', 'sale', 'refund'],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    beforeQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    afterQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    fromLocation: {
      type: String,
      default: '',
      trim: true,
    },
    toLocation: {
      type: String,
      default: '',
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: actorSchema,
      default: null,
    },
  },
  {
    collection: 'inventory_movements',
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

movementSchema.index({ medicineId: 1, createdAt: -1 });
movementSchema.index({ inventoryId: 1, createdAt: -1 });

module.exports =
  mongoose.models.InventoryMovement ||
  mongoose.model('InventoryMovement', movementSchema);
