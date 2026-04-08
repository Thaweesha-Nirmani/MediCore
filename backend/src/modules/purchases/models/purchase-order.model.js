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

const purchaseItemSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineCatalog',
      required: true,
      index: true,
    },
    medicineSnapshot: {
      medicineId: { type: String, default: '' },
      name: { type: String, default: '' },
      displayName: { type: String, default: '' },
      genericName: { type: String, default: '' },
    },
    orderedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0.01,
    },
    sellingPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0.01,
    },
    status: {
      type: String,
      enum: ['pending', 'partially_received', 'received', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true }
);

const receiptItemSchema = new mongoose.Schema(
  {
    purchaseItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineCatalog',
      required: true,
    },
    inventoryId: {
      type: String,
      default: null,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    quantityReceived: {
      type: Number,
      required: true,
      min: 0.000001,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    manufactureDate: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      default: 'MAIN_STORE',
      trim: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0.01,
    },
    sellingPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const receivingEventSchema = new mongoose.Schema(
  {
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    receivedBy: {
      type: actorSchema,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    items: {
      type: [receiptItemSchema],
      default: [],
    },
  },
  { _id: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    purchaseNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    supplierSnapshot: {
      name: { type: String, default: '' },
      contactNumber: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    purchaseDate: {
      type: Date,
      required: true,
      index: true,
    },
    expectedDeliveryDate: {
      type: Date,
      default: null,
    },
    orderStatus: {
      type: String,
      enum: ['draft', 'placed', 'partially_received', 'received', 'cancelled'],
      default: 'placed',
      index: true,
    },
    receiveStatus: {
      type: String,
      enum: ['not_received', 'partially_received', 'fully_received'],
      default: 'not_received',
      index: true,
    },
    items: {
      type: [purchaseItemSchema],
      validate: [
        {
          validator: function validator(value) {
            return Array.isArray(value) && value.length > 0;
          },
          message: 'At least one purchase item is required',
        },
      ],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    receivingEvents: {
      type: [receivingEventSchema],
      default: [],
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
    collection: 'purchases',
    timestamps: true,
    versionKey: false,
  }
);

purchaseOrderSchema.index({ supplierId: 1, purchaseDate: -1 });
purchaseOrderSchema.index({ orderStatus: 1, receiveStatus: 1, updatedAt: -1 });

module.exports =
  mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', purchaseOrderSchema);
