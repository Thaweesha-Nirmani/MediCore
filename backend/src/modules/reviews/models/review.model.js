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

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    moduleSource: {
      type: String,
      default: 'general',
      trim: true,
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      default: 'open',
      trim: true,
      lowercase: true,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: actorSchema,
      default: null,
    },
    updatedBy: {
      type: actorSchema,
      default: null,
    },
    archivedBy: {
      type: actorSchema,
      default: null,
    },
  },
  {
    collection: 'reviews',
    strict: false,
    timestamps: true,
    versionKey: false,
  }
);

reviewSchema.index({ moduleSource: 1, status: 1, isArchived: 1, updatedAt: -1 });
reviewSchema.index({ 'createdBy.id': 1, updatedAt: -1 });

module.exports =
  mongoose.models.InternalReview ||
  mongoose.model('InternalReview', reviewSchema);
