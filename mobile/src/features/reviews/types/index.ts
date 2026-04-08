import type { ListQuery } from '@/api/types';

export type ReviewStatus = 'open' | 'acknowledged' | 'resolved' | 'archived';
export type ReviewModuleSource =
  | 'general'
  | 'dashboard'
  | 'medicines'
  | 'inventory'
  | 'sales'
  | 'purchases'
  | 'reports'
  | 'reviews';

export type ReviewActor = {
  id: string | null;
  role?: string | null;
  name?: string | null;
  email?: string | null;
};

export type ReviewItem = {
  id: string;
  title: string;
  content: string;
  rating: number;
  moduleSource: ReviewModuleSource | string;
  status: ReviewStatus | string;
  isArchived: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  archivedAt?: string | null;
  createdBy?: ReviewActor | null;
  updatedBy?: ReviewActor | null;
  archivedBy?: ReviewActor | null;
  mine?: boolean;
};

export type ReviewListQuery = ListQuery & {
  status?: ReviewStatus | string;
  moduleSource?: ReviewModuleSource | string;
  mine?: boolean;
  includeArchived?: boolean;
};

export type ReviewFormValues = {
  title: string;
  content: string;
  rating: string;
  moduleSource: ReviewModuleSource | string;
};

export type ReviewPayload = {
  title: string;
  content: string;
  rating: number;
  moduleSource?: ReviewModuleSource | string;
  status?: ReviewStatus | string;
};
