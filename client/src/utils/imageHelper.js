// Image fallback and URL helper logic
const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export function imageUrl(value) {
  if (!value) return "";
  if (value.startsWith("/uploads")) {
    return API_ROOT ? encodeURI(`${API_ROOT}${value}`) : encodeURI(value);
  }
  return encodeURI(value);
}
