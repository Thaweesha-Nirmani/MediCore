import type { ReviewFormValues, ReviewPayload } from '@/features/reviews/types';

export function createEmptyReviewFormValues(): ReviewFormValues {
  return {
    title: '',
    content: '',
    rating: '5',
    moduleSource: 'general',
  };
}

export function createReviewFormValues(review: {
  title?: string | null;
  content?: string | null;
  rating?: number | null;
  moduleSource?: string | null;
}): ReviewFormValues {
  return {
    title: review.title || '',
    content: review.content || '',
    rating: String(review.rating || 5),
    moduleSource: review.moduleSource || 'general',
  };
}

export function validateReviewForm(values: ReviewFormValues) {
  const errors: Partial<Record<keyof ReviewFormValues, string>> = {};
  const rating = Number(values.rating);

  if (!values.title.trim()) {
    errors.title = 'Title is required.';
  } else if (values.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters.';
  }

  if (!values.content.trim()) {
    errors.content = 'Feedback is required.';
  } else if (values.content.trim().length < 5) {
    errors.content = 'Feedback must be at least 5 characters.';
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    errors.rating = 'Rating must be between 1 and 5.';
  }

  return errors;
}

export function toReviewPayload(values: ReviewFormValues): ReviewPayload {
  return {
    title: values.title.trim(),
    content: values.content.trim(),
    rating: Number(values.rating),
    moduleSource: values.moduleSource,
  };
}
