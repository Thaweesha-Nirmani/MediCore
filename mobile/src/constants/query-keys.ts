export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
    activity: ['dashboard', 'activity'] as const,
    fastMoving: ['dashboard', 'fast-moving'] as const,
  },
  medicines: {
    list: ['medicines', 'list'] as const,
    autocomplete: ['medicines', 'autocomplete'] as const,
    detail: (id: string) => ['medicines', 'detail', id] as const,
    expiry: ['medicines', 'expiry'] as const,
  },
  inventory: {
    list: ['inventory', 'list'] as const,
    lowStock: ['inventory', 'low-stock'] as const,
    detail: (id: string) => ['inventory', 'detail', id] as const,
    expiry: ['inventory', 'expiry'] as const,
    movements: ['inventory', 'movements'] as const,
    medicine: (medicineId: string) => ['inventory', 'medicine', medicineId] as const,
  },
  suppliers: {
    list: ['suppliers', 'list'] as const,
    search: ['suppliers', 'search'] as const,
    detail: (id: string) => ['suppliers', 'detail', id] as const,
  },
  purchases: {
    list: ['purchases', 'list'] as const,
    detail: (id: string) => ['purchases', 'detail', id] as const,
  },
  sales: {
    history: ['sales', 'history'] as const,
    search: ['sales', 'search'] as const,
    detail: (id: string) => ['sales', 'detail', id] as const,
    barcode: ['sales', 'barcode'] as const,
  },
  reports: {
    sales: ['reports', 'sales'] as const,
    stock: ['reports', 'stock'] as const,
    expiry: ['reports', 'expiry'] as const,
    purchases: ['reports', 'purchases'] as const,
  },
  users: {
    list: ['users', 'list'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  reviews: {
    list: ['reviews', 'list'] as const,
    detail: (id: string) => ['reviews', 'detail', id] as const,
  },
};
