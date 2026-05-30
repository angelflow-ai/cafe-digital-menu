export function generateOrderId() {
  return `INF-${String(Date.now()).slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
}

export function preparePrintableOrder(order) {
  if (!order) return order;
  return {
    ...order,
    orderId: order.orderId || order.id || order._id || generateOrderId(),
    createdAt: order.createdAt || order.createdAtAt || order.date || new Date().toISOString(),
    items: Array.isArray(order.items) ? order.items : order.cart || []
  };
}

export function normalizeStatus(value) {
  return String(value || "").toLowerCase().trim().replace(/[_\s]+/g, " ");
}

export function normalizeOrder(order) {
  const amount = Number(order?.total ?? order?.totalAmount ?? order?.grandTotal ?? 0);
  return {
    ...order,
    createdAt: order?.createdAt || order?.orderDate || order?.createdAtAt || order?.date || order?.confirmedAt || order?.updatedAt || "",
    total: amount,
    totalAmount: amount,
    status: normalizeStatus(order?.status),
    paymentStatus: normalizeStatus(order?.paymentStatus)
  };
}

export function isValidSalesOrder(order) {
  const includedStatuses = ["confirmed", "completed", "paid", "delivered"];
  const excludedStatuses = ["new", "pending", "pending verification", "rejected", "payment rejected", "cancelled", "unpaid"];
  const statuses = [normalizeStatus(order?.status), normalizeStatus(order?.paymentStatus)].filter(Boolean);

  if (!statuses.length) return false;
  if (statuses.some((status) => excludedStatuses.includes(status))) return false;
  return statuses.some((status) => includedStatuses.includes(status));
}

export function isCompletedSale(order) {
  if (!order) return false;
  const status = normalizeStatus(order?.status);
  const paymentStatus = normalizeStatus(order?.paymentStatus);
  const paymentMethod = String(order?.paymentMethod || order?.method || "").toLowerCase();

  const rejected = ["cancelled", "rejected", "payment_issue", "payment rejected", "failed", "unpaid", "pending verification"];
  if (rejected.includes(status) || rejected.includes(paymentStatus)) return false;

  // Online completed payments
  const onlineIndicators = ["online", "upi", "qr", "intent", "static_qr"];
  const onlineCompleted = onlineIndicators.some((k) => paymentMethod.includes(k)) && ["confirmed", "verified", "paid", "completed"].includes(paymentStatus);

  // Cash / COC / counter completed payments or explicitly approved orders
  const cocIndicators = ["cash", "counter", "coc"];
  const cocCompleted = cocIndicators.some((k) => paymentMethod.includes(k)) || ["approved", "confirmed", "completed"].includes(status);

  return !!(onlineCompleted || cocCompleted);
}

export function getOrderDate(order) {
  const dateValue = order?.createdAt || order?.orderDate || order?.date;
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfDay(date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  day.setMilliseconds(0);
  return day;
}

export function endOfDay(date) {
  const day = new Date(date);
  day.setHours(23, 59, 59, 999);
  return day;
}

export function createOrderStatusUpdatePayload({ status, paymentStatus, timestampField, timestamp = new Date().toISOString() }) {
  const payload = {};

  if (status !== undefined) payload.status = status;
  if (paymentStatus !== undefined) payload.paymentStatus = paymentStatus;
  if (timestampField) payload[timestampField] = timestamp;

  return payload;
}