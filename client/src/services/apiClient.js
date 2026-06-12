import demoMode from "../demoMode";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const API = API_URL.replace(/\/$/, "") + "/api";
const API_ROOT = API_URL.replace(/\/$/, "");
const AUTH_TOKEN_STORAGE_KEY = "infusion-auth-token";

const inFlight = new Map();
const LOGIN_RETRY_DELAY_MS = 700;
const DEFAULT_RETRY_DELAY_MS = 200;

function isLoginRequest(path) {
  return path === "/auth/owner/login" || path === "/auth/biller/login";
}

function getNetworkErrorMessage(error) {
  if (error?.name === "AbortError") {
    return "The backend is taking too long to respond. Please wait a moment and try again.";
  }
  if (error?.message && /failed to fetch|network|load failed/i.test(error.message)) {
    return "The backend is not reachable right now. Please wait a moment and try again.";
  }
  return error?.message || "The login request failed.";
}

function devLog(...args) {
  if (import.meta.env.DEV) console.warn(...args);
}

function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
}

function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
      return;
    }
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch (error) {
    try {
      if (token) sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
      else sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch (_error) {}
  }
}

async function rawFetch(path, options = {}) {
  const url = `${API}${path}`;
  const method = (options.method || "GET").toUpperCase();
  const timeoutMs = options.timeout || (isLoginRequest(path) ? 8000 : 15000);
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  const token = getAuthToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  const opts = {
    ...options,
    credentials: "include",
    headers,
    signal: controller ? controller.signal : options.signal
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
    if (timeoutId) clearTimeout(timeoutId);
    const loginError = isLoginRequest(path) ? new Error(getNetworkErrorMessage(err)) : err;
    // network/backend down - do not enable demo mode automatically (even in dev)
    // Always require real backend connection for customer menu
    if (isLoginRequest(path)) throw loginError;
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
    // Do not fallback to demo data for customer app - show real error instead
    throw loginError;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.message || `Request failed: ${response.status}`;
    const e = new Error(message);
    e.status = response.status;
    throw e;
  }
  if (isLoginRequest(path) && body?.token) setAuthToken(body.token);
  if (path === "/auth/logout") setAuthToken("");
  return body;
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
    const maxAttempts = options.retry === false ? 1 : isLoginRequest(path) ? 4 : 3;
    const baseDelay = isLoginRequest(path) ? LOGIN_RETRY_DELAY_MS : DEFAULT_RETRY_DELAY_MS;
    while (attempts < maxAttempts) {
      attempts += 1;
      try {
        const res = await rawFetch(path, options);
        return res;
      } catch (err) {
        const status = err.status || 0;
        const isRetryableNetworkError = !status || status >= 500 || /failed to fetch|network|timed out|aborted/i.test(err.message || "");
        if (attempts >= maxAttempts || (!isRetryableNetworkError && status < 500)) throw err;
        await new Promise((resolve) => setTimeout(resolve, baseDelay * attempts));
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
