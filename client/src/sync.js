const INVENTORY_KEY = "infusion-inventory";
const IS_DEV = import.meta.env.DEV;

export function getOrdersKey() {
  try {
    const outlet = JSON.parse(sessionStorage.getItem("infusion-selected-outlet") || "null");
    const slug = outlet?.slug || "";
    return slug ? `infusion-orders-${slug}` : "infusion-orders";
  } catch (e) {
    return "infusion-orders";
  }
}

export function saveOrders(orders) {
  try {
    localStorage.setItem(getOrdersKey(), JSON.stringify(orders || []));
  } catch (e) {}
  try {
    window.dispatchEvent(new CustomEvent("ordersUpdated", { detail: orders }));
  } catch (e) {}
  if (IS_DEV) {
    try { console.log("Orders saved and event dispatched", orders); } catch (e) {}
  }
}

export function getOrdersFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(getOrdersKey()) || "null") || [];
  } catch (e) { return []; }
}


export function saveInventory(inventory) {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory || []));
  } catch (e) {}
  try { window.dispatchEvent(new CustomEvent("inventoryUpdated", { detail: inventory })); } catch (e) {}
  if (IS_DEV) {
    try { console.log("Inventory saved and event dispatched", inventory); } catch (e) {}
  }
}

export function getInventoryFromStorage() {
  try { return JSON.parse(localStorage.getItem(INVENTORY_KEY) || "null") || []; } catch (e) { return []; }
}

export function emitOrderChangeLog(action, data) {
  if (IS_DEV) {
    try { console.log("Order change:", action, data); } catch (e) {}
  }
}

export default { getOrdersKey, saveOrders, getOrdersFromStorage, saveInventory, getInventoryFromStorage, emitOrderChangeLog };
