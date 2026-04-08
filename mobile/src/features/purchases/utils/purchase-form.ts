import type {
  CreatePurchasePayload,
  PurchaseFormLineValues,
  PurchaseFormValues,
  PurchaseOrder,
  ReceivePurchaseFormValues,
  ReceivePurchasePayload,
} from '@/features/purchases/types';

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function createEmptyPurchaseLine(): PurchaseFormLineValues {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    medicineId: '',
    medicineName: '',
    medicineSearch: '',
    orderedQuantity: '',
    unitCost: '',
    sellingPrice: '',
    notes: '',
  };
}

export function createEmptyPurchaseFormValues(): PurchaseFormValues {
  return {
    supplierId: '',
    supplierSearch: '',
    purchaseDate: todayString(),
    expectedDeliveryDate: '',
    orderStatus: 'placed',
    notes: '',
    items: [],
  };
}

function isValidDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return false;
  }

  const parsed = new Date(trimmed);
  return !Number.isNaN(parsed.getTime());
}

export function validatePurchaseForm(values: PurchaseFormValues) {
  const errors: Record<string, string> = {};

  if (!values.supplierId) {
    errors.supplierId = 'Select a supplier.';
  }

  if (!isValidDate(values.purchaseDate)) {
    errors.purchaseDate = 'Use the purchase date format YYYY-MM-DD.';
  }

  if (values.expectedDeliveryDate.trim()) {
    if (!isValidDate(values.expectedDeliveryDate)) {
      errors.expectedDeliveryDate = 'Use the expected delivery format YYYY-MM-DD.';
    } else if (new Date(values.purchaseDate) > new Date(values.expectedDeliveryDate)) {
      errors.expectedDeliveryDate = 'Expected delivery must be after the purchase date.';
    }
  }

  if (!values.items.length) {
    errors.items = 'Add at least one medicine item.';
  }

  values.items.forEach((item, index) => {
    if (!item.medicineId) {
      errors[`items.${index}.medicineId`] = 'Select a medicine.';
    }

    const orderedQuantity = Number(item.orderedQuantity);
    if (!Number.isFinite(orderedQuantity) || orderedQuantity <= 0) {
      errors[`items.${index}.orderedQuantity`] = 'Enter a quantity greater than 0.';
    }

    const unitCost = Number(item.unitCost);
    if (!Number.isFinite(unitCost) || unitCost <= 0) {
      errors[`items.${index}.unitCost`] = 'Enter a cost greater than 0.';
    }

    if (item.sellingPrice.trim()) {
      const sellingPrice = Number(item.sellingPrice);
      if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
        errors[`items.${index}.sellingPrice`] = 'Selling price cannot be negative.';
      }
    }
  });

  return errors;
}

export function toCreatePurchasePayload(values: PurchaseFormValues): CreatePurchasePayload {
  return {
    supplierId: values.supplierId,
    purchaseDate: values.purchaseDate,
    expectedDeliveryDate: values.expectedDeliveryDate.trim() || undefined,
    orderStatus: values.orderStatus,
    notes: values.notes.trim() || undefined,
    items: values.items.map((item) => ({
      medicineId: item.medicineId,
      orderedQuantity: Number(item.orderedQuantity),
      unitCost: Number(item.unitCost),
      sellingPrice: item.sellingPrice.trim() ? Number(item.sellingPrice) : undefined,
      notes: item.notes.trim() || undefined,
    })),
  };
}

export function createReceiveFormValues(purchase: PurchaseOrder): ReceivePurchaseFormValues {
  return {
    receivedAt: todayString(),
    notes: '',
    items: purchase.items
      .filter((item) => item.remainingQuantity > 0)
      .map((item) => ({
        purchaseItemId: item.id,
        medicineId: item.medicineId,
        medicineName: item.medicine.displayName || item.medicineName,
        remainingQuantity: item.remainingQuantity,
        enabled: true,
        quantityReceived: String(item.remainingQuantity),
        batchNumber: '',
        expiryDate: '',
        manufactureDate: '',
        location: 'MAIN_STORE',
        purchasePrice: String(item.unitCost),
        sellingPrice:
          item.sellingPrice === null || item.sellingPrice === undefined ? '' : String(item.sellingPrice),
        notes: '',
      })),
  };
}

export function validateReceivePurchaseForm(values: ReceivePurchaseFormValues) {
  const errors: Record<string, string> = {};
  const enabledItems = values.items.filter((item) => item.enabled);

  if (!enabledItems.length) {
    errors.items = 'Enable at least one line to receive stock.';
  }

  if (!values.receivedAt.trim()) {
    errors.receivedAt = 'Received date is required.';
  } else if (!isValidDate(values.receivedAt)) {
    errors.receivedAt = 'Use the received date format YYYY-MM-DD.';
  }

  values.items.forEach((item, index) => {
    if (!item.enabled) {
      return;
    }

    const quantity = Number(item.quantityReceived);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors[`items.${index}.quantityReceived`] = 'Enter a quantity greater than 0.';
    } else if (quantity > item.remainingQuantity) {
      errors[`items.${index}.quantityReceived`] = 'Quantity exceeds remaining ordered stock.';
    }

    if (!item.batchNumber.trim()) {
      errors[`items.${index}.batchNumber`] = 'Batch number is required.';
    }

    if (!isValidDate(item.expiryDate)) {
      errors[`items.${index}.expiryDate`] = 'Use the expiry date format YYYY-MM-DD.';
    }

    if (item.manufactureDate.trim()) {
      if (!isValidDate(item.manufactureDate)) {
        errors[`items.${index}.manufactureDate`] =
          'Use the manufacture date format YYYY-MM-DD.';
      } else if (new Date(item.manufactureDate) > new Date(item.expiryDate)) {
        errors[`items.${index}.manufactureDate`] = 'Manufacture date must be before expiry.';
      }
    }

    const purchasePrice = Number(item.purchasePrice);
    if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
      errors[`items.${index}.purchasePrice`] = 'Enter a purchase price greater than 0.';
    }

    if (item.sellingPrice.trim()) {
      const sellingPrice = Number(item.sellingPrice);
      if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
        errors[`items.${index}.sellingPrice`] = 'Selling price cannot be negative.';
      }
    }
  });

  return errors;
}

export function toReceivePurchasePayload(values: ReceivePurchaseFormValues): ReceivePurchasePayload {
  return {
    receivedAt: values.receivedAt.trim() || undefined,
    notes: values.notes.trim() || undefined,
    items: values.items
      .filter((item) => item.enabled)
      .map((item) => ({
        purchaseItemId: item.purchaseItemId,
        quantityReceived: Number(item.quantityReceived),
        batchNumber: item.batchNumber.trim(),
        expiryDate: item.expiryDate,
        manufactureDate: item.manufactureDate.trim() || undefined,
        location: item.location.trim() || undefined,
        purchasePrice: item.purchasePrice.trim() ? Number(item.purchasePrice) : undefined,
        sellingPrice: item.sellingPrice.trim() ? Number(item.sellingPrice) : undefined,
        notes: item.notes.trim() || undefined,
      })),
  };
}
