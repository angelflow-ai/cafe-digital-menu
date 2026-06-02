import demoMode from "../demoMode";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API = API_URL.replace(/\/$/, "") + "/api";
const API_ROOT = API_URL.replace(/\/$/, "");

const inFlight = new Map();

function devLog(...args) {
  if (import.meta.env.DEV) console.warn(...args);
}

async function rawFetch(path, options = {}) {
  const url = `${API}${path}`;
  const method = (options.method || "GET").toUpperCase();
  const opts = {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  };
  // If body is FormData let browser set Content-Type (don't force json)
  try {
    if (opts.body && typeof FormData !== "undefined" && opts.body instanceof FormData) {
      delete opts.headers["Content-Type"];
    }
  } catch (e) {}
  let response;
  try {
    response = await fetch(url, opts);
  } catch (err) {
    // network/backend down - fallback to demoMode where appropriate
    if (!demoMode.isDemoModeEnabled()) {
      devLog("Backend unavailable, enabling demo mode");
      demoMode.setDemoMode(true);
    }
    if (path.startsWith("/categories")) {
      const [pathOnly, queryString = ""] = path.split("?");
      const query = new URLSearchParams(queryString);
      const includeDeleted = query.get("includeDeleted") === "true";
      const match = pathOnly.match(/^\/categories\/([^/]+)(?:\/restore)?$/);
      if (method === "GET" && pathOnly === "/categories") {
        return includeDeleted ? demoMode.getDemoCategoriesWithDeleted() : demoMode.getDemoCategories();
      }
      if (method === "POST" && pathOnly === "/categories") {
        const body = JSON.parse(opts.body || "{}");
        return demoMode.createDemoCategory(body);
      }
      if (method === "PATCH" && match && pathOnly.endsWith("/restore")) {
        const categoryId = decodeURIComponent(match[1]);
        const restored = demoMode.restoreDemoCategory(categoryId);
        if (!restored) throw new Error("Category not found");
        return restored;
      }
      if (method === "DELETE" && match) {
        const categoryId = decodeURIComponent(match[1]);
        if (query.get("permanent") === "true") {
          return demoMode.permanentlyDeleteDemoCategory(categoryId);
        }
        const deleted = demoMode.deleteDemoCategory(categoryId);
        if (!deleted) throw new Error("Category not found");
        return deleted;
      }
    }
    // mimic legacy demo fallbacks used by App.jsx
    if (path === "/categories") return demoMode.getDemoCategories();
    if (path === "/menu" || path === "/menu?includeInactive=true") return demoMode.getDemoInventory();
    if (path === "/inventory") return demoMode.getDemoInventory();
    if (path === "/auth/me") return { user: { email: `demo-customer@demo.local`, role: "customer" } };
    if (path === "/auth/logout") return { success: true };
    if (path === "/orders") {
      if (opts.method === "POST") {
        const body = JSON.parse(opts.body || "{}");
        const order = demoMode.createDemoOrder(body, body.items || []);
        demoMode.addDemoOrder(order);
        return order;
      }
      return demoMode.loadDemoOrders();
    }
    if (path.includes("/orders/public/")) {
      const orderId = path.split("/").pop();
      const orders = demoMode.loadDemoOrders();
      const order = orders.find(o => o.orderId === orderId || o.id === orderId || o._id === orderId);
      if (order) return order;
      throw new Error("Order not found");
    }
    if (path.includes("/orders/stream")) throw new Error("EventSource not available in demo mode");
    throw err;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.message || `Request failed: ${response.status}`;
    const e = new Error(message);
    e.status = response.status;
    throw e;
  }
  return response.json().catch(() => ({}));
}

function requestKey(method, path, body) {
  if (!body) return `${method}:${path}`;
  try { return `${method}:${path}:${JSON.stringify(body)}`; } catch (e) { return `${method}:${path}`; }
}

export async function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  let body = null;
  if (typeof options.body === "string") {
    try {
      body = JSON.parse(options.body);
    } catch (_err) {
      body = options.body;
    }
  } else if (options.body) {
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    body = isFormData ? null : options.body;
  }
  const key = requestKey(method, path, body && body.orderId ? { orderId: body.orderId } : body);

  // prevent duplicate POST/PUT submission for identical payloads
  if ((method === "POST" || method === "PUT") && inFlight.has(key)) {
    devLog("Duplicate request prevented:", key);
    return inFlight.get(key);
  }

  const promise = (async () => {
    let attempts = 0;
    const maxAttempts = options.retry === false ? 1 : 3;
    while (attempts < maxAttempts) {
      attempts += 1;
      try {
        const res = await rawFetch(path, options);
        return res;
      } catch (err) {
        // retry on network or 5xx
        const status = err.status || 0;
        if (attempts >= maxAttempts || (status && status < 500)) throw err;
        await new Promise(r => setTimeout(r, 200 * attempts));
      }
    }
  })();

  if (method === "POST" || method === "PUT") inFlight.set(key, promise);
  try {
    const value = await promise;
    return value;
  } finally {
    if (inFlight.has(key)) inFlight.delete(key);
  }
}

export { API, API_ROOT };

export default { api, API, API_ROOT };
