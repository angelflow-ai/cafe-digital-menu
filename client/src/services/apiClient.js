import demoMode from "../demoMode";

function isLocalAppHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function resolveApiRoot() {
  const configuredUrl = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
  const cleanConfiguredUrl = configuredUrl.replace(/(?:\/api)+$/i, "");

  if (typeof window === "undefined") {
    return cleanConfiguredUrl || "http://localhost:4000";
  }

  const isLocalApp = isLocalAppHost(window.location.hostname);
  const configuredIsLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(cleanConfiguredUrl);

  if (cleanConfiguredUrl && (import.meta.env.DEV || isLocalApp || !configuredIsLocal)) {
    return cleanConfiguredUrl;
  }

  if (isLocalApp) {
    return "http://localhost:4000";
  }

  return window.location.origin;
}

const API_ROOT = resolveApiRoot();
const API = `${API_ROOT}/api`;
const AUTH_TOKEN_STORAGE_KEY = "infusion-auth-token";
const SELECTED_OUTLET_STORAGE_KEY = "infusion-selected-outlet";
const OWNER_SELECTED_OUTLET_FILTER_KEY = "ownerSelectedOutletFilter";

const inFlight = new Map();
const LOGIN_RETRY_DELAY_MS = 700;
const DEFAULT_RETRY_DELAY_MS = 200;
const LOGIN_MAX_ATTEMPTS = 2;

async function waitForBackendReady() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 1500) : null;
    try {
      const response = await fetch(`${API}/health`, {
        method: "GET",
        credentials: "include",
        signal: controller ? controller.signal : undefined
      });
      if (response.ok) return true;
    } catch (_error) {
      // The API may still be starting; continue until the bounded deadline.
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function pathWithoutQuery(path) {
  return String(path || "").split("?")[0];
}

function isLoginRequest(path) {
  const cleanPath = pathWithoutQuery(path);
  return cleanPath === "/auth/owner/login" || cleanPath === "/auth/biller/login";
}

function readSelectedOutletContext() {
  // Derive active outlet from the URL path only. Do not use sessionStorage/localStorage
  // as the source of truth for active outlet selection.
  try {
    if (typeof window === "undefined") return { outletId: "", outletSlug: "" };
    const url = new URL(window.location.href);
    const segments = url.pathname.split("/").filter(Boolean);

    // Customer menu: /menu/:outletSlug/...
    if (segments[0] === "menu" && segments[1]) {
      return { outletId: "", outletSlug: String(segments[1] || "") };
    }

    // Owner dashboard: /owner/:outletSlug
    if (segments[0] === "owner" && segments[1]) {
      return { outletId: "", outletSlug: String(segments[1] || "") };
    }

    // Biller dashboard: /biller/:outletSlug
    if (segments[0] === "biller" && segments[1]) {
      return { outletId: "", outletSlug: String(segments[1] || "") };
    }

    // Allow explicit query params to override when present (useful for API calls):
    const outletIdParam = String(url.searchParams.get("outletId") || "").trim();
    const outletSlugParam = String(url.searchParams.get("outletSlug") || "").trim();
    if (outletIdParam || outletSlugParam) return { outletId: outletIdParam, outletSlug: outletSlugParam };

    // Owner "all" selection may be present in query for administrative actions
    const ownerFilter = String(url.searchParams.get("ownerSelectedOutletFilter") || "").trim().toLowerCase();
    if (ownerFilter === "all" && segments[0] === "owner") return { outletId: "", outletSlug: "all" };

    return { outletId: "", outletSlug: "" };
  } catch (error) {
    return { outletId: "", outletSlug: "" };
  }
}

function readOwnerSelectedOutletFilter() {
  try {
    return String(sessionStorage.getItem(OWNER_SELECTED_OUTLET_FILTER_KEY) || "").trim().toLowerCase();
  } catch (error) {
    return "";
  }
}

function shouldAttachOutletContext(path) {
  const cleanPath = pathWithoutQuery(path);
  if (cleanPath.startsWith("/orders/public")) return false;
  // Attach outlet context for collections scoped by outlet.
  return (
    cleanPath === "/orders" ||
    cleanPath.startsWith("/orders/") ||
    cleanPath === "/orders/history" ||
    cleanPath === "/orders/stream" ||
    cleanPath === "/coc-requests" ||
    cleanPath.startsWith("/coc-requests/") ||
    cleanPath === "/inventory" ||
    cleanPath.startsWith("/inventory/") ||
    cleanPath === "/recipes" ||
    cleanPath.startsWith("/recipes/") ||
    cleanPath === "/reports" ||
    cleanPath.startsWith("/reports/") ||
    cleanPath === "/categories" ||
    cleanPath.startsWith("/categories/") ||
    cleanPath === "/menu" ||
    cleanPath.startsWith("/menu") ||
    cleanPath === "/menu-items" ||
    cleanPath.startsWith("/menu-items")
  );
}

export function withOutletParams(path) {
  if (!shouldAttachOutletContext(path)) return path;
  const { outletId, outletSlug } = readSelectedOutletContext();
  if (!outletId && !outletSlug) return path;
  const [pathOnly, queryString = ""] = String(path || "").split("?");
  const params = new URLSearchParams(queryString);
  if (outletId && !params.has("outletId")) params.set("outletId", outletId);
  if (outletSlug && !params.has("outletSlug")) params.set("outletSlug", outletSlug);
  const nextQuery = params.toString();
  return `${pathOnly}${nextQuery ? `?${nextQuery}` : ""}`;
}

function withOutletRequestContext(path, options = {}) {
  if (!shouldAttachOutletContext(path)) return { path, options };
  const { outletId, outletSlug } = readSelectedOutletContext();
  if (!outletId && !outletSlug) return { path, options };

  if (import.meta.env.DEV) {
    console.debug("[apiClient] attaching outlet context", { path, outletId, outletSlug, method: (options.method || "GET").toUpperCase() });
  }

  const nextOptions = { ...options };
  const method = (nextOptions.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH"].includes(method) && nextOptions.body) {
    try {
      const isFormData = typeof FormData !== "undefined" && nextOptions.body instanceof FormData;
      if (!isFormData) {
        const body = typeof nextOptions.body === "string" ? JSON.parse(nextOptions.body || "{}") : nextOptions.body;
        if (body && typeof body === "object" && !Array.isArray(body)) {
          const nextBody = { ...body };
          if (outletId && !nextBody.outletId) nextBody.outletId = outletId;
          if (outletSlug && !nextBody.outletSlug) nextBody.outletSlug = outletSlug;

          const ownerSelectedOutletFilter = readOwnerSelectedOutletFilter();
          const createAllOutletPaths = ["/categories", "/menu", "/menu-items"];
          const pathOnly = pathWithoutQuery(path);
          if (!nextBody.outletId && !nextBody.outletSlug && method === "POST" && ownerSelectedOutletFilter === "all" && createAllOutletPaths.includes(pathOnly)) {
            nextBody.outletSlug = "all";
          }

          nextOptions.body = typeof nextOptions.body === "string" ? JSON.stringify(nextBody) : nextBody;
        }
      }
    } catch (error) {
      // Keep the original body if it is not JSON. The query string still carries outlet context.
    }
  }

  return { path: withOutletParams(path), options: nextOptions };
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
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = isFormData ? { ...(options.headers || {}) } : { "Content-Type": "application/json", ...(options.headers || {}) };
  if (import.meta.env.DEV) {
    console.debug("[apiClient] request", { path, method, hasToken: Boolean(token), tokenPreview: token ? `${String(token).slice(0, 8)}...` : null, isFormData });
  }
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
  const scopedRequest = withOutletRequestContext(path, options);
  path = scopedRequest.path;
  options = scopedRequest.options;
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
    const maxAttempts = options.retry === false ? 1 : isLoginRequest(path) ? LOGIN_MAX_ATTEMPTS : 3;
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
        if (isLoginRequest(path) && !status) {
          await waitForBackendReady();
        }
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

export default { api, API, API_ROOT, withOutletParams };
