import { api, API } from "./apiClient";

export async function createOrder(payload) {
  return api("/orders", { method: "POST", body: JSON.stringify(payload) });
}

export async function createCocRequest(payload) {
  return api("/coc-requests", { method: "POST", body: JSON.stringify(payload) });
}

export async function getPublicOrder(orderId) {
  return api(`/orders/public/${orderId}`);
}

export async function retryPublicOrder(orderId) {
  return api(`/orders/public/${orderId}/retry`, { method: "POST" });
}

export async function patchOrder(orderId, payload) {
  return api(`/orders/${orderId}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function listOrders(query = "") {
  return api(`/orders${query ? `?${query}` : ""}`);
}

export async function listCocRequests() {
  return api(`/coc-requests`);
}

export async function patchCocRequest(id, payload = {}) {
  return api(`/coc-requests/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function ordersStreamUrl() {
  return `${API}/orders/stream`;
}

export default {
  createOrder,
  createCocRequest,
  getPublicOrder,
  retryPublicOrder,
  patchOrder,
  listOrders,
  listCocRequests,
  patchCocRequest,
  ordersStreamUrl,
};
