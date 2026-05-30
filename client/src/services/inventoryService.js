import { api } from "./apiClient";

export async function purchaseInventory(id, payload) {
  return api(`/inventory/${id}/purchase`, { method: "POST", body: JSON.stringify(payload) });
}

export default { purchaseInventory };
