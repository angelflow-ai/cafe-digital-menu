import sync from "./sync";
import demoMode from "./demoMode";
import { api } from "./services/apiClient";

const IS_DEV = import.meta.env.DEV;

let inventory = [];
let initialized = false;
const listeners = new Set();
let es = null;
let loadPromise = null;
let refreshTimer = null;

function notify() {
  listeners.forEach((cb) => {
    try {
      cb(inventory);
    } catch (e) {}
  });
}

export async function loadInventory() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
  try {
    const res = await api("/inventory");
    inventory = res || [];
    notify();
    try { sync.saveInventory(inventory); } catch (e) {}
    return inventory;
  } catch (err) {
    // In demo mode, use demo inventory
    if (demoMode.isDemoModeEnabled()) {
      if (IS_DEV) console.log("inventoryStore: loading from demo mode");
      inventory = demoMode.getDemoInventory();
      notify();
      return inventory;
    }
    if (err && (err.status === 401 || err.status === 403)) {
      console.warn("inventoryStore: inventory access is unauthorized", err.message || err);
    } else {
      console.error("inventoryStore: failed to load inventory", err);
    }
    return inventory;
  }
  })();
  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
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
    if (IS_DEV) console.log("inventoryStore: received inventoryUpdated event", inventory);
  } catch (err) {}
});
window.addEventListener("storage", (e) => {
  try {
    if (!e.key) return;
    if (e.key === "infusion-inventory") {
      inventory = sync.getInventoryFromStorage();
      notify();
      if (IS_DEV) console.log("inventoryStore: storage event updated inventory", inventory);
    }
  } catch (err) {}
});
window.addEventListener('inventoryRefresh', () => {
  try {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      loadInventory().catch(() => {});
    }, 150);
  } catch (e) {}
});
