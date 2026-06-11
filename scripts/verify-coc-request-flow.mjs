const API_URL = (process.env.API_URL || "http://localhost:4100").replace(/\/$/, "");
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

async function main() {
  const cookie = await loginBiller();

  const created = await request("/coc-requests", {
    method: "POST",
    body: JSON.stringify({
      customerName: "COC Flow Check",
      phone: "9999999999",
      tableNumber: "9",
      paymentMethod: "cash",
      paymentStatus: "pending",
      status: "pending",
      orderType: "COC",
      source: "coc",
      items: [{ itemId: "black-tea", sizeId: "one", quantity: 1, serveType: "" }],
      total: 40,
      notes: "coc approval flow test"
    })
  });

  const requestId = created.body.id || created.body.requestId;
  if (!requestId) fail("Expected COC request id from create response.");

  const list = await request("/coc-requests", {}, cookie);
  const found = Array.isArray(list.body) ? list.body.find((entry) => entry.id === requestId || entry.requestId === requestId) : null;
  if (!found) fail("Created COC request was not returned by the admin list.");

  const approved = await request(`/coc-requests/${requestId}`, { method: "PATCH" }, cookie);
  if (!approved.body || approved.body.status !== "confirmed") fail("Approve endpoint did not return a confirmed order.");

  const orders = await request("/orders", {}, cookie);
  const orderMatch = Array.isArray(orders.body)
    ? orders.body.find((entry) => entry.orderId === approved.body.orderId || entry.id === approved.body.id || entry._id === approved.body._id)
    : null;

  if (!orderMatch) fail("Approve endpoint did not create a visible order in Live Orders.");

  console.log(JSON.stringify({
    ok: true,
    requestId,
    approvedOrderId: approved.body.orderId,
    orderStatus: approved.body.status,
    paymentStatus: approved.body.paymentStatus,
    liveOrderFound: Boolean(orderMatch)
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, message: error.message, status: error.status || null }, null, 2));
  process.exit(1);
});
