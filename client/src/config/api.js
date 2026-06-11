/**
 * Centralized API configuration
 * Reads VITE_API_URL from environment variables (defined in .env)
 * Vite exposes environment variables prefixed with VITE_ via import.meta.env
 */

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Construct full API endpoint
export const API_URL = BASE_URL.replace(/\/$/, "") + "/api";

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
