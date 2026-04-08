export type ReportCatalogItem = {
  key: 'sales' | 'stock' | 'expiry' | 'purchases';
  endpoint: string;
  description: string;
  filters: string[];
};

export type ReportCatalogResponse = {
  items: ReportCatalogItem[];
  meta?: {
    total: number;
  };
};

export type SalesReportResponse = {
  type: 'sales';
  range: {
    dateFrom: string;
    dateTo: string;
  };
  summary: {
    saleCount: number;
    grossTotal: number;
    refundTotal: number;
    netTotal: number;
    unitsSold: number;
    averageSaleValue: number;
    statusBreakdown: Array<{
      status: string;
      count: number;
      total: number;
    }>;
  };
  paymentMethods: Array<{
    method: string;
    saleCount: number;
    grossAmount: number;
    refundAmount: number;
    totalAmount: number;
  }>;
  topMedicines: Array<{
    medicineId: string;
    catalogMedicineId: string;
    name: string;
    genericName?: string;
    unitsSold: number;
    revenue: number;
    invoiceCount: number;
  }>;
  timeline: Array<{
    date: string;
    saleCount: number;
    totalAmount: number;
  }>;
  dashboardCrossCheck?: {
    fastMovingPreview: Array<{
      medicineId: string;
      catalogMedicineId: string;
      name: string;
      genericName?: string;
      unitsSold: number;
      revenue: number;
      invoiceCount: number;
    }>;
  };
};

export type StockReportItem = {
  id: string;
  medicineId: string;
  catalogMedicineId: string;
  name: string;
  genericName?: string;
  category?: string;
  barcode?: string;
  batchNumber: string;
  location: string;
  quantity: number;
  availableQuantity: number;
  reorderLevel: number;
  stockStatus: string;
  expiryStatus: string;
  daysToExpire: number | null;
  expiryDate?: string | null;
  manufactureDate?: string | null;
  purchasePrice?: number;
  sellingPrice?: number | null;
  supplierId?: string | null;
  active?: boolean;
};

export type StockReportResponse = {
  items: StockReportItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    summary: {
      totalBatches: number;
      totalQuantity: number;
      availableQuantity: number;
      lowStockCount: number;
      outOfStockCount: number;
      expiredCount: number;
    };
  };
};

export type ExpiryReportResponse = {
  items: StockReportItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    summary: {
      expired: number;
      expiringIn7Days: number;
      expiringIn30Days: number;
    };
  };
};

export type PurchaseReportResponse = {
  type: 'purchases';
  range: {
    dateFrom: string;
    dateTo: string;
  };
  summary: {
    purchaseCount: number;
    totalAmount: number;
    unitsOrdered: number;
    unitsReceived: number;
  };
  statusBreakdown: Array<{
    _id?: string;
    count: number;
    totalAmount: number;
  }>;
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    purchaseCount: number;
    totalAmount: number;
  }>;
  timeline: Array<{
    date: string;
    purchaseCount: number;
    totalAmount: number;
  }>;
};

export type ReportFilterValues = {
  reportType: 'sales' | 'stock' | 'expiry' | 'purchases';
  dateFrom: string;
  dateTo: string;
  topLimit: string;
  search: string;
  location: string;
  status: string;
  window: 'all' | '7' | '30';
};
