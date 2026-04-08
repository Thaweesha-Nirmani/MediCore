import type { PaginatedMeta } from '@/api/types';

export type PurchaseSupplier = {
  id: string;
  name: string;
  contactNumber?: string;
  email?: string;
  status?: string;
};

export type PurchaseItem = {
  id: string;
  medicineId: string;
  medicine: {
    medicineId: string;
    name: string;
    displayName: string;
    genericName?: string;
  };
  medicineName: string;
  orderedQuantity: number;
  quantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  unitCost: number;
  costPrice: number;
  sellingPrice?: number | null;
  subtotal: number;
  status: string;
  notes?: string;
};

export type PurchaseReceivingEvent = {
  id: string;
  receivedAt?: string | null;
  receivedBy?: unknown;
  notes?: string;
  items: Array<{
    purchaseItemId: string;
    medicineId: string;
    inventoryId?: string | null;
    batchNumber: string;
    quantityReceived: number;
    expiryDate?: string | null;
    manufactureDate?: string | null;
    location?: string;
    purchasePrice: number;
    sellingPrice?: number | null;
    notes?: string;
  }>;
};

export type PurchaseOrder = {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplier: PurchaseSupplier;
  supplierName: string;
  purchaseDate?: string | null;
  expectedDeliveryDate?: string | null;
  orderStatus: string;
  receiveStatus: string;
  deliveryStatus?: string;
  totalAmount: number;
  totalCost: number;
  items: PurchaseItem[];
  notes?: string;
  active?: boolean;
  isDeleted?: boolean;
  receivingEvents: PurchaseReceivingEvent[];
  createdAt?: string | null;
  updatedAt?: string | null;
  audit?: {
    createdAt?: string | null;
    updatedAt?: string | null;
    deletedAt?: string | null;
    createdBy?: unknown;
    updatedBy?: unknown;
    deletedBy?: unknown;
  };
};

export type PurchaseListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  supplierId?: string;
  orderStatus?: 'draft' | 'placed' | 'partially_received' | 'received' | 'cancelled';
  receiveStatus?: 'not_received' | 'partially_received' | 'fully_received';
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'purchaseDate' | 'purchaseNumber' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
};

export type PurchaseListResponse = {
  items: PurchaseOrder[];
  meta?: PaginatedMeta;
};

export type PurchaseFormLineValues = {
  key: string;
  medicineId: string;
  medicineName: string;
  medicineSearch: string;
  orderedQuantity: string;
  unitCost: string;
  sellingPrice: string;
  notes: string;
};

export type PurchaseFormValues = {
  supplierId: string;
  supplierSearch: string;
  purchaseDate: string;
  expectedDeliveryDate: string;
  orderStatus: 'draft' | 'placed';
  notes: string;
  items: PurchaseFormLineValues[];
};

export type CreatePurchasePayload = {
  supplierId: string;
  purchaseDate: string;
  expectedDeliveryDate?: string;
  orderStatus?: 'draft' | 'placed';
  notes?: string;
  items: Array<{
    medicineId: string;
    orderedQuantity: number;
    unitCost: number;
    sellingPrice?: number;
    notes?: string;
  }>;
};

export type ReceivePurchaseItemFormValues = {
  purchaseItemId: string;
  medicineId: string;
  medicineName: string;
  remainingQuantity: number;
  enabled: boolean;
  quantityReceived: string;
  batchNumber: string;
  expiryDate: string;
  manufactureDate: string;
  location: string;
  purchasePrice: string;
  sellingPrice: string;
  notes: string;
};

export type ReceivePurchaseFormValues = {
  receivedAt: string;
  notes: string;
  items: ReceivePurchaseItemFormValues[];
};

export type ReceivePurchasePayload = {
  receivedAt?: string;
  notes?: string;
  items: Array<{
    purchaseItemId: string;
    quantityReceived: number;
    batchNumber: string;
    expiryDate: string;
    manufactureDate?: string;
    location?: string;
    purchasePrice?: number;
    sellingPrice?: number;
    notes?: string;
  }>;
};
