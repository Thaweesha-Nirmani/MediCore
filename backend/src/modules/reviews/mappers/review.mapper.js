function toReviewResponse(review, user = null) {
  const createdById = review.createdBy?.id ? String(review.createdBy.id) : null;
  const currentUserId = user?.id ? String(user.id) : null;

  return {
    id: String(review._id),
    title: review.title || '',
    content: review.content || '',
    rating: Number(review.rating || 0),
    moduleSource: review.moduleSource || 'general',
    status: review.status || 'open',
    isArchived: review.isArchived === true,
    createdAt: review.createdAt || null,
    updatedAt: review.updatedAt || null,
    archivedAt: review.archivedAt || null,
    createdBy: review.createdBy || null,
    updatedBy: review.updatedBy || null,
    archivedBy: review.archivedBy || null,
    mine: Boolean(createdById && currentUserId && createdById === currentUserId),
  };
}

module.exports = {
  toReviewResponse,
};
