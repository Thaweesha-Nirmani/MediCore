const { ok, created } = require('../../../core/api-response');
const asyncHandler = require('../../../core/async-handler');
const reviewService = require('../services/review.service');

const listReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.listReviews(req.query, req.user);
  return ok(res, result.items, result.meta);
});

const getReviewById = asyncHandler(async (req, res) => {
  const item = await reviewService.getReviewById(req.params.id, req.user);
  return ok(res, item);
});

const createReview = asyncHandler(async (req, res) => {
  const item = await reviewService.createReview(req.body, req.user);
  return created(res, item);
});

const updateReview = asyncHandler(async (req, res) => {
  const item = await reviewService.updateReview(req.params.id, req.body, req.user);
  return ok(res, item);
});

const archiveReview = asyncHandler(async (req, res) => {
  const item = await reviewService.archiveReview(req.params.id, req.user);
  return ok(res, item);
});

module.exports = {
  listReviews,
  getReviewById,
  createReview,
  updateReview,
  archiveReview,
};
