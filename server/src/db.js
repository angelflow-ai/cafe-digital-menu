import mongoose from "mongoose";
import { categories as seedCategories, menuItems as seedItems, rawMaterials as seedRawMaterials, defaultRecipes as seedRecipes } from "./seed.js";

const sizeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    label: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    sortOrder: { type: Number, default: 0 }
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    icon: { type: String, default: "Utensils" },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const menuItemSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    categoryId: { type: String, required: true },
    description: { type: String, default: "" },
    subcategory: { type: String, default: "" },
    image: { type: String, default: "" },
    sizes: { type: [sizeSchema], validate: [(v) => v.length > 0, "At least one size is required"] },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const orderItemSchema = new mongoose.Schema(
  {
    itemId: String,
    name: String,
    sizeId: String,
    sizeName: String,
    size: String,
    variant: String,
    serveType: String,
    quantity: Number,
    basePrice: Number,
    originalPrice: Number,
    unitPrice: Number,
    lineTotal: Number,
    finalLineTotal: Number,
    addons: {
      extraCheese: Boolean,
      extraCheesePrice: Number
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    tableNumber: { type: String, required: true },
    tableNo: { type: String, required: true },
    paymentMethod: { type: String, enum: ["online", "cash", "UPI_STATIC_QR", "UPI_INTENT_OR_STATIC_QR"], required: true },
    notes: { type: String, default: "" },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["pending_verification","paid","rejected","pending","unknown"], default: undefined },
    status: { type: String, enum: ["new", "pending", "preparing", "ready", "confirmed", "completed", "cancelled", "payment_rejected"], default: "new" },
    confirmedAt: { type: Date },
    rejectedAt: { type: Date },
    deductionStatus: { type: String, enum: ["pending", "deducted"], default: "pending" },
    warnings: { type: [String], default: [] }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const rawMaterialSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    category: { type: String, default: "Inventory" },
    unit: { type: String, enum: ["g", "ml", "pcs"], required: true },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 0 },
    costPerUnit: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const recipeIngredientSchema = new mongoose.Schema(
  {
    rawMaterialId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ["g", "ml", "pcs"], required: true },
    serveType: { type: String, default: "" }
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, required: true },
    itemId: { type: String, required: true },
    ingredients: { type: [recipeIngredientSchema], default: [] }
  },
  { timestamps: true }
);

const inventoryHistorySchema = new mongoose.Schema(
  {
    rawMaterialId: { type: String, required: true },
    change: { type: Number, required: true },
    note: { type: String, default: "" },
    orderId: { type: String, default: "" }
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);
export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export const Order = mongoose.model("Order", orderSchema);
export const RawMaterial = mongoose.model("RawMaterial", rawMaterialSchema);
export const Recipe = mongoose.model("Recipe", recipeSchema);
export const InventoryHistory = mongoose.model("InventoryHistory", inventoryHistorySchema);

function generateOrderId() {
  return `INF-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
}

function normalizeSalesStatus(value) {
  return String(value || "").toLowerCase().trim().replace(/[\s_]+/g, " ");
}

function shouldDeductInventoryOnCreate(order) {
  const status = normalizeSalesStatus(order?.status);
  const paymentStatus = normalizeSalesStatus(order?.paymentStatus);
  return ["confirmed", "completed"].includes(status) || ["confirmed", "paid", "verified", "completed"].includes(paymentStatus);
}

export function isCompletedSale(order) {
  if (!order) return false;

  const status = normalizeSalesStatus(order.status);
  const paymentStatus = normalizeSalesStatus(order.paymentStatus);
  const paymentMethod = String(order.paymentMethod || order.method || "").toLowerCase();

  const rejected = ["cancelled", "rejected", "payment issue", "payment rejected", "failed", "unpaid", "pending verification"];
  if (rejected.includes(status) || rejected.includes(paymentStatus)) return false;

  const onlineIndicators = ["online", "upi", "qr", "intent", "static_qr"];
  const onlineCompleted = onlineIndicators.some((indicator) => paymentMethod.includes(indicator)) && ["confirmed", "verified", "paid", "completed"].includes(paymentStatus);

  const counterIndicators = ["cash", "counter", "coc"];
  const counterCompleted = counterIndicators.some((indicator) => paymentMethod.includes(indicator)) || ["approved", "confirmed", "completed"].includes(status);

  return !!(onlineCompleted || counterCompleted);
}

const memory = {
  categories: seedCategories.map((item) => ({ ...item })),
  menuItems: seedItems.map((item) => ({ ...item, sizes: item.sizes.map((size) => ({ ...size })) })),
  orders: [],
  rawMaterials: seedRawMaterials.map((item) => ({ ...item })),
  recipes: seedRecipes.map((item) => ({ ...item })),
  inventoryHistory: []
};

export const usingMongo = () => mongoose.connection.readyState === 1;

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    console.log("MONGODB_URI not set. Using in-memory seed data.");
    return false;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  await seedDatabase();
  console.log("Connected to MongoDB.");
  return true;
}

async function seedDatabase() {
  const categoryCount = await Category.countDocuments();
  const itemCount = await MenuItem.countDocuments();
  const rawMaterialCount = await RawMaterial.countDocuments();
  const recipeCount = await Recipe.countDocuments();

  if (categoryCount === 0) {
    await Category.insertMany(seedCategories);
  }
  if (itemCount === 0) {
    await MenuItem.insertMany(seedItems);
  } else {
    await MenuItem.updateOne(
      { id: "kit-kat-shake" },
      { $set: { image: "/assets/images/Cold Drinks/Milk Shakes/kitkat-shake-v2.jpg" } }
    );
    await MenuItem.updateOne(
      { id: "paneer-tikka-melt" },
      { $set: { image: "/assets/images/Snacks/Sandwich/paneer-tikka-melt-v2.jpg" } }
    );
  }
  if (rawMaterialCount === 0) {
    await RawMaterial.insertMany(seedRawMaterials);
  }
  if (recipeCount === 0) {
    await Recipe.insertMany(seedRecipes);
  }
}

export const store = {
  async categories() {
    if (usingMongo()) return Category.find().sort({ sortOrder: 1, name: 1 }).lean();
    return [...memory.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async upsertCategory(payload) {
    if (usingMongo()) {
      return Category.findOneAndUpdate({ id: payload.id }, payload, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    }
    const index = memory.categories.findIndex((item) => item.id === payload.id);
    if (index >= 0) memory.categories[index] = payload;
    else memory.categories.push(payload);
    return payload;
  },
  async deleteCategory(id) {
    if (usingMongo()) return Category.deleteOne({ id });
    memory.categories = memory.categories.filter((item) => item.id !== id);
    return { deletedCount: 1 };
  },
  async menuItems(query = {}) {
    if (usingMongo()) {
      const filter = {};
      if (query.categoryId) filter.categoryId = query.categoryId;
      if (query.search) filter.name = { $regex: query.search, $options: "i" };
      if (!query.includeInactive) filter.active = true;
      return MenuItem.find(filter).sort({ name: 1 }).lean();
    }
    return memory.menuItems
      .filter((item) => (query.includeInactive ? true : item.active))
      .filter((item) => (!query.categoryId ? true : item.categoryId === query.categoryId))
      .filter((item) => (!query.search ? true : item.name.toLowerCase().includes(query.search.toLowerCase())))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  async menuItem(id) {
    if (usingMongo()) return MenuItem.findOne({ id }).lean();
    return memory.menuItems.find((item) => item.id === id);
  },
  async upsertMenuItem(payload) {
    const clean = validateMenuItem(payload);
    if (usingMongo()) {
      return MenuItem.findOneAndUpdate({ id: clean.id }, clean, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    }
    const index = memory.menuItems.findIndex((item) => item.id === clean.id);
    if (index >= 0) memory.menuItems[index] = clean;
    else memory.menuItems.push(clean);
    return clean;
  },
  async deleteMenuItem(id) {
    if (usingMongo()) return MenuItem.deleteOne({ id });
    memory.menuItems = memory.menuItems.filter((item) => item.id !== id);
    return { deletedCount: 1 };
  },
  async rawMaterials() {
    if (usingMongo()) return RawMaterial.find().sort({ category: 1, name: 1 }).lean();
    return [...memory.rawMaterials].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  },
  async rawMaterial(id) {
    if (usingMongo()) return RawMaterial.findOne({ id }).lean();
    return memory.rawMaterials.find((item) => item.id === id);
  },
  async upsertRawMaterial(payload) {
    const clean = {
      id: String(payload.id || payload.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: String(payload.name || "").trim(),
      category: String(payload.category || "Inventory").trim(),
      unit: ["g", "ml", "pcs"].includes(payload.unit) ? payload.unit : "pcs",
      stock: Number(payload.stock || 0),
      minStock: Number(payload.minStock || 0),
      costPerUnit: Number(payload.costPerUnit || 0),
      active: payload.active !== false
    };
    if (usingMongo()) {
      return RawMaterial.findOneAndUpdate({ id: clean.id }, clean, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    }
    const index = memory.rawMaterials.findIndex((item) => item.id === clean.id);
    if (index >= 0) memory.rawMaterials[index] = clean;
    else memory.rawMaterials.push(clean);
    return clean;
  },
  async deleteRawMaterial(id) {
    if (usingMongo()) return RawMaterial.deleteOne({ id });
    memory.rawMaterials = memory.rawMaterials.filter((item) => item.id !== id);
    return { deletedCount: 1 };
  },
  async adjustRawMaterialStock(id, change, note, orderId) {
    return adjustRawMaterialStock(id, change, note, orderId);
  },
  async recipes() {
    if (usingMongo()) return Recipe.find().sort({ itemId: 1 }).lean();
    return [...memory.recipes].sort((a, b) => a.itemId.localeCompare(b.itemId));
  },
  async recipeByItem(itemId) {
    if (usingMongo()) return Recipe.findOne({ itemId }).lean();
    return memory.recipes.find((item) => item.itemId === itemId);
  },
  async upsertRecipe(payload) {
    const clean = {
      id: String(payload.id || payload.itemId).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      itemId: String(payload.itemId || "").trim(),
      ingredients: (payload.ingredients || [])
        .map((ingredient) => ({
          rawMaterialId: String(ingredient.rawMaterialId || "").trim(),
          amount: Number(ingredient.amount || 0),
          unit: String(ingredient.unit || "pcs").trim(),
          serveType: String(ingredient.serveType || "").trim()
        }))
        .filter((ingredient) => ingredient.rawMaterialId && Number.isFinite(ingredient.amount) && ingredient.amount > 0)
    };
    if (usingMongo()) {
      return Recipe.findOneAndUpdate({ id: clean.id }, clean, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    }
    const index = memory.recipes.findIndex((item) => item.id === clean.id);
    if (index >= 0) memory.recipes[index] = clean;
    else memory.recipes.push(clean);
    return clean;
  },
  async deleteRecipe(id) {
    if (usingMongo()) return Recipe.deleteOne({ id });
    memory.recipes = memory.recipes.filter((item) => item.id !== id);
    return { deletedCount: 1 };
  },
  async inventoryHistory() {
    if (usingMongo()) return InventoryHistory.find().sort({ createdAt: -1 }).lean();
    return [...memory.inventoryHistory].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async orders() {
    if (usingMongo()) return Order.find().sort({ createdAt: -1 }).lean({ virtuals: true });
    return [...memory.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async orderById(id) {
    if (usingMongo()) {
      return Order.findOne({ $or: [{ _id: id }, { orderId: id }] }).lean({ virtuals: true });
    }
    return memory.orders.find((item) => item.id === id || item.orderId === id) || null;
  },
  async createOrder(payload) {
    const order = await buildOrder(payload);
    order.orderId = order.orderId || generateOrderId();
    order.deductionStatus = "pending";
    if (shouldDeductInventoryOnCreate(order)) {
      await deductInventoryForOrder(order);
      order.deductionStatus = "deducted";
    }
    if (usingMongo()) return Order.create(order);
    const saved = { ...order, id: `order-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    memory.orders.push(saved);
    return saved;
  },
  async createCocRequest(payload) {
    // build a COC request with resolved item names, prices, and total so admin sees correct details
    const order = await buildOrder(payload);
    const request = { ...order, id: `coc-${Date.now()}`, createdAt: new Date().toISOString() };
    memory.cocRequests = memory.cocRequests || [];
    memory.cocRequests.push(request);
    return request;
  },
  async cocRequests() {
    memory.cocRequests = memory.cocRequests || [];
    return [...memory.cocRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async approveCocRequest(id) {
    memory.cocRequests = memory.cocRequests || [];
    const index = memory.cocRequests.findIndex((r) => r.id === id);
    if (index < 0) return null;
    const req = memory.cocRequests.splice(index, 1)[0];
    // create actual order from request
    const order = await buildOrder(req);
    order.orderId = order.orderId || generateOrderId();
    order.deductionStatus = "pending";
    await deductInventoryForOrder(order);
    order.deductionStatus = "deducted";
    if (usingMongo()) {
      const created = await Order.create(order);
      return created;
    }
    const saved = { ...order, id: `order-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    memory.orders.push(saved);
    return saved;
  },
  async updateOrder(id, payload) {
    if (usingMongo()) {
      return Order.findOneAndUpdate({ $or: [{ _id: id }, { orderId: id }] }, payload, { new: true }).lean();
    }
    const index = memory.orders.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const updated = { ...memory.orders[index], ...payload, updatedAt: new Date().toISOString() };
    memory.orders[index] = updated;
    return updated;
  },
  async deductOrderInventory(id) {
    const order = await this.orderById(id);
    if (!order) throw new Error("Order not found.");
    if (order.deductionStatus === "deducted") return order;
    await deductInventoryForOrder(order);
    order.deductionStatus = "deducted";
    if (usingMongo()) {
      return Order.findByIdAndUpdate(
        order._id || order.id,
        { deductionStatus: "deducted", warnings: order.warnings || [] },
        { new: true }
      ).lean();
    }
    const index = memory.orders.findIndex((item) => item.id === order.id);
    if (index >= 0) {
      memory.orders[index] = { ...memory.orders[index], deductionStatus: "deducted", warnings: order.warnings || [], updatedAt: new Date().toISOString() };
      return memory.orders[index];
    }
    return order;
  },
  async reportsDaily(dateString) {
    const fromDate = dateString ? new Date(dateString) : new Date();
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(fromDate);
    toDate.setDate(fromDate.getDate() + 1);
    const orders = (await this.orders()).filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= fromDate && createdAt < toDate && isCompletedSale(order);
    });
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalOrders = orders.length;
    return { totalSales, totalOrders, orders };
  },
  async reportsMonthly(yearMonth) {
    const now = yearMonth ? new Date(yearMonth) : new Date();
    const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 1);
    const orders = (await this.orders()).filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= fromDate && createdAt < toDate && isCompletedSale(order);
    });
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalOrders = orders.length;
    return { totalSales, totalOrders, orders };
  },
  async deleteOrder(id) {
    if (usingMongo()) return Order.findOneAndDelete({ $or: [{ _id: id }, { orderId: id }] });
    memory.orders = memory.orders.filter((item) => item.id !== id);
    return { deletedCount: 1 };
  }
};

function validateMenuItem(payload) {
  const sizes = (payload.sizes || [])
    .map((size, index) => ({
      id: String(size.id || size.label || size.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: String(size.name || size.label || "").trim(),
      label: String(size.label || size.name || "").trim(),
      price: Number(size.price),
      sortOrder: Number(size.sortOrder ?? index + 1)
    }))
    .filter((size) => size.name && Number.isFinite(size.price));

  if (!sizes.length) throw new Error("Every item needs at least one size with a price.");
  if (sizes.some((size) => size.price < 0)) throw new Error("Size prices must be zero or greater.");

  return {
    id: String(payload.id || payload.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: String(payload.name || "").trim(),
    categoryId: payload.categoryId,
    description: payload.description || "",
    subcategory: String(payload.subcategory || payload.subCategory || "").trim(),
    image: payload.image || "",
    sizes: sizes.sort((a, b) => a.sortOrder - b.sortOrder),
    featured: Boolean(payload.featured),
    active: payload.active !== false
  };
}

async function buildOrder(payload) {
  const items = [];

  for (const raw of payload.items || []) {
    const menuItem = await store.menuItem(raw.itemId);
    if (!menuItem) throw new Error(`Menu item not found: ${raw.itemId}`);
    const size = menuItem.sizes.find((candidate) => candidate.id === raw.sizeId) || menuItem.sizes[0];
    if (!size || !Number.isFinite(Number(size.price))) throw new Error(`Price missing for ${menuItem.name}`);
    const quantity = Math.max(1, Number(raw.quantity || 1));
    const basePrice = Number(raw.basePrice ?? raw.originalPrice ?? raw.baseUnitPrice ?? size.price ?? 0);
    const extraCheeseSelected = !!raw.addons?.extraCheese;
    const extraCheesePrice = extraCheeseSelected ? Number(raw.addons?.extraCheesePrice || 0) : 0;
    const unitPrice = basePrice + extraCheesePrice;
    const computedLineTotal = unitPrice * quantity;
    const rawLineTotal = Number(raw.lineTotal ?? raw.finalLineTotal);
    const lineTotal = Number.isFinite(rawLineTotal) && rawLineTotal > 0 ? rawLineTotal : computedLineTotal;
    items.push({
      itemId: menuItem.id,
      name: raw.name || menuItem.name,
      sizeId: size.id,
      sizeName: raw.sizeName || size.name,
      size: raw.size || raw.sizeName || size.name,
      variant: raw.variant || raw.size || raw.sizeName || size.name,
      serveType: raw.serveType || "",
      quantity,
      basePrice,
      originalPrice: basePrice,
      unitPrice,
      lineTotal,
      finalLineTotal: lineTotal,
      addons: {
        extraCheese: extraCheeseSelected,
        extraCheesePrice
      }
    });
  }

  if (!items.length) throw new Error("Order must include at least one item.");
  if (!payload.tableNumber) throw new Error("Table number is required.");
  if (!payload.paymentMethod) throw new Error("Payment method is required.");

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const order = {
    orderId: payload.orderId,
    customerName: payload.customerName || "Guest",
    phone: payload.phone || "Not provided",
    tableNumber: String(payload.tableNumber),
    tableNo: String(payload.tableNumber),
    paymentMethod: payload.paymentMethod,
    notes: payload.notes || "",
    items,
    total,
    totalAmount: total,
    status: payload.status || "new",
    paymentStatus: payload.paymentStatus
  };

  if (payload.confirmedAt) order.confirmedAt = payload.confirmedAt;
  if (payload.rejectedAt) order.rejectedAt = payload.rejectedAt;

  return order;
}

function normalizeUnit(amount, unit) {
  const value = Number(amount);
  if (!Number.isFinite(value)) throw new Error("Invalid ingredient amount.");
  const normalized = String(unit || "").trim().toLowerCase();
  if (["g", "gram", "grams"].includes(normalized)) return value;
  if (["kg", "kilogram", "kilograms"].includes(normalized)) return value * 1000;
  if (["ml", "milliliter", "millilitre", "milliliters", "millilitres"].includes(normalized)) return value;
  if (["l", "liter", "litre", "liters", "litres"].includes(normalized)) return value * 1000;
  if (["pcs", "pc", "piece", "pieces"].includes(normalized)) return value;
  throw new Error(`Unsupported ingredient unit: ${unit}`);
}

function convertQuantity(amount, unit, targetUnit) {
  const value = normalizeUnit(amount, unit);
  const normalizedSource = String(unit || "").trim().toLowerCase();
  const normalizedTarget = String(targetUnit || "").trim().toLowerCase();
  const groups = {
    g: ["g", "gram", "grams", "kg", "kilogram", "kilograms"],
    ml: ["ml", "milliliter", "millilitre", "milliliters", "millilitres", "l", "liter", "litre", "liters", "litres"],
    pcs: ["pcs", "pc", "piece", "pieces"]
  };
  if (!groups[normalizedTarget] || !groups[normalizedTarget].includes(normalizedSource)) {
    throw new Error(`Cannot convert ${unit} to ${targetUnit}`);
  }
  return value;
}

async function getRawMaterial(id) {
  if (usingMongo()) return RawMaterial.findOne({ id }).lean();
  return memory.rawMaterials.find((item) => item.id === id);
}

async function getRecipeForItem(itemId) {
  if (usingMongo()) return Recipe.findOne({ itemId }).lean();
  return memory.recipes.find((item) => item.itemId === itemId);
}

async function adjustRawMaterialStock(rawMaterialId, change, note, orderId) {
  if (usingMongo()) {
    const updated = await RawMaterial.findOneAndUpdate({ id: rawMaterialId }, { $inc: { stock: change } }, { new: true }).lean();
    await InventoryHistory.create({ rawMaterialId, change, note, orderId });
    return updated;
  }

  const material = memory.rawMaterials.find((item) => item.id === rawMaterialId);
  if (!material) throw new Error(`Inventory item not found: ${rawMaterialId}`);
  material.stock = Number(material.stock || 0) + Number(change || 0);
  memory.inventoryHistory.push({ rawMaterialId, change, note, orderId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  return material;
}

async function deductInventoryForOrder(order) {
  if (!order?.items?.length) return;
  if (order.deductionStatus === "deducted") return;
  const orderId = order.orderId || order.id || `order-${Date.now()}`;
  order.warnings = order.warnings || [];

  for (const item of order.items) {
    const recipe = await getRecipeForItem(item.itemId);
    if (!recipe) {
      order.warnings.push(`Recipe missing for ${item.name || item.itemId}. Inventory deduction skipped for this item.`);
      continue;
    }
    if (!recipe.ingredients?.length) {
      order.warnings.push(`Recipe has no ingredients for ${item.name || item.itemId}. Inventory deduction skipped for this item.`);
      continue;
    }
    for (const ingredient of recipe.ingredients) {
      if (ingredient.serveType && ingredient.serveType !== item.serveType) continue;
      const material = await getRawMaterial(ingredient.rawMaterialId);
      if (!material) throw new Error(`Inventory item missing: ${ingredient.rawMaterialId}`);
      const required = convertQuantity(ingredient.amount, ingredient.unit, material.unit) * item.quantity;
      if (material.stock < required) {
        throw new Error(`Low inventory for ${material.name} (${material.stock}${material.unit} available, ${required}${material.unit} required).`);
      }
      await adjustRawMaterialStock(material.id, -required, `Order ${order.customerName} (${order.tableNumber})`, orderId);
    }
  }
  order.deductionStatus = "deducted";
}

