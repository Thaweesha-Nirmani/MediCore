const AppError = require('../../../core/app-error');
const reviewRepository = require('../repositories/review.repository');
const { toReviewResponse } = require('../mappers/review.mapper');
const {
  normalizeListQuery,
  normalizeReviewPayload,
  canManageAnyReview,
  canAccessReview,
  normalizeReviewStatus,
  mapActor,
} = require('../utils/review-normalizer');

async function getStoredReviewOrThrow(id) {
  const review = await reviewRepository.findById(id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  return review;
}

async function listReviews(query, user) {
  const options = normalizeListQuery(query);
  const filter = {};

  if (!options.includeArchived) {
    filter.isArchived = false;
  }

  if (options.moduleSource) {
    filter.moduleSource = options.moduleSource;
  }

  if (options.status) {
    filter.status = options.status;
  }

  if (options.search) {
    const searchRegex = new RegExp(options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: searchRegex }, { content: searchRegex }];
  }

  if (!canManageAnyReview(user) || options.mineOnly) {
    filter['createdBy.id'] = user.id;
  }

  const [items, total] = await Promise.all([
    reviewRepository.findMany(filter, {
      sort: { updatedAt: -1, createdAt: -1 },
      skip: (options.page - 1) * options.limit,
      limit: options.limit,
    }),
    reviewRepository.count(filter),
  ]);

  return {
    items: items.map((item) => toReviewResponse(item, user)),
    meta: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit) || 1,
    },
  };
}

async function getReviewById(id, user) {
  const review = await getStoredReviewOrThrow(id);

  if (!canAccessReview(review, user)) {
    throw new AppError('You do not have permission to access this review', 403);
  }

  return toReviewResponse(review, user);
}

async function createReview(payload, user) {
  const data = normalizeReviewPayload(payload, { allowStatus: canManageAnyReview(user) });
  const review = await reviewRepository.create({
    ...data,
    status: normalizeReviewStatus(data.status || 'open'),
    isArchived: false,
    archivedAt: null,
    archivedBy: null,
    createdBy: mapActor(user),
    updatedBy: mapActor(user),
  });

  return toReviewResponse(review, user);
}

async function updateReview(id, payload, user) {
  const review = await getStoredReviewOrThrow(id);

  if (!canAccessReview(review, user)) {
    throw new AppError('You do not have permission to update this review', 403);
  }

  const data = normalizeReviewPayload(payload, {
    partial: true,
    allowStatus: canManageAnyReview(user),
  });

  if (!canManageAnyReview(user) && data.status) {
    throw new AppError('Only managers can change review status', 403);
  }

  Object.assign(review, data);
  review.updatedBy = mapActor(user);

  const saved = await reviewRepository.save(review);
  return toReviewResponse(saved, user);
}

async function archiveReview(id, user) {
  const review = await getStoredReviewOrThrow(id);

  if (!canAccessReview(review, user)) {
    throw new AppError('You do not have permission to archive this review', 403);
  }

  review.isArchived = true;
  review.status = 'archived';
  review.archivedAt = new Date();
  review.archivedBy = mapActor(user);
  review.updatedBy = mapActor(user);

  const saved = await reviewRepository.save(review);
  return toReviewResponse(saved, user);
}

module.exports = {
  listReviews,
  getReviewById,
  createReview,
  updateReview,
  archiveReview,
};
