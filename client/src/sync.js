const ORDERS_KEY = "infusion-orders";
const INVENTORY_KEY = "infusion-inventory";

export function saveOrders(orders) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders || []));
  } catch (e) {}
  try {
    window.dispatchEvent(new CustomEvent("ordersUpdated", { detail: orders }));
  } catch (e) {}
  try { console.log("Orders saved and event dispatched", orders); } catch (e) {}
}

export function getOrdersFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "null") || [];
  } catch (e) { return []; }
}

export function saveInventory(inventory) {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory || []));
  } catch (e) {}
  try { window.dispatchEvent(new CustomEvent("inventoryUpdated", { detail: inventory })); } catch (e) {}
  try { console.log("Inventory saved and event dispatched", inventory); } catch (e) {}
}

export function getInventoryFromStorage() {
  try { return JSON.parse(localStorage.getItem(INVENTORY_KEY) || "null") || []; } catch (e) { return []; }
}

export function emitOrderChangeLog(action, data) {
  try { console.log("Order change:", action, data); } catch (e) {}
}

export default { saveOrders, getOrdersFromStorage, saveInventory, getInventoryFromStorage, emitOrderChangeLog };
