import { api } from "./apiClient";

export async function getInventoryItems(opts = {}) {
  const searchParams = new URLSearchParams();
  if (opts.includeDeleted) searchParams.set("includeDeleted", "true");
  const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return api(`/inventory${qs}`);
}

export async function createInventoryItem(payload) {
  return api("/inventory", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateInventoryItem(id, payload) {
  return api(`/inventory/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteInventoryItem(id) {
  return api(`/inventory/${id}`, { method: "DELETE" });
}

export async function restoreInventoryItem(id) {
  return api(`/inventory/${id}/restore`, { method: "PATCH" });
}

export async function purchaseInventory(id, payload) {
  return api(`/inventory/${id}/purchase`, { method: "POST", body: JSON.stringify(payload) });
}

export default { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem, restoreInventoryItem, purchaseInventory };
