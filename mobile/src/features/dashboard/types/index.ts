import type { PaginatedMeta } from '@/api/types';

export type DashboardSummary = {
  generatedAt: string;
  totals: {
    totalMedicines: number;
    lowStockCount: number;
    expiredStockCount: number;
  };
  salesSummary: {
    today: {
      saleCount: number;
      totalSales: number;
      unitsSold: number;
      averageSaleValue: number;
    };
    last7Days: {
      saleCount: number;
      totalSales: number;
      unitsSold: number;
      averageSaleValue: number;
    };
    last30Days: {
      saleCount: number;
      totalSales: number;
      unitsSold: number;
      averageSaleValue: number;
    };
  };
  purchaseSummary: {
    last30Days: {
      purchaseCount: number;
      totalAmount: number;
      unitsOrdered: number;
      unitsReceived: number;
    };
    openOrders: number;
    receivedOrders: number;
  };
  recentActivity: DashboardActivityItem[];
  fastMovingMedicines: DashboardFastMovingMedicine[];
};

export type DashboardActivityItem = {
  id: string;
  type: 'sale' | 'purchase' | 'inventory';
  at: string;
  label: string;
  subtitle: string;
  amount: number;
  status: string;
  actor?: string | null;
};

export type DashboardFastMovingMedicine = {
  medicineId: string;
  catalogMedicineId: string;
  name: string;
  genericName?: string;
  barcode?: string;
  unitsSold: number;
  revenue: number;
  invoiceCount: number;
};

export type DashboardActivityResponse = {
  items: DashboardActivityItem[];
  meta?: PaginatedMeta;
};
