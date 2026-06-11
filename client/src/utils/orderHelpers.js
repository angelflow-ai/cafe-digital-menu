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
  const source = String(order.source || order.createdFrom || order._source || order.orderSource || "").trim().toLowerCase();
  const id = String(order.orderId || order.id || order._id || "").toLowerCase();
  const note = String(order.notes || order.note || "").toLowerCase();
  const isCocOrder = Boolean(order.isCOC || order.isCoc || order.coc || order.cashOnCounter || order.createdFrom === "coc");

  const signals = [explicitType, source, paymentMethod, note, String(order.orderType || ""), String(order.type || ""), String(order.source || ""), String(order.createdFrom || ""), String(order._source || ""), String(order.orderSource || "")];
  const hasOocSignal = signals.some((value) => /\booc\b|order on counter|counter order/.test(value));
  const hasExplicitOoc = explicitType === "ooc" || source === "ooc" || source === "order on counter" || /\booc\b/.test(explicitType) || /\booc\b/.test(source);
  const hasCocSignal = signals.some((value) => /\bcoc\b|cash on counter|cash counter|counter cash/.test(value) || (value === "cash" && !hasExplicitOoc));
  const hasQrSignal = signals.some((value) => /qr|upi|online/.test(value));

  if (hasOocSignal || hasExplicitOoc) return "OOC";
  if (isCocOrder || hasCocSignal) return "COC";
  if (hasQrSignal) return "QR";

  if (id.startsWith("coc-")) return "COC";

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

  const rejected = ["cancelled", "rejected", "payment issue", "payment rejected", "failed", "unpaid", "pending verification"];
  if (rejected.includes(status) || rejected.includes(paymentStatus)) return false;

  return status === "completed";
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

export function getBillerOrderClassification(order) {
  const status = normalizeStatus(order?.status);
  const paymentStatus = normalizeStatus(order?.paymentStatus);
  const paymentMethod = String(order?.paymentMethod || order?.method || "").toLowerCase();
  const isOnlinePayment = /(upi|qr|online|UPI_INTENT_OR_STATIC_QR)/i.test(paymentMethod);
  const isCashPayment = /cash|coc|counter/i.test(paymentMethod);
  
  // Determine source badge
  const sourceBadge = getOrderSourceLabel(order) || (isOnlinePayment ? "QR" : isCashPayment ? "COC" : "QR");

  const liveStatuses = new Set(["pending", "confirmed", "preparing", "ready"]);
  const finalStatuses = new Set(["completed", "cancelled"]);
  const rejectedPaymentStatuses = new Set(["rejected", "payment rejected", "payment issue"]);
  const hasRejectedPayment = rejectedPaymentStatuses.has(status) || rejectedPaymentStatuses.has(paymentStatus);

  // PAY ONLINE FLOW: Show in Pending Verification only when:
  // - paymentStatus = "pending verification" (NOT paid/confirmed yet)
  // - paymentMethod is online (UPI, QR, UPI_INTENT_OR_STATIC_QR)
  // - status = "pending" (NOT confirmed yet)
  const isPendingVerification = isOnlinePayment && !finalStatuses.has(status) && !finalStatuses.has(paymentStatus)
    && ((paymentStatus === "pending verification" && status === "pending") || hasRejectedPayment);

  // COC FLOW: Show in COC Requests only when:
  // - sourceBadge = "COC" or "OOC"
  // - pendingApproval = true OR (status = "pending" AND paymentStatus in ["pending", "unpaid", "cash_pending"])
  // - NOT confirmed/completed/paid/excluded
  const isCocRequest = (sourceBadge === "COC" || sourceBadge === "OOC")
    && !finalStatuses.has(status)
    && !finalStatuses.has(paymentStatus)
    && (hasRejectedPayment || Boolean(order?.pendingApproval) || (status === "pending" && ["pending", "unpaid", "cash_pending"].includes(paymentStatus)));

  // LIVE ORDERS: Show in Live Orders only when:
  // - status in [pending, confirmed, preparing, ready]
  // - NOT excluded (completed, cancelled, rejected, payment_issue, etc.)
  // - NOT pending verification (those stay in Pending Verification tab)
  // - NOT a COC request waiting for approval
  const isLiveOrder = liveStatuses.has(status) 
    && !finalStatuses.has(status) 
    && !finalStatuses.has(paymentStatus)
    && !hasRejectedPayment
    && paymentStatus !== "pending verification"
    && !isCocRequest;

  return { isLiveOrder, isCocRequest, isPendingVerification, sourceBadge };
}

export function createOrderStatusUpdatePayload({ status, paymentStatus, timestampField, timestamp = new Date().toISOString() }) {
  const payload = {};

  if (status !== undefined) payload.status = status;
  if (paymentStatus !== undefined) payload.paymentStatus = paymentStatus;
  if (timestampField) payload[timestampField] = timestamp;

  return payload;
}
