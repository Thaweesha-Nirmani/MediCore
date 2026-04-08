const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    replacedByTokenId: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const actorSchema = new mongoose.Schema(
  {
    id: { type: String, default: null },
    role: { type: String, default: null },
    name: { type: String, default: null },
    email: { type: String, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      default: '',
      trim: true,
      index: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    contactNumber: {
      type: String,
      default: '',
      trim: true,
    },
    passwordHash: {
      type: String,
      default: '',
      select: false,
    },
    password: {
      type: String,
      default: '',
      select: false,
    },
    password_hash: {
      type: String,
      default: '',
      select: false,
    },
    role: {
      type: String,
      default: 'pharmacist',
      index: true,
    },
    status: {
      type: String,
      default: 'active',
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    initials: {
      type: String,
      default: '',
      trim: true,
    },
    color: {
      type: String,
      default: '#0a2a5e',
      trim: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
      select: false,
    },
    createdBy: {
      type: actorSchema,
      default: null,
    },
    updatedBy: {
      type: actorSchema,
      default: null,
    },
  },
  {
    collection: 'users',
    strict: false,
    timestamps: true,
    versionKey: false,
  }
);

userSchema.methods.getPasswordHash = function getPasswordHash() {
  return this.passwordHash || this.password_hash || this.password || '';
};

userSchema.methods.setPasswordHash = function setPasswordHash(hash) {
  this.passwordHash = hash;
  this.password = hash;
  this.password_hash = hash;
};

module.exports =
  mongoose.models.AppUser ||
  mongoose.model('AppUser', userSchema);
