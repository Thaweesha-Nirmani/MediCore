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

const linkedEntitySchema = new mongoose.Schema(
  {
    type: { type: String, default: '', trim: true },
    id: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const uploadFileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    extension: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    folder: {
      type: String,
      default: 'general',
      trim: true,
      lowercase: true,
      index: true,
    },
    purpose: {
      type: String,
      default: '',
      trim: true,
    },
    relativePath: {
      type: String,
      required: true,
      trim: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 1,
    },
    checksumSha256: {
      type: String,
      required: true,
      trim: true,
    },
    linkedEntity: {
      type: linkedEntitySchema,
      default: () => ({}),
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    createdBy: {
      type: actorSchema,
      default: null,
    },
    archivedBy: {
      type: actorSchema,
      default: null,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: 'uploads',
    timestamps: true,
    versionKey: false,
  }
);

uploadFileSchema.index({ folder: 1, createdAt: -1 });
uploadFileSchema.index({ status: 1, createdAt: -1 });
uploadFileSchema.index({ checksumSha256: 1 });

module.exports =
  mongoose.models.UploadFile ||
  mongoose.model('UploadFile', uploadFileSchema);
