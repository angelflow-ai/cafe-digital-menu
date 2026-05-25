const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API = API_URL.replace(/\/$/, "") + "/api";

import sync from "./sync";

let orders = [];
let initialized = false;
const listeners = new Set();
let es = null;

function notify() {
  listeners.forEach((cb) => {
    try {
      cb(orders);
    } catch (e) {
      // ignore listener errors
    }
  });
}

export async function loadOrders() {
  try {
    const res = await fetch(`${API}/orders`, { credentials: "include" });
    if (!res.ok) return orders;
    orders = await res.json();
    notify();
    try { sync.saveOrders(orders); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('inventoryRefresh')); } catch (e) {}
    if (!initialized) setupStream();
    return orders;
  } catch (err) {
    console.error("ordersStore: failed to load orders", err);
    return orders;
  }
}

export function getOrders() {
  return orders;
}

export function subscribe(cb) {
  listeners.add(cb);
  try {
    cb(orders);
  } catch (e) {}
  return () => listeners.delete(cb);
}

function setupStream() {
  initialized = true;
  try {
    es = new EventSource(`${API}/orders/stream`, { withCredentials: true });
    es.addEventListener("order:created", () => loadOrders());
    es.addEventListener("order:updated", () => loadOrders());
    es.onerror = () => {
      try { es.close(); } catch (e) {}
      es = null;
      // try to re-init after a delay
      setTimeout(() => { try { setupStream(); } catch (e) {} }, 3000);
    };
  } catch (err) {
    console.warn("ordersStore: EventSource not available", err);
  }
}

// Listen for cross-tab and in-tab custom events
window.addEventListener("ordersUpdated", (e) => {
  try {
    const payload = e?.detail || sync.getOrdersFromStorage();
    if (!payload) return;
    orders = payload;
    notify();
    console.log("ordersStore: received ordersUpdated event", orders);
  } catch (err) {}
});

window.addEventListener("storage", (e) => {
  try {
    if (!e.key) return;
    if (e.key === "infusion-orders") {
      const payload = sync.getOrdersFromStorage();
      orders = payload;
      notify();
      console.log("ordersStore: storage event updated orders", orders);
    }
  } catch (err) {}
});

export default {
  loadOrders,
  getOrders,
  subscribe
};
