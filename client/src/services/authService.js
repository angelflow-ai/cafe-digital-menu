import { api } from "./apiClient";

export async function request(endpoint, payload) {
  return api(endpoint, { method: "POST", body: JSON.stringify(payload) });
}

export async function me() {
  return api("/auth/me");
}

export async function logout() {
  return api("/auth/logout", { method: "POST" });
}

export async function forgotPassword(email, role) {
  return api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email, role }) });
}

export async function resetPassword(email, otp, password) {
  return api("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, otp, password }) });
}

export default { request, me, logout, forgotPassword, resetPassword };
