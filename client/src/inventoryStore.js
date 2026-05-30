import sync from "./sync";
import demoMode from "./demoMode";
import { api } from "./services/apiClient";

let inventory = [];
let initialized = false;
const listeners = new Set();
let es = null;

function notify() {
  listeners.forEach((cb) => {
    try {
      cb(inventory);
    } catch (e) {}
  });
}

export async function loadInventory() {
  try {
    const res = await api("/inventory");
    inventory = res || [];
    notify();
    try { sync.saveInventory(inventory); } catch (e) {}
    return inventory;
  } catch (err) {
    // In demo mode, use demo inventory
    if (demoMode.isDemoModeEnabled()) {
      console.log("inventoryStore: loading from demo mode");
      inventory = demoMode.getDemoInventory();
      notify();
      return inventory;
    }
    console.error("inventoryStore: failed to load inventory", err);
    return inventory;
  }
}

export function getInventory() { return inventory; }

export function subscribe(cb) {
  listeners.add(cb);
  try { cb(inventory); } catch (e) {}
  return () => listeners.delete(cb);
}

export default { loadInventory, getInventory, subscribe };

// cross-tab/in-tab sync
window.addEventListener("inventoryUpdated", (e) => {
  try {
    const payload = e?.detail || sync.getInventoryFromStorage();
    if (!payload) return;
    inventory = payload;
    notify();
    console.log("inventoryStore: received inventoryUpdated event", inventory);
  } catch (err) {}
});
window.addEventListener("storage", (e) => {
  try {
    if (!e.key) return;
    if (e.key === "infusion-inventory") {
      inventory = sync.getInventoryFromStorage();
      notify();
      console.log("inventoryStore: storage event updated inventory", inventory);
    }
  } catch (err) {}
});
window.addEventListener('inventoryRefresh', () => {
  try { loadInventory().catch(() => {}); } catch (e) {}
});
