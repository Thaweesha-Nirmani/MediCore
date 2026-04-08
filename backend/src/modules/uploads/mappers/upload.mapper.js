function toId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'object' && value._id) {
    return String(value._id);
  }

  return String(value);
}

function toUploadResponse(upload, apiPrefix = '/api/v1') {
  return {
    id: toId(upload._id),
    originalName: upload.originalName || '',
    storedName: upload.storedName || '',
    mimeType: upload.mimeType || 'application/octet-stream',
    extension: upload.extension || '',
    folder: upload.folder || 'general',
    purpose: upload.purpose || '',
    sizeBytes: Number(upload.sizeBytes || 0),
    checksumSha256: upload.checksumSha256 || '',
    status: upload.status || 'active',
    linkedEntity: upload.linkedEntity || { type: '', id: '' },
    metadata: upload.metadata || {},
    downloadPath: `${apiPrefix}/uploads/${toId(upload._id)}/download`,
    metaPath: `${apiPrefix}/uploads/${toId(upload._id)}/meta`,
    createdAt: upload.createdAt || null,
    updatedAt: upload.updatedAt || null,
    archivedAt: upload.archivedAt || null,
  };
}

module.exports = {
  toUploadResponse,
};
