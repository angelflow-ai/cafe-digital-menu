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

function toTitleCase(value) {
  return String(value || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function getOrderStatusLabel(order) {
  const status = normalizeStatus(order?.status);
  const paymentStatus = normalizeStatus(order?.paymentStatus);
  const completedStatuses = new Set(["completed"]);
  const confirmedStatuses = new Set(["confirmed", "accepted", "paid", "verified"]);
  const pendingStatuses = new Set(["new", "pending", "waiting", "pending verification", "pending_verification"]);
  const rejectedStatuses = new Set(["cancelled", "rejected", "payment issue", "payment rejected", "payment_rejected", "unpaid", "failed"]);
  const activeStatuses = new Set(["pending", "confirmed", "preparing", "ready"]);

  const resolveStatus = (candidate) => {
    if (!candidate) return undefined;
    if (completedStatuses.has(candidate)) return "Completed";
    if (rejectedStatuses.has(candidate)) return toTitleCase(candidate);
    if (pendingStatuses.has(candidate)) return "Pending";
    if (activeStatuses.has(candidate)) return toTitleCase(candidate);
    if (confirmedStatuses.has(candidate)) return "Confirmed";
    return toTitleCase(candidate);
  };

  const labelFromStatus = resolveStatus(status);
  if (labelFromStatus) return labelFromStatus;

  const labelFromPaymentStatus = resolveStatus(paymentStatus);
  if (labelFromPaymentStatus) return labelFromPaymentStatus;

  return "Unknown";
}

export function getOrderSourceLabel(order) {
  if (!order || typeof order !== "object") return undefined;

  const explicitType = String(order.orderType || order.type || "").trim().toLowerCase();
  const paymentMethod = String(order.paymentMethod || order.method || "").toLowerCase();
  const id = String(order.orderId || order.id || order._id || "").toLowerCase();
  const note = String(order.notes || order.note || "").toLowerCase();

  if (explicitType) {
    if (explicitType.includes("coc") || explicitType.includes("counter") || explicitType.includes("order on counter")) return "COC";
    if (explicitType.includes("qr") || explicitType.includes("online")) return "QR";
  }

  if (id.startsWith("coc-")) return "COC";
  if (paymentMethod.includes("coc") || paymentMethod.includes("counter") || note.includes("coc") || note.includes("order on counter") || note.includes("cash on counter")) return "COC";
  if (paymentMethod.includes("upi") || paymentMethod.includes("qr") || paymentMethod.includes("online") || note.includes("qr") || note.includes("table")) return "QR";

  return undefined;
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