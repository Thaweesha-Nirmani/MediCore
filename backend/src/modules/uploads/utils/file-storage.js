const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const AppError = require('../../../core/app-error');
const env = require('../../../config/env');

function sanitizeSegment(value, fallback = 'general') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
}

function sanitizeFileName(fileName) {
  return String(fileName || '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ');
}

function getExtension(fileName, mimeType) {
  const explicit = path.extname(fileName || '').replace(/^\./, '').toLowerCase();

  if (explicit) {
    return explicit;
  }

  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/json': 'json',
  };

  return mimeMap[String(mimeType || '').toLowerCase()] || 'bin';
}

function decodeBase64Data(value) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new AppError('base64Data is required', 422);
  }

  const payload = normalized.includes(',')
    ? normalized.slice(normalized.indexOf(',') + 1)
    : normalized;

  let buffer;

  try {
    buffer = Buffer.from(payload, 'base64');
  } catch (_error) {
    throw new AppError('base64Data is not valid base64 content', 422);
  }

  if (!buffer.length) {
    throw new AppError('Decoded upload content is empty', 422);
  }

  if (buffer.length > env.uploadMaxSizeBytes) {
    throw new AppError('Upload exceeds the configured size limit', 422, {
      sizeBytes: buffer.length,
      maxSizeBytes: env.uploadMaxSizeBytes,
    });
  }

  return buffer;
}

async function ensureDirectory(directoryPath) {
  await fs.promises.mkdir(directoryPath, { recursive: true });
}

async function persistBase64Upload({ fileName, mimeType, base64Data, folder }) {
  const safeFolder = sanitizeSegment(folder, 'general');
  const safeOriginalName = sanitizeFileName(fileName);

  if (!safeOriginalName) {
    throw new AppError('fileName is required', 422);
  }

  const extension = getExtension(safeOriginalName, mimeType);
  const buffer = decodeBase64Data(base64Data);
  const checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const storedName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extension}`;
  const relativePath = path.join(safeFolder, storedName);
  const absolutePath = path.resolve(env.uploadRoot, relativePath);
  const uploadRoot = path.resolve(env.uploadRoot);

  if (!absolutePath.startsWith(uploadRoot)) {
    throw new AppError('Resolved upload path is outside the upload root', 500);
  }

  await ensureDirectory(path.dirname(absolutePath));
  await fs.promises.writeFile(absolutePath, buffer);

  return {
    originalName: safeOriginalName,
    storedName,
    mimeType: String(mimeType || 'application/octet-stream').trim().toLowerCase(),
    extension,
    folder: safeFolder,
    relativePath,
    absolutePath,
    sizeBytes: buffer.length,
    checksumSha256,
  };
}

function resolveStoredFile(relativePath) {
  const absolutePath = path.resolve(env.uploadRoot, relativePath);
  const uploadRoot = path.resolve(env.uploadRoot);

  if (!absolutePath.startsWith(uploadRoot)) {
    throw new AppError('Resolved file path is outside the upload root', 500);
  }

  return absolutePath;
}

async function assertStoredFileExists(relativePath) {
  const absolutePath = resolveStoredFile(relativePath);

  try {
    await fs.promises.access(absolutePath, fs.constants.R_OK);
  } catch (_error) {
    throw new AppError('Stored upload file was not found on disk', 404, {
      relativePath,
    });
  }

  return absolutePath;
}

module.exports = {
  persistBase64Upload,
  assertStoredFileExists,
  resolveStoredFile,
};
