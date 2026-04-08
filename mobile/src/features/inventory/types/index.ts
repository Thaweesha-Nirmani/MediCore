export type InventoryBatch = {
  id: string;
  medicineId: string;
  medicine?: {
    id: string;
    medicineId: string;
    name: string;
    displayName: string;
    category?: string;
    strength?: string;
    dosageForm?: string;
  } | null;
  batchNumber: string;
  quantity: number;
  availableQuantity: number;
  stockStatus: string;
  expiryStatus: string;
  expiryDate?: string | null;
  expiryBucket?: string;
  manufactureDate?: string | null;
  purchasePrice?: number;
  sellingPrice?: number | null;
  location?: string;
  supplierId?: string | null;
  reorderLevel?: number;
  daysToExpire?: number | null;
  notes?: string;
  active?: boolean;
  audit?: {
    createdAt?: string | null;
    updatedAt?: string | null;
    archivedAt?: string | null;
    createdBy?: unknown;
    updatedBy?: unknown;
  };
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type InventoryMovement = {
  id: string;
  inventoryId: string;
  medicineId: string;
  medicine?: {
    medicineId?: string;
    name?: string;
  } | null;
  batchNumber: string;
  type: string;
  reason: string;
  quantityChange: number;
  beforeQuantity: number;
  afterQuantity: number;
  fromLocation?: string;
  toLocation?: string;
  metadata?: Record<string, unknown>;
  createdBy?: {
    id?: string | null;
    role?: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
  createdAt?: string | null;
};

export type LowStockAlert = {
  medicine: {
    id: string;
    medicineId: string;
    name: string;
    displayName: string;
    category?: string;
  } | null;
  threshold: number;
  totalAvailableQuantity: number;
  batches: InventoryBatch[];
  alertLevel: 'out_of_stock' | 'critical' | 'low';
};

export type LowStockResponse = {
  items: LowStockAlert[];
  summary: {
    totalAlerts: number;
    critical: number;
    outOfStock: number;
  };
};

export type InventoryExpiryResponse = {
  expired: InventoryBatch[];
  expiringIn7Days: InventoryBatch[];
  expiringIn30Days: InventoryBatch[];
  summary: {
    expired: number;
    expiringIn7Days: number;
    expiringIn30Days: number;
  };
};

export type InventoryListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  medicineId?: string;
  stockStatus?: string;
  location?: string;
  batchNumber?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'expiryDate' | 'quantity' | 'location' | 'batchNumber';
  sortOrder?: 'asc' | 'desc';
  includeArchived?: boolean;
};

export type MovementListQuery = {
  page?: number;
  limit?: number;
  medicineId?: string;
  inventoryId?: string;
  type?: string;
};

export type AddStockFormValues = {
  medicineId: string;
  medicineSearch: string;
  batchNumber: string;
  quantity: string;
  expiryDate: string;
  manufactureDate: string;
  purchasePrice: string;
  sellingPrice: string;
  location: string;
  supplierId: string;
  reorderLevel: string;
  notes: string;
  mergeIfExists: boolean;
};

export type AddStockPayload = {
  medicineId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  manufactureDate?: string;
  purchasePrice: number;
  sellingPrice?: number;
  location?: string;
  supplierId?: string;
  reorderLevel?: number;
  notes?: string;
  mergeIfExists?: boolean;
};

export type AdjustInventoryFormValues = {
  action: 'increase' | 'decrease' | 'correction' | 'damage' | 'dispose' | 'transfer';
  quantityChange: string;
  newQuantity: string;
  reason: string;
  toLocation: string;
};

export type AdjustInventoryPayload = {
  inventoryId: string;
  action?: 'increase' | 'decrease' | 'correction' | 'damage' | 'dispose' | 'transfer';
  quantityChange?: number;
  newQuantity?: number;
  reason: string;
  toLocation?: string;
};
