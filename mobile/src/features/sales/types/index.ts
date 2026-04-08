export type SaleRecord = {
  id: string;
  _id?: string;
  billNumber: string;
  invoiceNumber?: string;
  customerName?: string;
  medicines?: Array<{
    medicineId: string;
    name: string;
    quantity: number;
    price: number;
    lineTotal: number;
    barcode?: string;
  }>;
  itemCount?: number;
  subtotal?: number;
  tax?: number;
  discount?: number;
  serviceFee?: number;
  total: number;
  refundTotal?: number;
  netTotal?: number;
  paymentMethod: string;
  payMethod?: string;
  soldBy?: string;
  status?: string;
  refundStatus?: string;
  date?: string | null;
  saleDate?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type BillingLookupMedicine = {
  id: string;
  _id?: string;
  medicineId: string;
  name: string;
  displayName: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  category?: string;
  barcode?: string;
  price: number;
  stock: number;
  availableQuantity: number;
  stockStatus: string;
  nextExpiryDate?: string | null;
};

export type SaleLineItem = {
  id?: string | null;
  medicineId: string;
  name: string;
  displayName: string;
  genericName?: string;
  barcode?: string;
  category?: string;
  strength?: string;
  dosageForm?: string;
  quantity: number;
  unitPrice: number;
  price: number;
  lineTotal: number;
  batchAllocations: Array<{
    inventoryId?: string | null;
    batchNumber: string;
    quantity: number;
    location: string;
    expiryDate?: string | null;
    sellingPrice?: number | null;
    refundedQuantity?: number;
  }>;
  refundedQuantity?: number;
};

export type SaleDetail = SaleRecord & {
  items: SaleLineItem[];
  invoice?: {
    number: string;
    issuedAt?: string | null;
    subtotal: number;
    tax: number;
    discount: number;
    serviceFee: number;
    total: number;
    refundTotal?: number;
    netTotal?: number;
    paymentMethod: string;
    status: string;
  };
  notes?: string;
  refunds?: Array<{
    id?: string | null;
    refundNumber: string;
    reason: string;
    notes?: string;
    refundTotal: number;
    createdAt?: string | null;
    items: Array<{
      saleItemId?: string | null;
      medicineId?: string | null;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
  }>;
  audit?: {
    createdBy?: unknown;
    updatedBy?: unknown;
    auditTrail?: unknown[];
  };
};

export type SalesHistoryQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'completed' | 'refunded' | 'partially_refunded' | 'voided' | 'paid';
  from?: string;
  to?: string;
  sortBy?: 'date' | 'createdAt' | 'updatedAt' | 'billNumber' | 'customerName' | 'total';
  sortOrder?: 'asc' | 'desc';
};

export type CreateSalePayload = {
  customerName?: string;
  paymentMethod?: string;
  notes?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  serviceFee?: number;
  total?: number;
  items: Array<{
    medicineId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export type RefundSalePayload = {
  reason: string;
  notes?: string;
  items?: Array<{
    saleItemId?: string;
    medicineId?: string;
    quantity?: number;
  }>;
};

export type CartItem = {
  medicineId: string;
  name: string;
  displayName: string;
  barcode?: string;
  price: number;
  availableQuantity: number;
  stockStatus: string;
  quantity: number;
  genericName?: string;
  category?: string;
  strength?: string;
  dosageForm?: string;
};

export type CheckoutFormValues = {
  customerName: string;
  paymentMethod: 'cash' | 'card' | 'digital_wallet' | 'insurance' | 'credit' | 'other';
  notes: string;
  discount: string;
  tax: string;
  serviceFee: string;
};
