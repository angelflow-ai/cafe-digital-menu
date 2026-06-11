export function isMongoObjectId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value.trim());
}

function normalizeCocFilterValue(value) {
  return String(value || "").toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

export function isCocApprovalCandidate(order) {
  if (!order || typeof order !== "object") return false;

  const orderType = normalizeCocFilterValue(order.orderType || order.type || order.order_source || order.source || "");
  const source = normalizeCocFilterValue(order.source || order.createdFrom || order._source || "");
  const paymentMethod = normalizeCocFilterValue(order.paymentMethod || order.paymentMode || order.mode || order.method || "");
  const notes = normalizeCocFilterValue(order.notes || order.note || "");
  const status = normalizeCocFilterValue(order.status || "");
  const paymentStatus = normalizeCocFilterValue(order.paymentStatus || "");
  const requestStatus = normalizeCocFilterValue(order.requestStatus || "");

  const isOocOrder = /\booc\b|order on counter/.test(`${orderType} ${source} ${notes}`);
  const isCashOnCounter = /\bcash\b|\bcoc\b|cash on counter|cash counter|counter cash/.test(`${paymentMethod} ${notes}`);
  const isPendingStatus = ["new", "pending", "pending verification", "pending_verification"].includes(status)
    || ["new", "pending", "pending verification", "pending_verification"].includes(paymentStatus)
    || ["new", "pending", "pending verification", "pending_verification"].includes(requestStatus);
  const isApprovedOrFinalized = ["confirmed", "preparing", "ready", "completed", "approved"].includes(status)
    || ["confirmed", "preparing", "ready", "completed", "approved"].includes(paymentStatus)
    || ["confirmed", "preparing", "ready", "completed", "approved"].includes(requestStatus)
    || Boolean(order?.approvedAt)
    || order?.pendingApproval === false
    || normalizeCocFilterValue(order?.requestStatus || "") === "approved";

  return isCashOnCounter && (isOocOrder || /\bcoc\b|cash on counter/.test(`${paymentMethod} ${notes}`)) && isPendingStatus && !isApprovedOrFinalized;
}

export function resolveCocRequestId(request) {
  if (!request || typeof request !== "object") return "";

  const candidates = [request.requestId, request.orderId, request.id];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  if (isMongoObjectId(request._id)) return String(request._id).trim();
  return "";
}

export function mergeCocRequestEntries(orders, cocRequests) {
  const incoming = Array.isArray(cocRequests) ? cocRequests : [];
  const derived = Array.isArray(orders) ? orders.filter(isCocApprovalCandidate) : [];
  const seen = new Map();

  incoming.forEach((request) => {
    const key = resolveCocRequestId(request);
    if (!key) return;

    seen.set(String(key), {
      ...request,
      id: key,
      requestId: request?.requestId || key,
      orderId: request?.orderId || key,
      _id: isMongoObjectId(request?._id) ? request._id : undefined,
      _source: request?._source || "coc-request"
    });
  });

  derived.forEach((order) => {
    const key = resolveCocRequestId(order);
    if (!key) return;

    seen.set(String(key), {
      ...order,
      id: key,
      requestId: order?.requestId || key,
      orderId: order?.orderId || key,
      _id: isMongoObjectId(order?._id) ? order._id : undefined,
      _source: order?._source || order?.source || order?.createdFrom || "coc-request",
      pendingApproval: true
    });
  });

  return Array.from(seen.values()).sort((left, right) => {
    const leftTime = new Date(left?.createdAt || left?.updatedAt || 0).getTime();
    const rightTime = new Date(right?.createdAt || right?.updatedAt || 0).getTime();
    return rightTime - leftTime;
  });
}
