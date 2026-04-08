const fs = require('fs');
const mongoose = require('mongoose');

const AppError = require('../../../core/app-error');
const env = require('../../../config/env');
const { mapActor } = require('../../inventory/utils/audit');
const { toUploadResponse } = require('../mappers/upload.mapper');
const repository = require('../repositories/upload.repository');
const { assertStoredFileExists, persistBase64Upload } = require('../utils/file-storage');

function ensureValidId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Upload id must be a valid ObjectId', 422);
  }
}

async function uploadBase64(payload, user) {
  const stored = await persistBase64Upload({
    fileName: payload.fileName,
    mimeType: payload.mimeType,
    base64Data: payload.base64Data,
    folder: payload.folder,
  });

  const document = await repository.create({
    originalName: stored.originalName,
    storedName: stored.storedName,
    mimeType: stored.mimeType,
    extension: stored.extension,
    folder: stored.folder,
    relativePath: stored.relativePath,
    sizeBytes: stored.sizeBytes,
    checksumSha256: stored.checksumSha256,
    purpose: String(payload.purpose || '').trim(),
    linkedEntity: payload.linkedEntity || {},
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
    createdBy: mapActor(user),
  });

  return toUploadResponse(document.toObject(), env.apiPrefix);
}

async function getUploadMeta(id) {
  ensureValidId(id);

  const upload = await repository.findByIdLean(id);

  if (!upload) {
    throw new AppError('Upload not found', 404);
  }

  return toUploadResponse(upload, env.apiPrefix);
}

async function getUploadDownload(id) {
  ensureValidId(id);

  const upload = await repository.findByIdLean(id);

  if (!upload || upload.status !== 'active') {
    throw new AppError('Upload not found', 404);
  }

  const absolutePath = await assertStoredFileExists(upload.relativePath);

  return {
    upload,
    stream: fs.createReadStream(absolutePath),
  };
}

async function archiveUpload(id, user) {
  ensureValidId(id);

  const upload = await repository.findById(id);

  if (!upload) {
    throw new AppError('Upload not found', 404);
  }

  upload.status = 'archived';
  upload.archivedAt = new Date();
  upload.archivedBy = mapActor(user);

  const updated = await repository.save(upload);
  return toUploadResponse(updated.toObject(), env.apiPrefix);
}

module.exports = {
  uploadBase64,
  getUploadMeta,
  getUploadDownload,
  archiveUpload,
};
