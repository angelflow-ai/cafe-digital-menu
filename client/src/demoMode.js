// Demo Mode Management
// When backend is offline, the app falls back to localStorage-based operations

let isDemoMode = false;
let backendTested = false;

// Demo inventory structure matching the real backend format
const DEMO_INVENTORY = [
  {
    id: "hot-coffee-premium",
    name: "Heritage Coffee",
    categoryId: "hot-drinks",
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
  return DEMO_CATEGORIES;
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
  createDemoOrder,
  loadDemoOrders,
  saveDemoOrders,
  addDemoOrder
};
