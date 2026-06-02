// Demo Mode Management
// When backend is offline, the app falls back to localStorage-based operations

let isDemoMode = false;
let backendTested = false;
const DEMO_CATEGORIES_KEY = "demo-categories";

// Demo inventory structure matching the real backend format
const DEMO_INVENTORY = [
  {
    id: "hot-coffee-premium",
    name: "Heritage Coffee",
    categoryId: "hot-drinks",
    subcategory: "Coffee",
    description: "Rich, aromatic premium coffee blend",
    image: "/assets/images/Hot Drinks/Hot Coffee/demo.jpg",
    sizes: [
      { id: "regular", name: "Regular", label: "Regular", price: 68 },
      { id: "premium", name: "Premium", label: "Premium", price: 88 }
    ],
    active: true
  },
  {
    id: "hot-chai-signature",
    name: "Signature Chai",
    categoryId: "hot-drinks",
    subcategory: "Chai",
    description: "Traditional spiced chai with fresh milk",
    image: "/assets/images/Hot Drinks/Chai/demo.jpg",
    sizes: [
      { id: "regular", name: "Regular", label: "Regular", price: 48 },
      { id: "large", name: "Large", label: "Large", price: 58 }
    ],
    active: true
  },
  {
    id: "cold-coffee-shake",
    name: "Cold Coffee Shake",
    categoryId: "cold-drinks",
    subcategory: "Cold Coffee",
    description: "Iced coffee with milk and cream",
    image: "/assets/images/Cold Drinks/Milk Shakes/demo.jpg",
    sizes: [
      { id: "regular", name: "Regular", label: "Regular", price: 78 }
    ],
    active: true
  },
  {
    id: "snack-samosa",
    name: "Crispy Samosa",
    categoryId: "snacks",
    description: "Golden fried pastry with spiced filling",
    image: "/assets/images/Snacks/Noodles/demo.jpg",
    sizes: [
      { id: "single", name: "Single", label: "Single", price: 35 },
      { id: "pair", name: "Pair", label: "Pair", price: 60 }
    ],
    active: true
  },
  {
    id: "dessert-cake",
    name: "Classic Cake Slice",
    categoryId: "dessert",
    description: "Soft and moist cake slice",
    image: "/assets/images/Dessert/demo.jpg",
    sizes: [
      { id: "regular", name: "Regular", label: "Regular", price: 120 }
    ],
    active: true
  }
];

const DEMO_CATEGORIES = [
  { id: "hot-drinks", name: "Hot Drinks", icon: "Coffee" },
  { id: "cold-drinks", name: "Cold Drinks", icon: "CupSoda" },
  { id: "snacks", name: "Snacks", icon: "Sandwich" },
  { id: "dessert", name: "Dessert", icon: "CakeSlice" }
];

function slugifyValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDemoCategory(category, fallbackSortOrder = 0) {
  const source = category && typeof category === "object" ? category : {};
  const name = String(source.name || "").trim();
  const id = String(source.id || slugifyValue(name)).trim();
  return {
    id,
    name,
    icon: String(source.icon || "Utensils"),
    sortOrder: Number.isFinite(Number(source.sortOrder)) ? Number(source.sortOrder) : fallbackSortOrder,
    isDeleted: source.isDeleted === true,
    deletedAt: source.isDeleted === true ? source.deletedAt || new Date().toISOString() : null
  };
}

function saveDemoCategories(categories) {
  try {
    localStorage.setItem(DEMO_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error("Failed to save demo categories:", e);
  }
}

function loadDemoCategoriesStore() {
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_CATEGORIES_KEY) || "null");
    if (Array.isArray(stored) && stored.length > 0) {
      return stored
        .map((entry, index) => normalizeDemoCategory(entry, index + 1))
        .filter((entry) => entry.id && entry.name);
    }
  } catch (e) {
    console.error("Failed to load demo categories:", e);
  }
  const initial = DEMO_CATEGORIES.map((entry, index) => normalizeDemoCategory({ ...entry, sortOrder: index + 1 }, index + 1));
  saveDemoCategories(initial);
  return initial;
}

function updateDemoCategories(updater) {
  const current = loadDemoCategoriesStore();
  const next = typeof updater === "function" ? updater(current) : current;
  const normalized = Array.isArray(next)
    ? next
        .map((entry, index) => normalizeDemoCategory(entry, index + 1))
        .filter((entry) => entry.id && entry.name)
    : current;
  saveDemoCategories(normalized);
  return normalized;
}

export async function testBackendAvailability(apiUrl) {
  if (backendTested) {
    return isDemoMode;
  }
  backendTested = true;
  
  try {
    const response = await fetch(`${apiUrl}/categories`, {
      method: "GET",
      credentials: "include",
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    isDemoMode = false;
    return false;
  } catch (err) {
    console.log("Backend not available, enabling demo mode:", err.message);
    isDemoMode = true;
    return true;
  }
}

export function setDemoMode(enabled) {
  isDemoMode = enabled;
}

export function isDemoModeEnabled() {
  return isDemoMode;
}

export function resetBackendTest() {
  backendTested = false;
  isDemoMode = false;
}

export function getDemoInventory() {
  return DEMO_INVENTORY;
}

export function getDemoCategories() {
  return loadDemoCategoriesStore()
    .filter((category) => category.isDeleted !== true)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export function getDemoCategoriesWithDeleted() {
  return loadDemoCategoriesStore().sort((a, b) => {
    const aDeleted = a.isDeleted === true;
    const bDeleted = b.isDeleted === true;
    if (aDeleted !== bDeleted) return aDeleted ? 1 : -1;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });
}

export function createDemoCategory(payload = {}) {
  const name = String(payload.name || "").trim();
  if (!name) throw new Error("Category name is required");
  const id = String(payload.id || slugifyValue(name)).trim();
  if (!id) throw new Error("Category id is required");
  const sortOrder = Number.isFinite(Number(payload.sortOrder)) ? Number(payload.sortOrder) : loadDemoCategoriesStore().length + 1;
  const created = normalizeDemoCategory({
    id,
    name,
    icon: payload.icon || "Utensils",
    sortOrder,
    isDeleted: false,
    deletedAt: null
  }, sortOrder);
  updateDemoCategories((categories) => {
    const index = categories.findIndex((item) => item.id === id);
    if (index >= 0) {
      const next = [...categories];
      next[index] = { ...next[index], ...created, isDeleted: false, deletedAt: null };
      return next;
    }
    return [...categories, created];
  });
  return created;
}

export function deleteDemoCategory(id) {
  const normalizedId = String(id || "").trim();
  if (!normalizedId) return null;
  const deletedAt = new Date().toISOString();
  let result = null;
  updateDemoCategories((categories) => categories.map((entry) => {
    if (entry.id !== normalizedId) return entry;
    result = { ...entry, isDeleted: true, deletedAt };
    return result;
  }));
  return result;
}

export function restoreDemoCategory(id) {
  const normalizedId = String(id || "").trim();
  if (!normalizedId) return null;
  let result = null;
  updateDemoCategories((categories) => categories.map((entry) => {
    if (entry.id !== normalizedId) return entry;
    result = { ...entry, isDeleted: false, deletedAt: null };
    return result;
  }));
  return result;
}

export function permanentlyDeleteDemoCategory(id) {
  const normalizedId = String(id || "").trim();
  if (!normalizedId) return { deletedCount: 0 };
  const before = loadDemoCategoriesStore();
  const after = before.filter((entry) => entry.id !== normalizedId);
  saveDemoCategories(after);
  return { deletedCount: before.length === after.length ? 0 : 1 };
}

// Generate demo order with correct structure
export function createDemoOrder(customer, items) {
  const orderId = `INF-${String(Date.now()).slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
  const total = items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 1), 0);
  
  return {
    id: orderId,
    orderId: orderId,
    _id: orderId,
    customerName: customer.customerName || "Guest",
    phone: customer.phone || "",
    tableNumber: customer.tableNumber || null,
    paymentMethod: customer.paymentMethod || "cash",
    paymentStatus: customer.paymentStatus || "completed",
    status: customer.status || "completed",
    items: items,
    subtotal: total,
    total: total,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    orderType: customer.orderType || "dine-in"
  };
}

// Load saved orders from localStorage
export function loadDemoOrders() {
  try {
    const stored = localStorage.getItem("infusion-orders");
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load demo orders:", e);
    return [];
  }
}

// Save orders to localStorage
export function saveDemoOrders(orders) {
  try {
    localStorage.setItem("infusion-orders", JSON.stringify(orders));
  } catch (e) {
    console.error("Failed to save demo orders:", e);
  }
}

// Add a new order to localStorage
export function addDemoOrder(order) {
  try {
    const orders = loadDemoOrders();
    orders.push(order);
    saveDemoOrders(orders);
    return order;
  } catch (e) {
    console.error("Failed to add demo order:", e);
    return order;
  }
}

export default {
  testBackendAvailability,
  setDemoMode,
  isDemoModeEnabled,
  resetBackendTest,
  getDemoInventory,
  getDemoCategories,
  getDemoCategoriesWithDeleted,
  createDemoCategory,
  deleteDemoCategory,
  restoreDemoCategory,
  permanentlyDeleteDemoCategory,
  createDemoOrder,
  loadDemoOrders,
  saveDemoOrders,
  addDemoOrder
};
