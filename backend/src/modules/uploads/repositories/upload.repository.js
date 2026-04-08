const UploadFile = require('../models/upload-file.model');

async function create(payload) {
  const document = new UploadFile(payload);
  return document.save();
}

async function findById(id) {
  return UploadFile.findById(id);
}

async function findByIdLean(id) {
  return UploadFile.findById(id).lean();
}

async function save(document) {
  return document.save();
}

module.exports = {
  create,
  findById,
  findByIdLean,
  save,
};
