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

const auditEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['created', 'updated', 'refunded'],
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
    by: {
      type: actorSchema,
      default: null,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const allocationSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryBatch',
      required: true,
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
      min: 0.001,
    },
    location: {
      type: String,
      default: 'MAIN_STORE',
      trim: true,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    sellingPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    refundedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const saleItemSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineCatalog',
      required: true,
    },
    medicineSnapshot: {
      medicineId: { type: String, default: '' },
      name: { type: String, default: '' },
      displayName: { type: String, default: '' },
      genericName: { type: String, default: '' },
      barcode: { type: String, default: '' },
      category: { type: String, default: '' },
      strength: { type: String, default: '' },
      dosageForm: { type: String, default: '' },
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.001,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    refundedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    batchAllocations: {
      type: [allocationSchema],
      default: [],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true }
);

const medicineCompatibilitySchema = new mongoose.Schema(
  {
    medicineId: {
      type: String,
      default: '',
      trim: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    lineTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const refundEntrySchema = new mongoose.Schema(
  {
    saleItemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineCatalog',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.001,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const refundSchema = new mongoose.Schema(
  {
    refundNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    refundTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    items: {
      type: [refundEntrySchema],
      default: [],
    },
    createdBy: {
      type: actorSchema,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const saleRecordSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
      trim: true,
      index: true,
    },
    items: {
      type: [saleItemSchema],
      default: [],
    },
    medicines: {
      type: [medicineCompatibilitySchema],
      default: [],
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    refundTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    netTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    soldBy: {
      type: String,
      default: 'Cashier',
      trim: true,
    },
    servedBy: {
      type: String,
      default: null,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'digital_wallet', 'insurance', 'credit', 'other'],
      default: 'cash',
      index: true,
    },
    payMethod: {
      type: String,
      default: 'cash',
      trim: true,
    },
    status: {
      type: String,
      enum: ['completed', 'partially_refunded', 'refunded', 'voided'],
      default: 'completed',
      index: true,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'requested', 'partial', 'refunded'],
      default: 'none',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    source: {
      type: String,
      default: 'pos',
      trim: true,
    },
    saleDate: {
      type: Date,
      default: Date.now,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    month: {
      type: Number,
      default: () => new Date().getMonth() + 1,
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    createdBy: {
      type: actorSchema,
      default: null,
    },
    updatedBy: {
      type: actorSchema,
      default: null,
    },
    auditTrail: {
      type: [auditEntrySchema],
      default: [],
    },
    refunds: {
      type: [refundSchema],
      default: [],
    },
  },
  {
    collection: 'sales',
    strict: false,
    timestamps: true,
    versionKey: false,
  }
);

saleRecordSchema.index({ billNumber: 1, date: -1 });
saleRecordSchema.index({ customerName: 1, date: -1 });
saleRecordSchema.index({ status: 1, date: -1 });

module.exports =
  mongoose.models.SaleRecord ||
  mongoose.model('SaleRecord', saleRecordSchema);
