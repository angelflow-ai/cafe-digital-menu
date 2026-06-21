// Image fallback and URL helper logic
function isLocalAppHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function resolveApiRoot() {
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

const API_ROOT = resolveApiRoot();
export const DEFAULT_MENU_IMAGE = "/assets/images/Cold Drinks/Milk Shakes/Brownie Shake.jpg";

function appendImageVersion(url, version) {
  const token = String(version || "").trim();
  if (!token || !url.startsWith("/assets/images/")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(token)}`;
}

export function imageUrl(value, version = "") {
  if (!value) return "";
  const versionedValue = appendImageVersion(value, version);
  if (value.startsWith("/uploads")) {
    return API_ROOT ? encodeURI(`${API_ROOT}${value}`) : encodeURI(value);
  }
  return encodeURI(versionedValue);
}
