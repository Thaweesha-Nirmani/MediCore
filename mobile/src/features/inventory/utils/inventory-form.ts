import type {
  AddStockFormValues,
  AddStockPayload,
  AdjustInventoryFormValues,
  AdjustInventoryPayload,
  InventoryBatch,
} from '@/features/inventory/types';

function isValidIsoDate(value: string) {
  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return false;
  }

  const parsed = new Date(trimmed);
  return !Number.isNaN(parsed.getTime());
}

export function validateAddStockForm(values: AddStockFormValues) {
  const errors: Partial<Record<keyof AddStockFormValues, string>> = {};
  const batchNumber = values.batchNumber.trim();
  const location = values.location.trim();
  const notes = values.notes.trim();

  if (!values.medicineId.trim()) {
    errors.medicineId = 'Select a medicine first.';
  }

  if (!batchNumber) {
    errors.batchNumber = 'Batch number is required.';
  } else if (batchNumber.length > 80) {
    errors.batchNumber = 'Batch number must be 80 characters or fewer.';
  }

  const quantity = Number(values.quantity);

  if (!values.quantity.trim()) {
    errors.quantity = 'Quantity is required.';
  } else if (!Number.isFinite(quantity) || quantity <= 0) {
    errors.quantity = 'Quantity must be greater than 0.';
  }

  if (!values.expiryDate.trim()) {
    errors.expiryDate = 'Expiry date is required.';
  } else if (!isValidIsoDate(values.expiryDate)) {
    errors.expiryDate = 'Use the expiry date format YYYY-MM-DD.';
  }

  if (values.manufactureDate.trim() && !isValidIsoDate(values.manufactureDate)) {
    errors.manufactureDate = 'Use the manufacture date format YYYY-MM-DD.';
  }

  if (values.manufactureDate.trim() && values.expiryDate.trim()) {
    const manufactureDate = new Date(values.manufactureDate);
    const expiryDate = new Date(values.expiryDate);

    if (!Number.isNaN(manufactureDate.getTime()) && !Number.isNaN(expiryDate.getTime()) && manufactureDate > expiryDate) {
      errors.manufactureDate = 'Manufacture date must be before expiry date.';
    }
  }

  const purchasePrice = Number(values.purchasePrice);

  if (!values.purchasePrice.trim()) {
    errors.purchasePrice = 'Purchase price is required.';
  } else if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
    errors.purchasePrice = 'Purchase price must be greater than 0.';
  }

  if (values.sellingPrice.trim()) {
    const sellingPrice = Number(values.sellingPrice);

    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
      errors.sellingPrice = 'Selling price must be 0 or greater.';
    }
  }

  if (values.supplierId.trim() && values.supplierId.trim().length !== 24) {
    errors.supplierId = 'Supplier ID must be a valid record ID.';
  }

  if (values.reorderLevel.trim()) {
    const reorderLevel = Number(values.reorderLevel);

    if (!Number.isFinite(reorderLevel) || reorderLevel < 0) {
      errors.reorderLevel = 'Reorder level must be 0 or greater.';
    }
  }

  if (location.length > 80) {
    errors.location = 'Location must be 80 characters or fewer.';
  }

  if (notes.length > 500) {
    errors.notes = 'Notes must be 500 characters or fewer.';
  }

  return errors;
}

export function toAddStockPayload(values: AddStockFormValues): AddStockPayload {
  return {
    medicineId: values.medicineId.trim(),
    batchNumber: values.batchNumber.trim().toUpperCase(),
    quantity: Number(values.quantity),
    expiryDate: values.expiryDate.trim(),
    manufactureDate: values.manufactureDate.trim() || undefined,
    purchasePrice: Number(values.purchasePrice),
    sellingPrice: values.sellingPrice.trim() ? Number(values.sellingPrice) : undefined,
    location: values.location.trim() || undefined,
    supplierId: values.supplierId.trim() || undefined,
    reorderLevel: values.reorderLevel.trim() ? Number(values.reorderLevel) : undefined,
    notes: values.notes.trim() || undefined,
    mergeIfExists: values.mergeIfExists,
  };
}

export function validateAdjustStockForm(values: AdjustInventoryFormValues, batch?: InventoryBatch | null) {
  const errors: Partial<Record<keyof AdjustInventoryFormValues, string>> = {};
  const currentQuantity = Number(batch?.quantity ?? 0);

  if (!values.reason.trim()) {
    errors.reason = 'Enter a short reason for this stock change.';
  } else if (values.reason.trim().length < 3) {
    errors.reason = 'Reason must be at least 3 characters long.';
  }

  const usesNewQuantity = values.newQuantity.trim().length > 0;

  if (!usesNewQuantity && !values.quantityChange.trim()) {
    errors.quantityChange = 'Enter a quantity change or set a new quantity.';
  }

  if (values.quantityChange.trim()) {
    const quantityChange = Number(values.quantityChange);

    if (!Number.isFinite(quantityChange)) {
      errors.quantityChange = 'Quantity change must be a valid number.';
    } else if (values.action !== 'correction' && quantityChange <= 0) {
      errors.quantityChange = 'Quantity change must be greater than 0.';
    } else if (
      batch &&
      ['decrease', 'damage', 'dispose', 'transfer'].includes(values.action) &&
      quantityChange > currentQuantity
    ) {
      errors.quantityChange = 'Quantity change cannot be greater than the current quantity.';
    }
  }

  if (values.newQuantity.trim()) {
    const newQuantity = Number(values.newQuantity);

    if (!Number.isFinite(newQuantity) || newQuantity < 0) {
      errors.newQuantity = 'New quantity must be 0 or greater.';
    }

    if (
      batch &&
      !Number.isNaN(newQuantity) &&
      values.action === 'increase' &&
      newQuantity < batch.quantity
    ) {
      errors.newQuantity = 'Increase cannot set a quantity below the current level.';
    }

    if (
      batch &&
      !Number.isNaN(newQuantity) &&
      ['decrease', 'damage', 'dispose'].includes(values.action) &&
      newQuantity > batch.quantity
    ) {
      errors.newQuantity = 'This action cannot increase the current quantity.';
    }
  }

  if (values.action === 'transfer') {
    if (!values.toLocation.trim()) {
      errors.toLocation = 'Transfer location is required.';
    } else if (batch && values.toLocation.trim().toUpperCase() === String(batch.location || '').toUpperCase()) {
      errors.toLocation = 'Transfer location must be different from the current location.';
    } else if (values.toLocation.trim().length > 80) {
      errors.toLocation = 'Transfer location must be 80 characters or fewer.';
    }
  }

  return errors;
}

export function toAdjustInventoryPayload(
  inventoryId: string,
  values: AdjustInventoryFormValues
): AdjustInventoryPayload {
  return {
    inventoryId,
    action: values.action,
    quantityChange: values.quantityChange.trim() ? Number(values.quantityChange) : undefined,
    newQuantity: values.newQuantity.trim() ? Number(values.newQuantity) : undefined,
    reason: values.reason.trim(),
    toLocation: values.toLocation.trim() || undefined,
  };
}
