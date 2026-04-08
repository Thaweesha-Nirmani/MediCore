import type { CartItem, CheckoutFormValues, CreateSalePayload } from '@/features/sales/types';

export function roundMoney(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

export function getCartSubtotal(items: CartItem[]) {
  return roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
}

export function getCheckoutNumbers(values: CheckoutFormValues) {
  const discount = values.discount.trim() ? roundMoney(Number(values.discount)) : 0;
  const tax = values.tax.trim() ? roundMoney(Number(values.tax)) : 0;
  const serviceFee = values.serviceFee.trim() ? roundMoney(Number(values.serviceFee)) : 0;

  return {
    discount: Number.isFinite(discount) ? discount : 0,
    tax: Number.isFinite(tax) ? tax : 0,
    serviceFee: Number.isFinite(serviceFee) ? serviceFee : 0,
  };
}

export function getCheckoutTotal(items: CartItem[], values: CheckoutFormValues) {
  const subtotal = getCartSubtotal(items);
  const { discount, tax, serviceFee } = getCheckoutNumbers(values);
  return roundMoney(subtotal + tax + serviceFee - discount);
}

export function buildCreateSalePayload(
  items: CartItem[],
  values: CheckoutFormValues
): CreateSalePayload {
  const subtotal = getCartSubtotal(items);
  const { discount, tax, serviceFee } = getCheckoutNumbers(values);
  const total = roundMoney(subtotal + tax + serviceFee - discount);

  return {
    customerName: values.customerName.trim() || undefined,
    paymentMethod: values.paymentMethod,
    notes: values.notes.trim() || undefined,
    subtotal,
    discount,
    tax,
    serviceFee,
    total,
    items: items.map((item) => ({
      medicineId: item.medicineId,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: roundMoney(item.quantity * item.price),
    })),
  };
}

export function validateCheckout(values: CheckoutFormValues, items: CartItem[]) {
  const errors: Partial<Record<keyof CheckoutFormValues, string>> = {};
  const subtotal = getCartSubtotal(items);
  const notes = values.notes.trim();

  if (!items.length) {
    errors.customerName = 'Add at least one medicine to the cart before checkout.';
  }

  if (values.customerName.trim().length > 120) {
    errors.customerName = 'Customer name must be 120 characters or fewer.';
  }

  if (values.discount.trim()) {
    const discount = Number(values.discount);

    if (!Number.isFinite(discount) || discount < 0) {
      errors.discount = 'Discount must be 0 or greater.';
    } else if (discount > subtotal) {
      errors.discount = 'Discount cannot be more than the cart subtotal.';
    }
  }

  if (values.tax.trim()) {
    const tax = Number(values.tax);

    if (!Number.isFinite(tax) || tax < 0) {
      errors.tax = 'Tax must be 0 or greater.';
    }
  }

  if (values.serviceFee.trim()) {
    const serviceFee = Number(values.serviceFee);

    if (!Number.isFinite(serviceFee) || serviceFee < 0) {
      errors.serviceFee = 'Service fee must be 0 or greater.';
    }
  }

  if (notes.length > 250) {
    errors.notes = 'Notes must be 250 characters or fewer.';
  }

  return errors;
}
