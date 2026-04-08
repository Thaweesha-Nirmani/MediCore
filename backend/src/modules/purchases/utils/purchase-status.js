const AppError = require('../../../core/app-error');

function deriveItemStatus(item) {
  if (item.receivedQuantity <= 0) {
    return 'pending';
  }

  if (item.receivedQuantity >= item.orderedQuantity) {
    return 'received';
  }

  return 'partially_received';
}

function deriveReceiveStatus(items) {
  const totalOrdered = items.reduce((sum, item) => sum + item.orderedQuantity, 0);
  const totalReceived = items.reduce((sum, item) => sum + item.receivedQuantity, 0);

  if (totalReceived <= 0) {
    return 'not_received';
  }

  if (totalReceived >= totalOrdered) {
    return 'fully_received';
  }

  return 'partially_received';
}

function deriveOrderStatus(currentStatus, receiveStatus) {
  if (currentStatus === 'cancelled') {
    return 'cancelled';
  }

  if (receiveStatus === 'fully_received') {
    return 'received';
  }

  if (receiveStatus === 'partially_received') {
    return 'partially_received';
  }

  return currentStatus === 'draft' ? 'draft' : 'placed';
}

function assertManualStatusTransition(currentStatus, nextStatus, { hasReceipts = false } = {}) {
  if (!nextStatus || nextStatus === currentStatus) {
    return;
  }

  if (hasReceipts && nextStatus === 'cancelled') {
    throw new AppError('A purchase with received items cannot be cancelled', 422);
  }

  const allowed = {
    draft: ['placed', 'cancelled'],
    placed: ['draft', 'cancelled'],
    partially_received: [],
    received: [],
    cancelled: [],
  };

  if (!allowed[currentStatus]?.includes(nextStatus)) {
    throw new AppError(`Invalid purchase status transition from ${currentStatus} to ${nextStatus}`, 422);
  }
}

module.exports = {
  deriveItemStatus,
  deriveReceiveStatus,
  deriveOrderStatus,
  assertManualStatusTransition,
};
