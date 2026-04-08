import { create } from 'zustand';

import type { BillingLookupMedicine, CartItem, CheckoutFormValues } from '@/features/sales/types';

type SalesCartState = {
  items: CartItem[];
  checkout: CheckoutFormValues;
  addMedicine: (medicine: BillingLookupMedicine) => { ok: boolean; message?: string };
  removeItem: (medicineId: string) => void;
  incrementQuantity: (medicineId: string) => { ok: boolean; message?: string };
  decrementQuantity: (medicineId: string) => void;
  setQuantity: (medicineId: string, quantity: number) => { ok: boolean; message?: string };
  setCheckoutField: <K extends keyof CheckoutFormValues>(field: K, value: CheckoutFormValues[K]) => void;
  clearCart: () => void;
};

const initialCheckout: CheckoutFormValues = {
  customerName: '',
  paymentMethod: 'cash',
  notes: '',
  discount: '',
  tax: '',
  serviceFee: '',
};

function mapMedicineToCartItem(medicine: BillingLookupMedicine): CartItem {
  return {
    medicineId: medicine.id,
    name: medicine.name,
    displayName: medicine.displayName,
    barcode: medicine.barcode,
    price: medicine.price,
    availableQuantity: medicine.availableQuantity,
    stockStatus: medicine.stockStatus,
    quantity: 1,
    genericName: medicine.genericName,
    category: medicine.category,
    strength: medicine.strength,
    dosageForm: medicine.dosageForm,
  };
}

export const useSalesCartStore = create<SalesCartState>((set, get) => ({
  items: [],
  checkout: initialCheckout,
  addMedicine(medicine) {
    if (medicine.availableQuantity <= 0) {
      return { ok: false, message: 'This medicine is out of stock.' };
    }

    const existing = get().items.find((item) => item.medicineId === medicine.id);

    if (!existing) {
      set((state) => ({
        items: [...state.items, mapMedicineToCartItem(medicine)],
      }));
      return { ok: true };
    }

    if (existing.quantity >= existing.availableQuantity) {
      return { ok: false, message: 'Cart quantity cannot exceed available stock.' };
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.medicineId === medicine.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ),
    }));

    return { ok: true };
  },
  removeItem(medicineId) {
    set((state) => ({
      items: state.items.filter((item) => item.medicineId !== medicineId),
    }));
  },
  incrementQuantity(medicineId) {
    const item = get().items.find((entry) => entry.medicineId === medicineId);

    if (!item) {
      return { ok: false, message: 'Cart item not found.' };
    }

    if (item.quantity >= item.availableQuantity) {
      return { ok: false, message: 'Cart quantity cannot exceed available stock.' };
    }

    set((state) => ({
      items: state.items.map((entry) =>
        entry.medicineId === medicineId
          ? { ...entry, quantity: entry.quantity + 1 }
          : entry
      ),
    }));

    return { ok: true };
  },
  decrementQuantity(medicineId) {
    const item = get().items.find((entry) => entry.medicineId === medicineId);

    if (!item) {
      return;
    }

    if (item.quantity <= 1) {
      get().removeItem(medicineId);
      return;
    }

    set((state) => ({
      items: state.items.map((entry) =>
        entry.medicineId === medicineId
          ? { ...entry, quantity: entry.quantity - 1 }
          : entry
      ),
    }));
  },
  setQuantity(medicineId, quantity) {
    const item = get().items.find((entry) => entry.medicineId === medicineId);

    if (!item) {
      return { ok: false, message: 'Cart item not found.' };
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { ok: false, message: 'Quantity must be greater than 0.' };
    }

    if (quantity > item.availableQuantity) {
      return { ok: false, message: 'Cart quantity cannot exceed available stock.' };
    }

    set((state) => ({
      items: state.items.map((entry) =>
        entry.medicineId === medicineId
          ? { ...entry, quantity }
          : entry
      ),
    }));

    return { ok: true };
  },
  setCheckoutField(field, value) {
    set((state) => ({
      checkout: {
        ...state.checkout,
        [field]: value,
      },
    }));
  },
  clearCart() {
    set({
      items: [],
      checkout: initialCheckout,
    });
  },
}));
