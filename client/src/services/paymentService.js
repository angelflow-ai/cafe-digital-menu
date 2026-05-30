import orderService from "./orderService";

export async function confirmPayment(orderId, details = {}) {
  // Staff-facing confirm: set paymentStatus to confirmed
  return orderService.patchOrder(orderId, { paymentStatus: "confirmed", status: "confirmed", ...(details || {}) });
}

export async function rejectPayment(orderId, details = {}) {
  // Staff-facing reject: set paymentStatus to rejected
  return orderService.patchOrder(orderId, { paymentStatus: "rejected", status: "payment issue", ...(details || {}) });
}

export default { confirmPayment, rejectPayment };
