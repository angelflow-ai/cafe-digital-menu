const INVENTORY_KEY = "infusion-inventory";
const IS_DEV = import.meta.env.DEV;
const STORAGE_WRITE_DELAY = 500;
const pendingOrderWrites = new Map();
const pendingInventoryWrites = new Map();

function scheduleStorageWrite(pendingWrites, key, value) {
  const pending = pendingWrites.get(key);
  if (pending) clearTimeout(pending.timer);

  const timer = setTimeout(() => {
    pendingWrites.delete(key);
    try {
      localStorage.setItem(key, JSON.stringify(value || []));
    } catch (e) {}
  }, STORAGE_WRITE_DELAY);

  pendingWrites.set(key, { timer });
}

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
  const key = getOrdersKey();
  scheduleStorageWrite(pendingOrderWrites, key, orders);
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
  scheduleStorageWrite(pendingInventoryWrites, INVENTORY_KEY, inventory);
  try {
    window.dispatchEvent(new CustomEvent("inventoryUpdated", { detail: inventory }));
  } catch (e) {}
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
