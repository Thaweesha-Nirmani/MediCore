import type { PaginatedMeta } from '@/api/types';

export type MedicineStockStatus = 'available' | 'low_stock' | 'out_of_stock';
export type MedicineExpiryStatus =
  | 'expired'
  | 'expiring_in_7_days'
  | 'expiring_in_30_days'
  | 'valid'
  | 'no_expiry';

export type MedicineItem = {
  id: string;
  medicineId: string;
  datasetMedicineId?: string | number;
  name: string;
  genericName?: string;
  brandName?: string;
  displayName?: string;
  strength?: string;
  dosageForm?: string;
  manufacturer?: string;
  supplier?: string;
  barcode?: string | null;
  category?: string;
  unitPrice?: number;
  price?: number;
  quantity?: number;
  stock?: number;
  stockQty?: number;
  restockThreshold?: number;
  leadTimeDays?: number;
  stockStatus?: MedicineStockStatus;
  batchNumber?: string;
  batchId?: string;
  manufactureDate?: string | Date | null;
  expiryDate?: string | Date | null;
  expiryStatus?: MedicineExpiryStatus;
  daysToExpire?: number | null;
  description?: string;
  status?: string;
  active?: boolean;
  isDeleted?: boolean;
  inventorySnapshot?: {
    stockOnHand?: number;
    nextExpiryDate?: string | Date | null;
    batchNumber?: string;
  };
  duplicateWarnings?: MedicineDuplicateMatch[];
  audit?: {
    createdAt?: string | Date | null;
    updatedAt?: string | Date | null;
    deletedAt?: string | Date | null;
    auditTrailCount?: number;
  };
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

export type MedicineListMeta = PaginatedMeta & {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: {
    search?: string;
    category?: string | null;
    supplier?: string | null;
    status?: string | null;
    expiryStatus?: string | null;
    stockLevel?: string | null;
    includeDeleted?: boolean;
  };
  filterOptions?: {
    categories?: string[];
    suppliers?: string[];
  };
};

export type MedicineListResponse = {
  items: MedicineItem[];
  meta?: MedicineListMeta;
};

export type MedicineDetail = MedicineItem & {
  auditTrail?: Array<{
    action?: string;
    at?: string | Date | null;
    note?: string;
    changedFields?: string[];
  }>;
  deletedBy?: {
    id?: string | null;
    role?: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
};

export type MedicineAutocompleteItem = Pick<
  MedicineItem,
  | 'id'
  | 'medicineId'
  | 'name'
  | 'genericName'
  | 'brandName'
  | 'displayName'
  | 'category'
  | 'price'
  | 'barcode'
  | 'quantity'
  | 'expiryStatus'
  | 'daysToExpire'
>;

export type MedicineDuplicateMatch = {
  id: string;
  medicineId: string;
  name: string;
  genericName?: string;
  brandName?: string;
  score: number;
  blocking: boolean;
  matchReason: string;
  matchInput?: string;
  matchAgainst?: string;
};

export type MedicineDuplicateCheckResponse = {
  blocking: boolean;
  count: number;
  matches: MedicineDuplicateMatch[];
  query: {
    name?: string;
    genericName?: string;
    brandName?: string;
  };
};

export type ExpiryAlertsResponse = {
  expired: MedicineItem[];
  expiringSoon?: MedicineItem[];
  expiringIn7Days: MedicineItem[];
  expiringIn30Days: MedicineItem[];
  safe?: MedicineItem[];
  summary: {
    expired: number;
    expiringSoon?: number;
    expiringIn7Days: number;
    expiringIn30Days: number;
    valid: number;
    noExpiry: number;
  };
};

export type MedicineFormValues = {
  medicineId: string;
  genericName: string;
  brandName: string;
  category: string;
  supplier: string;
  manufacturer: string;
  barcode: string;
  unitPrice: string;
  restockThreshold: string;
  leadTimeDays: string;
  stockQty: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  description: string;
};

export type MedicineFormPayload = {
  medicineId?: string;
  medicine_id?: string | number;
  genericName?: string;
  generic_name?: string;
  brandName?: string;
  brand_name?: string;
  category?: string;
  supplier?: string;
  manufacturer?: string;
  barcode?: string;
  unitPrice?: number;
  unit_price_LKR?: number;
  restockThreshold?: number;
  restock_threshold?: number;
  threshold?: number;
  leadTimeDays?: number;
  lead_time_days?: number;
  stockQty?: number;
  stock_qty?: number;
  batchNumber?: string;
  batch_number?: string;
  batch_id?: string;
  manufactureDate?: string;
  manufacture_date?: string;
  expiryDate?: string;
  expiry_date?: string;
  description?: string;
};

export type MedicineListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  supplier?: string;
  status?: string;
  includeDeleted?: boolean;
  sortBy?:
    | 'createdAt'
    | 'updatedAt'
    | 'medicineId'
    | 'name'
    | 'category'
    | 'supplier'
    | 'price'
    | 'unitPrice'
    | 'quantity'
    | 'expiryDate';
  sortOrder?: 'asc' | 'desc';
  expiryStatus?: 'expired' | 'expiring_soon' | 'expiring_in_7_days' | 'expiring_in_30_days' | 'safe' | 'valid';
  stockLevel?: 'available' | 'low' | 'low_stock' | 'out_of_stock';
};
