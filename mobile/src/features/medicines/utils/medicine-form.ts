import type { MedicineDetail, MedicineFormPayload, MedicineFormValues } from '@/features/medicines/types';

function hasInventorySeed(values: MedicineFormValues) {
  return Boolean(
    values.stockQty.trim() ||
      values.batchNumber.trim() ||
      values.manufactureDate.trim() ||
      values.expiryDate.trim()
  );
}

export function createEmptyMedicineFormValues(): MedicineFormValues {
  return {
    medicineId: '',
    genericName: '',
    brandName: '',
    category: 'General',
    supplier: '',
    manufacturer: '',
    barcode: '',
    unitPrice: '',
    restockThreshold: '',
    leadTimeDays: '',
    stockQty: '0',
    batchNumber: '',
    manufactureDate: '',
    expiryDate: '',
    description: '',
  };
}

export function mapMedicineToFormValues(medicine: MedicineDetail): MedicineFormValues {
  return {
    medicineId: medicine.medicineId || '',
    genericName: medicine.genericName || '',
    brandName: medicine.brandName || '',
    category: medicine.category || 'General',
    supplier: medicine.supplier || '',
    manufacturer: medicine.manufacturer || '',
    barcode: medicine.barcode || '',
    unitPrice:
      typeof medicine.unitPrice === 'number' && Number.isFinite(medicine.unitPrice)
        ? String(medicine.unitPrice)
        : '',
    restockThreshold:
      typeof medicine.restockThreshold === 'number' && Number.isFinite(medicine.restockThreshold)
        ? String(medicine.restockThreshold)
        : '',
    leadTimeDays:
      typeof medicine.leadTimeDays === 'number' && Number.isFinite(medicine.leadTimeDays)
        ? String(medicine.leadTimeDays)
        : '',
    stockQty:
      typeof medicine.stockQty === 'number'
        ? String(medicine.stockQty)
        : typeof medicine.quantity === 'number'
          ? String(medicine.quantity)
          : '',
    batchNumber: medicine.batchNumber || medicine.inventorySnapshot?.batchNumber || '',
    manufactureDate: medicine.manufactureDate ? toDateInputValue(medicine.manufactureDate) : '',
    expiryDate: medicine.expiryDate ? toDateInputValue(medicine.expiryDate) : '',
    description: medicine.description || '',
  };
}

export function validateMedicineForm(
  values: MedicineFormValues,
  options: { isEdit?: boolean } = {}
) {
  const errors: Partial<Record<keyof MedicineFormValues, string>> = {};
  const genericName = values.genericName.trim();
  const brandName = values.brandName.trim();
  const supplier = values.supplier.trim();
  const category = values.category.trim();
  const manufacturer = values.manufacturer.trim();
  const description = values.description.trim();
  const barcode = values.barcode.trim();
  const restockThreshold = Number(values.restockThreshold);
  const leadTimeDays = Number(values.leadTimeDays);
  const inventoryRequired = !options.isEdit || hasInventorySeed(values);

  if (!genericName && !brandName) {
    errors.genericName = 'Enter a generic or brand name so staff can identify the medicine.';
    errors.brandName = 'Enter a generic or brand name so staff can identify the medicine.';
  }

  if (!category) {
    errors.category = 'Category is required.';
  } else if (category.length > 100) {
    errors.category = 'Category must be 100 characters or fewer.';
  }

  if (!supplier) {
    errors.supplier = 'Supplier is required.';
  } else if (supplier.length > 120) {
    errors.supplier = 'Supplier must be 120 characters or fewer.';
  }

  if (manufacturer.length > 120) {
    errors.manufacturer = 'Manufacturer must be 120 characters or fewer.';
  }

  if (barcode.length > 64) {
    errors.barcode = 'Barcode must be 64 characters or fewer.';
  }

  const price = Number(values.unitPrice);

  if (!values.unitPrice.trim()) {
    errors.unitPrice = 'Enter the medicine price in LKR.';
  } else if (!Number.isFinite(price) || price <= 0) {
    errors.unitPrice = 'Unit price must be greater than 0.';
  }

  const stockQty = Number(values.stockQty);

  if (values.restockThreshold.trim()) {
    if (!Number.isFinite(restockThreshold) || restockThreshold < 0) {
      errors.restockThreshold = 'Restock threshold must be 0 or greater.';
    }
  }

  if (values.leadTimeDays.trim()) {
    if (!Number.isFinite(leadTimeDays) || leadTimeDays < 0 || !Number.isInteger(leadTimeDays)) {
      errors.leadTimeDays = 'Lead time must be a whole number of days.';
    }
  }

  if (inventoryRequired && !values.stockQty.trim()) {
    errors.stockQty = 'Starting stock quantity is required.';
  } else if (values.stockQty.trim() && (!Number.isFinite(stockQty) || stockQty < 0)) {
    errors.stockQty = 'Stock quantity must be 0 or greater.';
  }

  if (inventoryRequired && !values.batchNumber.trim()) {
    errors.batchNumber = 'Batch number is required.';
  } else if (values.batchNumber.trim().length > 80) {
    errors.batchNumber = 'Batch number must be 80 characters or fewer.';
  }

  if (inventoryRequired && !values.manufactureDate.trim()) {
    errors.manufactureDate = 'Manufacture date is required.';
  } else if (values.manufactureDate.trim() && !isValidDateInput(values.manufactureDate)) {
    errors.manufactureDate = 'Use YYYY-MM-DD or MM/DD/YYYY for manufacture date.';
  }

  if (inventoryRequired && !values.expiryDate.trim()) {
    errors.expiryDate = 'Expiry date is required.';
  } else if (values.expiryDate.trim() && !isValidDateInput(values.expiryDate)) {
    errors.expiryDate = 'Use YYYY-MM-DD or MM/DD/YYYY for expiry date.';
  }

  if (
    values.manufactureDate.trim() &&
    values.expiryDate.trim() &&
    isValidDateInput(values.manufactureDate) &&
    isValidDateInput(values.expiryDate)
  ) {
    const manufactureDate = new Date(values.manufactureDate);
    const expiryDate = new Date(values.expiryDate);

    if (manufactureDate > expiryDate) {
      errors.manufactureDate = 'Manufacture date must be before expiry date.';
      errors.expiryDate = 'Expiry date must be after manufacture date.';
    }
  }

  if (genericName.length > 160) {
    errors.genericName = 'Generic name must be 160 characters or fewer.';
  }

  if (brandName.length > 160) {
    errors.brandName = 'Brand name must be 160 characters or fewer.';
  }

  if (description.length > 500) {
    errors.description = 'Description must be 500 characters or fewer.';
  }

  return errors;
}

export function toMedicinePayload(values: MedicineFormValues): MedicineFormPayload {
  const payload: MedicineFormPayload = {
    genericName: values.genericName.trim(),
    generic_name: values.genericName.trim(),
    brandName: values.brandName.trim(),
    brand_name: values.brandName.trim(),
    category: values.category.trim() || 'General',
    supplier: values.supplier.trim(),
    manufacturer: values.manufacturer.trim(),
    barcode: values.barcode.trim().toUpperCase(),
    unitPrice: Number(values.unitPrice),
    unit_price_LKR: Number(values.unitPrice),
    description: values.description.trim(),
  };

  if (values.medicineId.trim()) {
    payload.medicineId = values.medicineId.trim().toUpperCase();
  }

  if (values.stockQty.trim()) {
    payload.stockQty = Number(values.stockQty);
    payload.stock_qty = Number(values.stockQty);
  }

  if (values.restockThreshold.trim()) {
    payload.restockThreshold = Number(values.restockThreshold);
    payload.restock_threshold = Number(values.restockThreshold);
    payload.threshold = Number(values.restockThreshold);
  }

  if (values.leadTimeDays.trim()) {
    payload.leadTimeDays = Number(values.leadTimeDays);
    payload.lead_time_days = Number(values.leadTimeDays);
  }

  if (values.batchNumber.trim()) {
    payload.batchNumber = values.batchNumber.trim().toUpperCase();
    payload.batch_number = values.batchNumber.trim().toUpperCase();
    payload.batch_id = values.batchNumber.trim().toUpperCase();
  }

  if (values.manufactureDate.trim()) {
    payload.manufactureDate = values.manufactureDate.trim();
    payload.manufacture_date = values.manufactureDate.trim();
  }

  if (values.expiryDate.trim()) {
    payload.expiryDate = values.expiryDate.trim();
    payload.expiry_date = values.expiryDate.trim();
  }

  return payload;
}

function isValidDateInput(value: string) {
  return Boolean(parseDateInput(value));
}

function parseDateInput(value: string) {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!usMatch) {
    return null;
  }

  const [, month, day, year] = usMatch;
  const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateInputValue(value: string | Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}
