/**
 * Centralized API configuration
 * Reads VITE_API_URL from environment variables (defined in .env)
 * Vite exposes environment variables prefixed with VITE_ via import.meta.env
 */

function isLocalAppHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function resolveBaseUrl() {
  const configuredUrl = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
  const cleanConfiguredUrl = configuredUrl.replace(/\/api$/, "");

  if (typeof window === "undefined") {
    return cleanConfiguredUrl || "http://localhost:4000";
  }

  const isLocalApp = isLocalAppHost(window.location.hostname);
  const configuredIsLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(cleanConfiguredUrl);

  if (cleanConfiguredUrl && (isLocalApp || !configuredIsLocal)) {
    return cleanConfiguredUrl;
  }

  if (isLocalApp) {
    return "http://localhost:4000";
  }

  return window.location.origin;
}

export const BASE_URL = resolveBaseUrl();

// Construct full API endpoint
export const API_URL = `${BASE_URL}/api`;

/**
 * Helper to construct login endpoint URLs
 */
export function getLoginEndpoint(role) {
  if (role === "admin") {
    return `${API_URL}/auth/owner/login`;
  } else if (role === "biller") {
    return `${API_URL}/auth/biller/login`;
  }
  return `${API_URL}/auth/login`;
}

/**
 * Format network errors to user-friendly messages
 */
export function formatNetworkError(error) {
  if (!error) {
    return "Service unavailable. Please try again later.";
  }

  if (error.name === "AbortError" || /timeout/i.test(error.message)) {
    return "The backend is taking too long to respond. Please wait a moment and try again.";
  }

  if (/failed to fetch|network|load failed|not reachable|unreachable/i.test(error.message)) {
    return "The backend is not reachable right now. Please wait a moment and try again.";
  }

  if (error.message && error.message.length > 0) {
    return error.message;
  }

  return "Service unavailable. Please try again later.";
}
