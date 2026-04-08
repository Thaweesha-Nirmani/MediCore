const { created, ok } = require('../../../core/api-response');
const asyncHandler = require('../../../core/async-handler');
const uploadService = require('../services/upload.service');

const uploadBase64 = asyncHandler(async (req, res) => {
  const item = await uploadService.uploadBase64(req.body, req.user);
  return created(res, item);
});

const getUploadMeta = asyncHandler(async (req, res) => {
  const item = await uploadService.getUploadMeta(req.params.id);
  return ok(res, item);
});

const downloadUpload = asyncHandler(async (req, res) => {
  const result = await uploadService.getUploadDownload(req.params.id);

  res.setHeader('Content-Type', result.upload.mimeType || 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${result.upload.originalName || result.upload.storedName}"`
  );

  result.stream.pipe(res);
});

const archiveUpload = asyncHandler(async (req, res) => {
  const item = await uploadService.archiveUpload(req.params.id, req.user);
  return ok(res, item);
});

module.exports = {
  uploadBase64,
  getUploadMeta,
  downloadUpload,
  archiveUpload,
};
