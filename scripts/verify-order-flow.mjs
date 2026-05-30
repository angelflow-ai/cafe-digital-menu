const API_URL = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
const API = `${API_URL}/api`;
const BILLER_EMAIL = process.env.BILLER_EMAIL || "biller@theinfusionsaga.com";
const BILLER_PASSWORD = process.env.BILLER_PASSWORD || "infusion-biller";

function fail(message) {
  throw new Error(message);
}

async function request(path, options = {}, cookie = "") {
  const headers = {
    "Content-Type": "application/json",
    ...(cookie ? { Cookie: cookie } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    ...options,
    headers
  });

  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const message = body.message || body.raw || `Request failed with ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return { response, body };
}

function toCookieHeader(setCookie) {
  if (!setCookie) return "";
  return setCookie.split(";")[0];
}

async function loginBiller() {
  const { response } = await request("/auth/biller/login", {
    method: "POST",
    body: JSON.stringify({ email: BILLER_EMAIL, password: BILLER_PASSWORD })
  });

  const cookie = toCookieHeader(response.headers.get("set-cookie"));
  if (!cookie) fail("Biller login did not return a session cookie.");
  return cookie;
}

async function createOrder(label) {
  const { body } = await request("/orders", {
    method: "POST",
    body: JSON.stringify({
      customerName: label,
      phone: "9999999999",
      tableNumber: "1",
      paymentMethod: "UPI_INTENT_OR_STATIC_QR",
      paymentStatus: "pending_verification",
      status: "pending",
      items: [{ itemId: "black-tea", sizeId: "one", quantity: 1, serveType: "" }],
      notes: "verification"
    })
  });

  if (!body.orderId) fail(`Order creation for ${label} did not return orderId.`);
  if (!body.id && !body._id) fail(`Order creation for ${label} did not return an internal id.`);
  return body;
}

async function patchOrder(orderId, payload, cookie) {
  const { body } = await request(`/orders/${orderId}`, {
    method: "PATCH",
    headers: cookie ? { Cookie: cookie } : {},
    body: JSON.stringify(payload)
  }, cookie);
  return body;
}

async function fetchPublicOrder(orderId) {
  const { body } = await request(`/orders/public/${orderId}`);
  return body;
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function isConfirmedState(order) {
  return ["confirmed", "preparing", "accepted"].includes(String(order.status || "").toLowerCase());
}

function isVerifiedPaymentState(order) {
  return ["confirmed", "paid", "verified"].includes(String(order.paymentStatus || "").toLowerCase());
}

async function verifyConfirmPath(billerCookie) {
  const order = await createOrder("Integration Confirm Test");
  const staffOrderId = order._id || order.id || order.orderId;
  await patchOrder(staffOrderId, {
    status: "confirmed",
    paymentStatus: "confirmed",
    confirmedAt: new Date().toISOString()
  }, billerCookie);

  const confirmed = await fetchPublicOrder(order.orderId);
  assert(isConfirmedState(confirmed), `Expected confirmed/preparing/accepted status, got ${confirmed.status}`);
  assert(isVerifiedPaymentState(confirmed), `Expected confirmed/paid/verified payment status, got ${confirmed.paymentStatus}`);
  assert(Boolean(confirmed.confirmedAt), "Expected confirmedAt to be populated.");
  assert(confirmed.status !== "payment_issue", "Order must not remain in payment_issue.");
  assert(confirmed.paymentStatus !== "pending_verification", "Order must not remain in pending_verification.");

  return { orderId: order.orderId, status: confirmed.status, paymentStatus: confirmed.paymentStatus };
}

async function verifyRejectPath(billerCookie) {
  const order = await createOrder("Integration Reject Test");
  const staffOrderId = order._id || order.id || order.orderId;
  await patchOrder(staffOrderId, {
    status: "payment_issue",
    paymentStatus: "payment_issue",
    rejectedAt: new Date().toISOString()
  }, billerCookie);

  const rejected = await fetchPublicOrder(order.orderId);
  assert(String(rejected.status || "").toLowerCase() === "payment_issue", `Expected payment_issue status, got ${rejected.status}`);
  assert(String(rejected.paymentStatus || "").toLowerCase() === "payment_issue", `Expected payment_issue paymentStatus, got ${rejected.paymentStatus}`);
  assert(Boolean(rejected.rejectedAt), "Expected rejectedAt to be populated.");

  return { orderId: order.orderId, status: rejected.status, paymentStatus: rejected.paymentStatus };
}

async function main() {
  const billerCookie = await loginBiller();
  const confirmResult = await verifyConfirmPath(billerCookie);
  const rejectResult = await verifyRejectPath(billerCookie);

  console.log(JSON.stringify({
    ok: true,
    api: API,
    confirm: confirmResult,
    reject: rejectResult
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, message: error.message, status: error.status || null }, null, 2));
  process.exit(1);
});