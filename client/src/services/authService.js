import { api } from "./apiClient";
import { formatNetworkError } from "../config/api";

export async function request(endpoint, payload) {
  try {
    return await api(endpoint, { method: "POST", body: JSON.stringify(payload) });
  } catch (err) {
    // If it's a network error (backend unreachable), provide user-friendly message
    if (err?.message && /failed to fetch|network|load failed|timeout|not reachable/i.test(err.message)) {
      const userMessage = formatNetworkError(err);
      throw new Error(userMessage);
    }
    throw err;
  }
}

export async function me() {
  return api("/auth/me");
}

export async function logout() {
  return api("/auth/logout", { method: "POST" });
}

export async function checkEmail(email) {
  return api(`/auth/check-email?email=${encodeURIComponent(email)}`);
}

export async function setPassword(email, password, confirmPassword, role) {
  return api("/auth/set-password", { method: "POST", body: JSON.stringify({ email, password, confirmPassword, role }) });
}

export async function forgotPassword(email, role) {
  return api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email, role }) });
}

export async function resetPassword(email, otp, password) {
  return api("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, otp, password }) });
}

export default { request, me, logout, checkEmail, setPassword, forgotPassword, resetPassword };
