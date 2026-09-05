import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { categories as seedCategories, menuItems as seedItems, rawMaterials as seedRawMaterials, defaultRecipes as seedRecipes } from "./seed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Ensure server/.env is loaded even when this module is imported directly
try {
  const envPath = path.join(__dirname, "..", ".env");
  dotenv.config({ path: envPath });
} catch (err) {
  // Non-fatal: dotenv may already be loaded by the caller
}
const persistenceFile = path.join(__dirname, "persisted-store.json");
const authPersistenceFile = path.join(__dirname, "persisted-auth.json");

function maskMongoUri(uri) {
  if (!uri || typeof uri !== "string") return "(missing)";
  try {
    const withoutCredentials = uri.replace(/:\/\/[^@/]+@/, "://");
    const match = withoutCredentials.match(/^[^:]+:\/\/([^/\?]+)/);
    return match ? match[1] : "(unparseable)";
  } catch (e) {
    return "(unparseable)";
  }
}

export const DEFAULT_OUTLET_SLUG = "near-skit";
export const DEFAULT_OUTLETS = [
  {
    name: "The Infusion Saga - Near SKIT",
    slug: DEFAULT_OUTLET_SLUG,
    isActive: true
  },
  {
    name: "The Infusion Saga - Near High Street",
    slug: "near-high-street",
    isActive: true
  }
];

const outletReference = {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Outlet",
  default: null,
  index: true
};

const outletSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    upiId: { type: String, default: "" },
    qrImage: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    openingTime: { type: String, default: "" },
    closingTime: { type: String, default: "" }
  },
  { timestamps: true }
);

const tableSchema = new mongoose.Schema(
  {
    outletId: outletReference,
    tableNumber: { type: String, required: true, trim: true },
    tableNo: { type: String, default: "" },
    name: { type: String, default: "" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

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

const addonSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    outletId: outletReference,
    id: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, default: "Utensils" },
    sortOrder: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const menuItemSchema = new mongoose.Schema(
  {
    outletId: outletReference,
    id: { type: String, required: true },
    name: { type: String, required: true },
    categoryId: { type: String, required: true },
    description: { type: String, default: "" },
    subCategoryId: { type: String, default: "" },
    subCategoryName: { type: String, default: "" },
    subcategory: { type: String, default: "" },
    image: { type: String, default: "" },
    sizes: { type: [sizeSchema], validate: [(v) => v.length > 0, "At least one size is required"] },
    serveOptions: { type: [String], default: [] },
    addons: { type: mongoose.Schema.Types.Mixed, default: [] },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
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
    addons: { type: mongoose.Schema.Types.Mixed, default: {} },
    addOns: { type: mongoose.Schema.Types.Mixed, default: [] }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    outletId: outletReference,
    orderId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    tableNumber: { type: String, required: true },
    tableNo: { type: String, required: true },
    paymentMethod: { type: String, enum: ["online", "cash", "pending", "UPI_STATIC_QR", "UPI_INTENT_OR_STATIC_QR"], required: true },
    orderType: { type: String, default: "" },
    source: { type: String, default: "" },
    notes: { type: String, default: "" },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["pending_verification","pending","confirmed","paid","rejected","payment_issue","payment_rejected","completed","unknown"], default: undefined },
    status: { type: String, enum: ["new", "pending", "preparing", "ready", "confirmed", "completed", "cancelled", "payment_rejected", "payment_issue"], default: "new" },
    confirmedAt: { type: Date },
    rejectedAt: { type: Date },
    deductionStatus: { type: String, enum: ["pending", "deducted"], default: "pending" },
    warnings: { type: [String], default: [] }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const rawMaterialSchema = new mongoose.Schema(
  {
    outletId: outletReference,
    id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, default: "Inventory" },
    unit: { type: String, enum: ["g", "ml", "pcs"], required: true },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 0 },
    costPerUnit: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
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
    outletId: outletReference,
    id: { type: String, required: true, index: true },
    itemId: { type: String, required: true },
    ingredients: { type: [recipeIngredientSchema], default: [] }
  },
  { timestamps: true }
);

const inventoryHistorySchema = new mongoose.Schema(
  {
    outletId: outletReference,
    rawMaterialId: { type: String, required: true },
    change: { type: Number, required: true },
    note: { type: String, default: "" },
    orderId: { type: String, default: "" },
    purchasePrice: { type: Number, default: null }
  },
  { timestamps: true }
);

const staffAccountSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ["admin", "biller"], required: true },
    passwordHash: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    verificationExpiresAt: { type: Date, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpiresAt: { type: Date, default: null },
    passwordSetAt: { type: Date, default: null },
    mustChangePassword: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

rawMaterialSchema.index({ outletId: 1, id: 1 }, { unique: true });
recipeSchema.index({ outletId: 1, id: 1 }, { unique: true });
categorySchema.index({ outletId: 1, id: 1 }, { unique: true });
menuItemSchema.index({ outletId: 1, id: 1 }, { unique: true });

export const Category = mongoose.model("Category", categorySchema);
export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export const Outlet = mongoose.model("Outlet", outletSchema);
export const Table = mongoose.model("Table", tableSchema);
export const Order = mongoose.model("Order", orderSchema);
export const RawMaterial = mongoose.model("RawMaterial", rawMaterialSchema);
export const Recipe = mongoose.model("Recipe", recipeSchema);
export const InventoryHistory = mongoose.model("InventoryHistory", inventoryHistorySchema);
export const StaffAccount = mongoose.model("StaffAccount", staffAccountSchema);

async function ensureMongoIndexes() {
  if (!usingMongo()) return;

  try {
    const categoriesIndexNames = (await Category.collection.indexes()).map((index) => index.name);
    if (categoriesIndexNames.includes("id_1")) {
      await Category.collection.dropIndex("id_1");
    }
    await Category.collection.createIndex({ outletId: 1, id: 1 }, { unique: true });

    const menuItemsIndexNames = (await MenuItem.collection.indexes()).map((index) => index.name);
    if (menuItemsIndexNames.includes("id_1")) {
      await MenuItem.collection.dropIndex("id_1");
    }
    await MenuItem.collection.createIndex({ outletId: 1, id: 1 }, { unique: true });
  } catch (error) {
    console.warn("Failed to ensure MongoDB schema indexes:", error);
  }
}

function generateOrderId() {
  return `INF-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
}

function normalizeRecipeReference(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeInventoryName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyOutlet(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugify(value) {
  return slugifyOutlet(value);
}

function normalizeOutletPayload(payload = {}, existing = {}) {
  const name = String(payload.name ?? existing.name ?? "").trim();
  const slug = slugifyOutlet(payload.slug ?? existing.slug ?? name);
  if (!name) throw new Error("Outlet name is required.");
  if (!slug) throw new Error("Outlet slug is required.");

  return {
    name,
    slug,
    address: String(payload.address ?? existing.address ?? "").trim(),
    phone: String(payload.phone ?? existing.phone ?? "").trim(),
    upiId: String(payload.upiId ?? existing.upiId ?? "").trim(),
    qrImage: String(payload.qrImage ?? existing.qrImage ?? "").trim(),
    isActive: payload.isActive ?? existing.isActive ?? true,
    openingTime: String(payload.openingTime ?? existing.openingTime ?? "").trim(),
    closingTime: String(payload.closingTime ?? existing.closingTime ?? "").trim()
  };
}

function getRequestOutletValue(source = {}, key) {
  if (!source) return undefined;
  if (Object.prototype.hasOwnProperty.call(source, key)) return source[key];
  if (source.body && Object.prototype.hasOwnProperty.call(source.body, key)) return source.body[key];
  if (source.query && Object.prototype.hasOwnProperty.call(source.query, key)) return source.query[key];
  if (source.params && Object.prototype.hasOwnProperty.call(source.params, key)) return source.params[key];
  return undefined;
}

function normalizeOutletId(outlet) {
  const id = outlet?._id || outlet?.id || outlet;
  return id ? String(id) : "";
}

function applyDefaultOutletToMemoryRecord(record, defaultOutletId) {
  if (!record || record.outletId || !defaultOutletId) return false;
  record.outletId = defaultOutletId;
  record.updatedAt = record.updatedAt || new Date().toISOString();
  return true;
}

function matchesOutlet(record, outletId) {
  if (!outletId) return true;
  return String(record?.outletId || "") === String(outletId);
}

function isHiddenInventoryItem(item) {
  return normalizeInventoryName(item?.name || item?.id) === "paper cup";
}

function isDeletedInventoryItem(item) {
  return item?.isDeleted === true;
}

function isLowStockItem(item) {
  const stock = Number(item?.stock || 0);
  const minStock = Number(item?.minStock || 0);
  const unit = String(item?.unit || "pcs").toLowerCase();
  const fallbackMinStock = unit === "g" || unit === "ml" ? 10000 : 10;
  const threshold = minStock > 0 ? minStock : fallbackMinStock;
  return stock <= threshold;
}

function resolveRawMaterialId(ingredient, rawMaterials = []) {
  const candidates = [
    ingredient?.rawMaterialId,
    ingredient?.inventoryId,
    ingredient?.ingredientId,
    ingredient?.id,
    ingredient?.name
  ].filter(Boolean);

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeRecipeReference(candidate);
    const material = rawMaterials.find((item) => {
      const normalizedId = normalizeRecipeReference(item?.id);
      const normalizedName = normalizeRecipeReference(item?.name);
      return normalizedId === normalizedCandidate || normalizedName === normalizedCandidate;
    });

    if (material) return String(material.id || "").trim();
  }

  return null;
}

function normalizeRecipeIngredients(ingredients = [], rawMaterials = []) {
  const normalized = [];
  const skipped = [];

  (ingredients || []).forEach((ingredient) => {
    const rawMaterialId = resolveRawMaterialId(ingredient, rawMaterials);
    const amount = Number(ingredient?.amount || 0);
    const unit = String(ingredient?.unit || "pcs").trim().toLowerCase();

    if (!rawMaterialId || !Number.isFinite(amount) || amount <= 0) {
      skipped.push({
        rawMaterialId: ingredient?.rawMaterialId || ingredient?.inventoryId || ingredient?.ingredientId || ingredient?.name || "",
        name: ingredient?.name || "",
        amount: ingredient?.amount,
        unit: ingredient?.unit
      });
      return;
    }

    normalized.push({
      rawMaterialId,
      amount,
      unit: ["g", "ml", "pcs"].includes(unit) ? unit : "pcs",
      serveType: String(ingredient?.serveType || "").trim()
    });
  });

  return { ingredients: normalized, skipped };
}

function normalizeSalesStatus(value) {
  const raw = String(value || "").toLowerCase().trim();
  if (!raw) return "";

  const aliasMap = {
    "pending verification": "pending_verification",
    "payment issue": "payment_issue",
    "payment rejected": "payment_rejected",
    "approved": "confirmed",
    "verified": "confirmed",
    "waiting": "pending",
    "payment pending": "pending"
  };

  const normalized = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return aliasMap[normalized] || normalized.replace(/\s+/g, "_");
}

function isExtraCheeseAddon(addon = {}) {
  return normalizeRecipeReference(addon?.name || addon?.id) === "extra cheese";
}

function isBurgerMenuItem(menuItem = {}) {
  const text = normalizeRecipeReference(`${menuItem.id || ""} ${menuItem.name || ""} ${menuItem.subcategory || ""} ${menuItem.subCategoryName || ""}`);
  return text.includes("burger");
}

function isPizzaMenuItem(menuItem = {}) {
  const text = normalizeRecipeReference(`${menuItem.id || ""} ${menuItem.name || ""} ${menuItem.subcategory || ""} ${menuItem.subCategoryName || ""}`);
  return text.includes("pizza");
}

function getExtraCheesePriceForItem(menuItem = {}) {
  if (isBurgerMenuItem(menuItem)) return 25;
  if (isPizzaMenuItem(menuItem)) return 30;
  return 0;
}

function isSafeMongoOrderId(value) {
  return typeof value === "string" && mongoose.isValidObjectId(value);
}

function buildOrderLookup(identifier) {
  const key = String(identifier || "").trim();
  if (!key) return null;

  const filters = [];
  if (isSafeMongoOrderId(key)) filters.push({ _id: key });
  filters.push({ orderId: key });
  filters.push({ id: key });
  filters.push({ requestId: key });

  return filters.length === 1 ? filters[0] : { $or: filters };
}

function buildMenuItemLookup(identifier) {
  const key = String(identifier || "").trim();
  if (!key) return {};
  const filters = [];
  if (mongoose.Types.ObjectId.isValid(key)) filters.push({ _id: key });
  filters.push({ id: key });
  return filters.length === 1 ? filters[0] : { $or: filters };
}

function shouldDeductInventoryOnCreate(order) {
  const status = normalizeSalesStatus(order?.status);
  const paymentStatus = normalizeSalesStatus(order?.paymentStatus);
  // Only deduct when order is truly finalized: status=completed OR paymentStatus in [paid, verified]
  return status === "completed" || ["paid", "verified"].includes(paymentStatus);
}

export function isCompletedSale(order) {
  if (!order) return false;

  const status = normalizeSalesStatus(order.status);
  const paymentStatus = normalizeSalesStatus(order.paymentStatus);

  const rejected = ["cancelled", "rejected", "payment issue", "payment rejected", "failed", "unpaid", "pending verification"];
  if (rejected.includes(status) || rejected.includes(paymentStatus)) return false;

  return status === "completed";
}

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function splitEmailList(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function getConfiguredStaffEmails(role) {
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (normalizedRole === "admin") {
    return splitEmailList(process.env.OWNER_EMAILS || process.env.ADMIN_EMAIL || "owner@theinfusionsaga.com");
  }
  if (normalizedRole === "biller") {
    return splitEmailList(process.env.BILLER_EMAILS || process.env.BILLER_EMAIL || "biller@theinfusionsaga.com");
  }
  return [];
}

function normalizePersistedMemory(raw = {}) {
  const fallbackCategories = Array.isArray(raw.categories) && raw.categories.length ? raw.categories : seedCategories;
  const fallbackMenuItems = Array.isArray(raw.menuItems) && raw.menuItems.length ? raw.menuItems : seedItems;
  const fallbackRawMaterials = Array.isArray(raw.rawMaterials) && raw.rawMaterials.length ? raw.rawMaterials : seedRawMaterials;
  const fallbackRecipes = Array.isArray(raw.recipes) && raw.recipes.length ? raw.recipes : seedRecipes;
  const defaultOutletId = String((Array.isArray(raw.outlets) && raw.outlets[0] && (raw.outlets[0]._id || raw.outlets[0].id)) || `outlet-${DEFAULT_OUTLET_SLUG}`);

  return {
    outlets: Array.isArray(raw.outlets) ? raw.outlets.map((item) => ({ ...item })) : [],
    categories: fallbackCategories.map((item) => ({ ...(item || {}), outletId: String(item?.outletId || defaultOutletId) })),
    menuItems: fallbackMenuItems.map((item) => ({ ...(item || {}), outletId: String(item?.outletId || defaultOutletId), sizes: Array.isArray(item?.sizes) ? item.sizes.map((size) => ({ ...size })) : [] })),
    orders: Array.isArray(raw.orders) ? raw.orders.map((item) => ({ ...item })) : [],
    tables: Array.isArray(raw.tables) ? raw.tables.map((item) => ({ ...item })) : [],
    rawMaterials: fallbackRawMaterials.filter((item) => !isHiddenInventoryItem(item)).map((item) => ({ ...(item || {}), outletId: String(item?.outletId || defaultOutletId) })),
    recipes: fallbackRecipes.map((item) => ({ ...(item || {}), outletId: String(item?.outletId || defaultOutletId) })),
    inventoryHistory: Array.isArray(raw.inventoryHistory) ? raw.inventoryHistory.map((item) => ({ ...item })) : []
  };
}

function loadPersistedMemory() {
  try {
    if (!fs.existsSync(persistenceFile)) return normalizePersistedMemory();
    const raw = JSON.parse(fs.readFileSync(persistenceFile, "utf8"));
    return normalizePersistedMemory(raw);
  } catch (error) {
    console.warn("Failed to load persisted fallback memory, using seed defaults.", error);
    return normalizePersistedMemory();
  }
}

function savePersistedMemory(memoryState) {
  try {
    fs.writeFileSync(persistenceFile, JSON.stringify({
      outlets: memoryState.outlets || [],
      categories: memoryState.categories || [],
      menuItems: memoryState.menuItems || [],
      orders: memoryState.orders || [],
      tables: memoryState.tables || [],
      rawMaterials: memoryState.rawMaterials || [],
      recipes: memoryState.recipes || [],
      inventoryHistory: memoryState.inventoryHistory || []
    }, null, 2), "utf8");
  } catch (error) {
    console.warn("Failed to save persisted fallback memory.", error);
    try {
      const fallback = path.join(os.tmpdir(), path.basename(persistenceFile));
      fs.writeFileSync(fallback, JSON.stringify(memoryState, null, 2), "utf8");
      console.warn("Persisted memory written to fallback path:", fallback);
    } catch (err2) {
      console.warn("Failed to write persisted memory to fallback path.", err2);
    }
  }
}

function loadPersistedStaffAccounts() {
  try {
    if (!fs.existsSync(authPersistenceFile)) return [];
    const raw = JSON.parse(fs.readFileSync(authPersistenceFile, "utf8"));
    return Array.isArray(raw) ? raw : [];
  } catch (error) {
    console.warn("Failed to load persisted staff accounts, using empty list.", error);
    return [];
  }
}

function savePersistedStaffAccounts(accounts) {
  try {
    fs.writeFileSync(authPersistenceFile, JSON.stringify(accounts, null, 2), "utf8");
  } catch (error) {
    console.warn("Failed to save persisted staff accounts.", error);
    try {
      const fallback = path.join(os.tmpdir(), path.basename(authPersistenceFile));
      fs.writeFileSync(fallback, JSON.stringify(accounts, null, 2), "utf8");
      console.warn("Persisted staff accounts written to fallback path:", fallback);
    } catch (err2) {
      console.warn("Failed to write persisted staff accounts to fallback path.", err2);
    }
  }
}

const memory = loadPersistedMemory();
memory.cocRequests = (memory.orders || []).filter(o => o.orderType === "COC" && o.status === "pending");

export const usingMongo = () => mongoose.connection.readyState === 1;

export async function seedDefaultOutlets() {
  if (usingMongo()) {
    const existingOld = await Outlet.findOne({ slug: "high-street-capital-mall" });
    const existingNew = await Outlet.findOne({ slug: "near-high-street" });
    if (existingOld && !existingNew) {
      await Outlet.updateOne(
        { _id: existingOld._id },
        { $set: { slug: "near-high-street", name: "The Infusion Saga - Near High Street" } }
      );
    } else if (existingOld && existingNew && String(existingOld._id) !== String(existingNew._id)) {
      await Outlet.deleteOne({ _id: existingOld._id });
      await Outlet.updateOne(
        { _id: existingNew._id },
        { $set: { name: "The Infusion Saga - Near High Street" } }
      );
    } else {
      await Outlet.updateMany(
        { name: /High Street Capital Mall/i },
        { $set: { name: "The Infusion Saga - Near High Street" } }
      );
    }
    const seeded = [];
    for (const outlet of DEFAULT_OUTLETS) {
      const payload = normalizeOutletPayload(outlet);
      const { isActive, ...rest } = payload;
      const saved = await Outlet.findOneAndUpdate(
        { slug: outlet.slug },
        { $setOnInsert: rest, $set: { isActive: outlet.isActive !== false } },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      ).lean();
      seeded.push(saved);
    }
    return seeded;
  }

  memory.outlets = memory.outlets || [];
  let changed = false;
  const seeded = [];

  for (const outlet of DEFAULT_OUTLETS) {
    const clean = normalizeOutletPayload(outlet);
    const existing = memory.outlets.find((item) => item.slug === clean.slug);
    if (existing) {
      if (existing.isActive === false && outlet.isActive !== false) {
        existing.isActive = true;
        existing.updatedAt = new Date().toISOString();
        changed = true;
      }
      seeded.push(existing);
      continue;
    }

    const now = new Date().toISOString();
    const saved = { ...clean, id: `outlet-${clean.slug}`, createdAt: now, updatedAt: now };
    memory.outlets.push(saved);
    seeded.push(saved);
    changed = true;
  }

  if (changed) savePersistedMemory(memory);
  return seeded;
}

export async function getExplicitOutletId(source = {}) {
  const outletId = getRequestOutletValue(source, "outletId");
  if (outletId === "all") return null;
  if (outletId) {
    const outlet = await store.outletById(outletId);
    if (outlet) return normalizeOutletId(outlet);
  }

  const outletSlug = getRequestOutletValue(source, "outletSlug");
  if (outletSlug === "all") return null;
  if (outletSlug) {
    const outlet = await store.outletBySlug(outletSlug);
    if (outlet) return normalizeOutletId(outlet);
  }

  return null;
}

export async function getCurrentOutlet(source = {}) {
  const outletId = getRequestOutletValue(source, "outletId");
  if (outletId === "all") return null;
  if (outletId) {
    const outlet = await store.outletById(outletId);
    if (outlet) return outlet;
  }

  const outletSlug = getRequestOutletValue(source, "outletSlug");
  if (outletSlug === "all") return null;
  if (outletSlug) {
    const outlet = await store.outletBySlug(outletSlug);
    if (outlet) return outlet;
  }

  let fallback = await store.outletBySlug(DEFAULT_OUTLET_SLUG);
  if (!fallback) {
    const seeded = await seedDefaultOutlets();
    fallback = seeded.find((outlet) => outlet.slug === DEFAULT_OUTLET_SLUG) || await store.outletBySlug(DEFAULT_OUTLET_SLUG);
  }
  return fallback;
}

export async function getCurrentOutletId(source = {}) {
  const outlet = await getCurrentOutlet(source);
  return normalizeOutletId(outlet);
}

const SHARED_CATALOG_COLLECTIONS = new Set(["categories", "category"]);

function isAllOutletsSelection(source = {}) {
  const outletId = getRequestOutletValue(source, "outletId");
  const outletSlug = getRequestOutletValue(source, "outletSlug");
  return outletId === "all" || outletSlug === "all";
}

async function getTargetOutletIds(source = {}) {
  if (isAllOutletsSelection(source)) {
    if (usingMongo()) {
      const outlets = await Outlet.find({}).lean();
      return outlets.map((outlet) => normalizeOutletId(outlet)).filter(Boolean);
    }
    return (memory.outlets || []).map((outlet) => normalizeOutletId(outlet)).filter(Boolean);
  }
  const outletId = await getCurrentOutletId(source);
  return outletId ? [outletId] : [];
}

export function resolveCollectionOutletScope(collectionName, query = {}) {
  const normalizedName = String(collectionName || "").trim().toLowerCase().replace(/[^a-z]+/g, "");
  if (SHARED_CATALOG_COLLECTIONS.has(normalizedName)) return null;
  return getCurrentOutletId(query);
}

async function buildCollectionFilter(collectionName, query = {}) {
  const outletId = await resolveCollectionOutletScope(collectionName, query);
  return outletId ? { outletId } : {};
}

export function deduplicateSharedRecords(records = [], key = "id") {
  const unique = [];
  const seen = new Map();

  for (const record of Array.isArray(records) ? records : []) {
    const identifier = String(record?.[key] ?? "").trim();
    if (!identifier) continue;

    const existing = seen.get(identifier);
    if (!existing) {
      seen.set(identifier, record);
      unique.push(record);
      continue;
    }

    const existingHasOutlet = Boolean(existing?.outletId);
    const recordHasOutlet = Boolean(record?.outletId);

    if (!existingHasOutlet && recordHasOutlet) {
      continue;
    }

    if (existingHasOutlet && !recordHasOutlet) {
      const existingIndex = unique.findIndex((item) => String(item?.[key] ?? "").trim() === identifier);
      if (existingIndex >= 0) unique[existingIndex] = record;
      seen.set(identifier, record);
      continue;
    }

    const existingUpdatedAt = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
    const recordUpdatedAt = record?.updatedAt ? new Date(record.updatedAt).getTime() : 0;
    if (recordUpdatedAt > existingUpdatedAt) {
      const existingIndex = unique.findIndex((item) => String(item?.[key] ?? "").trim() === identifier);
      if (existingIndex >= 0) unique[existingIndex] = record;
      seen.set(identifier, record);
    }
  }

  return unique;
}

export async function migrateLegacyOutletData(defaultOutlet = null) {
  const outlet = defaultOutlet || await getCurrentOutlet({ outletSlug: DEFAULT_OUTLET_SLUG });
  const defaultOutletId = normalizeOutletId(outlet);

  if (!defaultOutletId || !usingMongo()) {
    return { orders: 0, tables: 0, inventory: 0, recipes: 0, inventoryHistory: 0 };
  }

  const skitOutlet = await Outlet.findOne({ slug: "near-skit" });
  const highStreetOutlet = await Outlet.findOne({ slug: "near-high-street" });

  const legacyMappings = [
    { legacyValues: ["outlet-near-skit", "near-skit"], outletId: skitOutlet?._id },
    { legacyValues: ["outlet-near-high-street", "near-high-street"], outletId: highStreetOutlet?._id }
  ];

  const models = [Order, Table, RawMaterial, Recipe, InventoryHistory];
  const migrationResults = await Promise.all(
    models.map(async (model) => {
      let modifiedCount = 0;

      for (const { legacyValues, outletId } of legacyMappings) {
        if (!outletId) continue;

        const legacyResult = await model.collection.updateMany(
          { outletId: { $in: legacyValues } },
          { $set: { outletId } }
        );
        modifiedCount += legacyResult?.modifiedCount || 0;
      }

      const defaultResult = await model.collection.updateMany(
        { $or: [{ outletId: { $exists: false } }, { outletId: null }] },
        { $set: { outletId: defaultOutletId } }
      );

      return modifiedCount + (defaultResult?.modifiedCount || 0);
    })
  );

  return {
    orders: migrationResults[0] || 0,
    tables: migrationResults[1] || 0,
    inventory: migrationResults[2] || 0,
    recipes: migrationResults[3] || 0,
    inventoryHistory: migrationResults[4] || 0
  };
}

async function autoSyncDefaultRecipes() {
  // Only run auto-sync when using MongoDB
  // In dev mode, recipes are already loaded from persisted store by loadPersistedMemory()
  if (!usingMongo()) {
    return;
  }
  
  const results = { created: 0, skipped: 0, failed: 0, errors: [] };
  
  try {
    // Get existing recipes
    const existingRecipes = await Recipe.find({}, { id: 1, itemId: 1, _id: 1 }).lean();
    const existingRecipeKeys = new Set(existingRecipes.flatMap((item) => [
      String(item.id || "").trim().toLowerCase(),
      String(item.itemId || "").trim().toLowerCase()
    ]));
    
    // Get available raw materials for normalization
    const availableRawMaterials = await RawMaterial.find({}, { id: 1, name: 1 }).lean();
    
    // Process each default recipe
    for (const defaultRecipe of seedRecipes) {
      try {
        const normalizedId = String(defaultRecipe.id || "").trim().toLowerCase();
        const normalizedItemId = String(defaultRecipe.itemId || "").trim().toLowerCase();
        
        // Skip if recipe already exists
        if (existingRecipeKeys.has(normalizedId) || existingRecipeKeys.has(normalizedItemId)) {
          results.skipped++;
          continue;
        }
        
        // Normalize ingredients
        const { ingredients, skipped } = normalizeRecipeIngredients(defaultRecipe.ingredients || [], availableRawMaterials);
        if (skipped.length > 0) {
          console.warn(`[Recipe Startup Sync] Skipped unresolved ingredients for ${defaultRecipe.itemId || defaultRecipe.id}:`, skipped);
        }
        
        const cleanRecipe = {
          id: String(defaultRecipe.id || defaultRecipe.itemId || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          itemId: String(defaultRecipe.itemId || "").trim(),
          ingredients
        };
        if (defaultRecipe.outletId) cleanRecipe.outletId = defaultRecipe.outletId;
        
        await Recipe.create(cleanRecipe);
        
        results.created++;
        console.log(`[Recipe Startup Sync] Created: ${cleanRecipe.itemId || cleanRecipe.id}`);
      } catch (error) {
        results.failed++;
        results.errors.push({ recipeId: defaultRecipe.id, error: error.message });
        console.error(`[Recipe Startup Sync] Failed ${defaultRecipe.id}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`[Recipe Startup Sync] Fatal error:`, error.message);
  }
  
  if (results.created > 0 || results.failed > 0) {
    console.log(`[Recipe Startup Sync] Complete: ${results.created} created, ${results.skipped} skipped, ${results.failed} failed`);
  }
}

function canUsePersistedStaffFallback() {
  return process.env.NODE_ENV !== "production" && (!process.env.MONGODB_URI || !usingMongo());
}

export async function findStaffAccountByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return null;
  if (usingMongo()) return StaffAccount.findOne({ email: normalized }).lean();
  if (!canUsePersistedStaffFallback()) return null;
  return loadPersistedStaffAccounts().find((item) => item.email === normalized) || null;
}

export async function findStaffAccountByRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (!normalized) return null;
  if (usingMongo()) return StaffAccount.findOne({ role: normalized }).lean();
  if (!canUsePersistedStaffFallback()) return null;
  return loadPersistedStaffAccounts().find((item) => item.role === normalized) || null;
}

export async function upsertStaffAccount(account) {
  const clean = {
    email: String(account.email || "").trim().toLowerCase(),
    role: account.role === "biller" ? "biller" : "admin",
    passwordHash: String(account.passwordHash || ""),
    verified: Boolean(account.verified),
    verificationToken: account.verificationToken || null,
    verificationExpiresAt: account.verificationExpiresAt || null,
    passwordResetToken: account.passwordResetToken || null,
    passwordResetExpiresAt: account.passwordResetExpiresAt || null,
    passwordSetAt: account.passwordSetAt || null,
    mustChangePassword: Boolean(account.mustChangePassword),
    isActive: account.isActive !== false,
    updatedAt: new Date().toISOString()
  };
  if (usingMongo()) {
    return StaffAccount.findOneAndUpdate({ email: clean.email }, { $set: clean }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
  }
  if (!canUsePersistedStaffFallback()) {
    return clean;
  }
  const existing = loadPersistedStaffAccounts();
  const index = existing.findIndex((item) => item.email === clean.email);
  const next = index >= 0 ? { ...existing[index], ...clean } : { ...clean, createdAt: new Date().toISOString() };
  const nextList = index >= 0 ? existing.map((item, itemIndex) => (itemIndex === index ? next : item)) : [...existing, next];
  savePersistedStaffAccounts(nextList);
  return next;
}

export async function setStaffPassword(email, passwordHash, options = {}) {
  const user = await findStaffAccountByEmail(email);
  if (!user) return null;

  const hasVerificationToken = Object.prototype.hasOwnProperty.call(options, "verificationToken");
  const hasVerificationExpiresAt = Object.prototype.hasOwnProperty.call(options, "verificationExpiresAt");
  const hasPasswordResetToken = Object.prototype.hasOwnProperty.call(options, "passwordResetToken");
  const hasPasswordResetExpiresAt = Object.prototype.hasOwnProperty.call(options, "passwordResetExpiresAt");
  const hasMustChangePassword = Object.prototype.hasOwnProperty.call(options, "mustChangePassword");

  return upsertStaffAccount({
    ...user,
    passwordHash,
    verified: Boolean(options.verified ?? user.verified ?? false),
    verificationToken: hasVerificationToken ? options.verificationToken ?? null : user.verificationToken ?? null,
    verificationExpiresAt: hasVerificationExpiresAt ? options.verificationExpiresAt ?? null : user.verificationExpiresAt ?? null,
    passwordResetToken: hasPasswordResetToken ? options.passwordResetToken ?? null : user.passwordResetToken ?? null,
    passwordResetExpiresAt: hasPasswordResetExpiresAt ? options.passwordResetExpiresAt ?? null : user.passwordResetExpiresAt ?? null,
    passwordSetAt: user.passwordSetAt || new Date().toISOString(),
    mustChangePassword: hasMustChangePassword ? Boolean(options.mustChangePassword) : Boolean(user.mustChangePassword ?? false),
    isActive: true
  });
}

export async function seedStaffAccounts() {
  const configuredAdminEmails = getConfiguredStaffEmails("admin");
  const configuredBillerEmails = getConfiguredStaffEmails("biller");
  const defaultAdminPassword = String(process.env.ADMIN_PASSWORD || "infusion-owner");
  const defaultBillerPassword = String(process.env.BILLER_PASSWORD || "infusion-biller");

  const adminHash = bcrypt.hashSync(defaultAdminPassword, 10);
  const billerHash = bcrypt.hashSync(defaultBillerPassword, 10);

  for (const email of configuredAdminEmails) {
    await upsertStaffAccount({
      email,
      role: "admin",
      passwordHash: adminHash,
      verified: true,
      verificationToken: null,
      verificationExpiresAt: null,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      passwordSetAt: new Date().toISOString(),
      mustChangePassword: false,
      isActive: true
    });
  }

  for (const email of configuredBillerEmails) {
    await upsertStaffAccount({
      email,
      role: "biller",
      passwordHash: billerHash,
      verified: true,
      verificationToken: null,
      verificationExpiresAt: null,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      passwordSetAt: new Date().toISOString(),
      mustChangePassword: false,
      isActive: true
    });
  }
}

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    if (process.env.NODE_ENV === "production") {
      const message = "Production startup failed: MONGODB_URI is required. MongoDB-backed storage is mandatory in production.";
      throw new Error(message);
    }
    console.warn("MONGODB_URI not set. Using development fallback auth storage.");
    await seedStaffAccounts();
    await seedDefaultOutlets();
    const migrationSummary = await migrateLegacyOutletData();
    if (Object.values(migrationSummary).some((count) => count > 0)) {
      console.log(`[Outlet Migration] ${JSON.stringify(migrationSummary)}`);
    }
    // Dev mode: recipes already loaded from persisted store
    return false;
  }

  try {
    const serverSelectionTimeoutMS = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000);
    const connectTimeoutMS = Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 10000);

    const maskedHosts = maskMongoUri(process.env.MONGODB_URI);
    console.log(`[DB] Attempting MongoDB connection to host(s): ${maskedHosts} (masked)`);
    console.log(`[DB] Connection options: serverSelectionTimeoutMS=${serverSelectionTimeoutMS}, connectTimeoutMS=${connectTimeoutMS}`);

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS, connectTimeoutMS });
    await ensureMongoIndexes();
    await seedDefaultOutlets();
    await seedDatabase();
    // Auto-sync default recipes into MongoDB after initial seed
    await autoSyncDefaultRecipes();
    const migrationSummary = await migrateLegacyOutletData();
    if (Object.values(migrationSummary).some((count) => count > 0)) {
      console.log(`[Outlet Migration] ${JSON.stringify(migrationSummary)}`);
    }
    await seedStaffAccounts();
    console.log("Connected to MongoDB.");
    return true;
  } catch (error) {
    // Do not silently fall back when a MONGODB_URI is provided. Surface the error so startup fails loudly.
    globalThis.mongoConnectionError = {
      message: error.message,
      stack: error.stack
    };
    console.error("Failed to connect to MongoDB.", error?.message || error);
    // If MONGODB_URI was explicitly set, propagate the error to abort startup.
    if (process.env.MONGODB_URI) {
      throw new Error(`MongoDB connection failed for ${maskMongoUri(process.env.MONGODB_URI)}: ${error?.message || String(error)}`);
    }
    // Otherwise (no MONGODB_URI), remain in dev fallback mode.
    if (process.env.NODE_ENV !== "production") {
      console.warn("No MONGODB_URI set; using development fallback storage.");
      await seedStaffAccounts();
      await seedDefaultOutlets();
      const migrationSummary = await migrateLegacyOutletData();
      if (Object.values(migrationSummary).some((count) => count > 0)) {
        console.log(`[Outlet Migration] ${JSON.stringify(migrationSummary)}`);
      }
      return false;
    }
    // In production, rethrow.
    throw error;
  }
}

function getMenuItemSyncSubcategory(item = {}) {
  return String(item.subCategoryName || item.subcategoryName || item.subcategory || item.subCategory || "").trim();
}

function isProjectManagedMenuImage(value) {
  const image = String(value || "").trim();
  return !image || image.startsWith("/assets/images/");
}

function shouldSyncSeedMenuImage(currentImage, seedImage) {
  const nextImage = String(seedImage || "").trim();
  if (!nextImage) return false;
  const image = String(currentImage || "").trim();
  if (image === nextImage) return false;
  return isProjectManagedMenuImage(image);
}

const requiredPastaItems = [
  { id: "blush-bowl-pasta", name: "Blush Bowl Pasta (Pink Sauce Pasta)", categoryId: "snacks", subcategory: "Pasta", description: "", image: "/assets/images/Snacks/Pasta/Blush Bowl Pasta (Pink Sauce Pasta).jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true, isActive: true, isDeleted: false, deletedAt: null },
  { id: "tomato-basil-pasta", name: "Tomato Basil Pasta (Red Sauce Pasta)", categoryId: "snacks", subcategory: "Pasta", description: "", image: "/assets/images/Snacks/Pasta/Tomato Basil Pasta (Red Sauce Pasta).jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 148 }], active: true, isActive: true, isDeleted: false, deletedAt: null },
  { id: "herbed-bechamel-pasta", name: "Herbed Béchamel Pasta (White Sauce Pasta)", categoryId: "snacks", subcategory: "Pasta", description: "", image: "/assets/images/Snacks/Pasta/Herbed Béchamel Pasta (White Sauce Pasta).jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true, isActive: true, isDeleted: false, deletedAt: null }
];

const managedMenuImagePaths = new Map([
  ["storia-coconut-water", "/assets/images/Coconut Water/Storia Coconut Water.jpg"],
  ["strawberry-coolberg", "/assets/images/Cold Drinks/Coolberg/Strawberry Coolberg.png"],
  ["peach-coolberg", "/assets/images/Cold Drinks/Coolberg/Peach Coolberg.jpg"],
  ["cranberry-coolberg", "/assets/images/Cold Drinks/Coolberg/Cranberry Coolberg.jpg"],
  ["jugaaro-coolberg", "/assets/images/Cold Drinks/Coolberg/Jugaaro Coolberg.webp"],
  ["ultra-white-monster", "/assets/images/Cold Drinks/Energy Drinks/Ultra White Monster.jpg"],
  ["ultra-original-monster", "/assets/images/Cold Drinks/Energy Drinks/Ultra Original Monster.jpg"],
  ["ultra-pink-monster", "/assets/images/Cold Drinks/Energy Drinks/Ultra Pink Monster.jpg"],
  ["bad-apple-monster", "/assets/images/Cold Drinks/Energy Drinks/Bad Apple Monster.jpg"],
  ["rio-punch-monster", "/assets/images/Cold Drinks/Energy Drinks/Rio Punch Monster.jpg"],
  ["white-pineapple-monster", "/assets/images/Cold Drinks/Energy Drinks/White Pineapple Monster.jpg"],
  ["redbull-250ml-", "/assets/images/Cold Drinks/Energy Drinks/Red Bull.jpg"],
  ["paneer-tikka-melt", "/assets/images/Snacks/Sandwich/Paneer Tikka Melt.jpg"],
  ["kit-kat-shake", "/assets/images/Cold Drinks/Milk Shakes/Kit-Kat Shake.jpg"],
  ["kunafa-shake", "/assets/images/Cold Drinks/Milk Shakes/Kunafa Shake.jpg"],
  ["prab-protein-milk-shake-coffee", "/assets/images/Cold Drinks/Milk Shakes/Prab Protein Milk-shake (Coffee).webp"],
  ["prab-protein-milk-shake-double-chocolate", "/assets/images/Cold Drinks/Milk Shakes/Prab Protein Milk-shake (Double Chocolate).jpg"],
  ["herbed-bechamel-pasta", "/assets/images/Snacks/Pasta/Herbed Béchamel Pasta (White Sauce Pasta).jpg"],
  ["infusion-loaded-stack", "/assets/images/Snacks/Burger/Infusion Loaded Stack.jpg"]
]);

function firstSizePriceFilter(price) {
  return {
    $or: [
      { "sizes.0.price": price },
      { price }
    ]
  };
}

export async function repairMenuData() {
  const summary = { duplicatesRemoved: 0, itemsRepaired: 0, itemsCreated: 0 };

  for (const [id, image] of managedMenuImagePaths.entries()) {
    const result = await MenuItem.updateMany(
      { id, image: { $ne: image } },
      { $set: { image } },
      { runValidators: true }
    );
    summary.itemsRepaired += result.modifiedCount || 0;
  }

  const pastaMetadata = {
    categoryId: "snacks",
    subcategory: "Pasta",
    subCategoryName: "Pasta",
    subCategoryId: "pasta",
    active: true,
    isActive: true,
    isDeleted: false,
    deletedAt: null
  };

  for (const item of requiredPastaItems) {
    const cleanItem = validateMenuItem(item);
    const existing = await MenuItem.findOne({ id: cleanItem.id }, { _id: 1 }).lean();
    if (!existing) {
      await MenuItem.create(cleanItem);
      summary.itemsCreated += 1;
      continue;
    }
    const result = await MenuItem.updateOne(
      { id: cleanItem.id },
      { $set: { ...pastaMetadata, name: cleanItem.name, image: cleanItem.image } },
      { runValidators: true }
    );
    summary.itemsRepaired += result.modifiedCount || 0;
  }

  const deletedAt = new Date();
  const duplicateResult = await MenuItem.updateMany(
    {
      $or: [
        { id: "persistence-test-burger" },
        { image: /^\/uploads\/50af/i },
        { name: /^Infusion Loaded Stack$/i, id: { $ne: "infusion-loaded-stack" } },
        { name: /^Infusion Loaded Stack$/i, id: { $ne: "infusion-loaded-stack" }, ...firstSizePriceFilter(99) }
      ]
    },
    { $set: { active: false, isActive: false, isDeleted: true, deletedAt } },
    { runValidators: true }
  );
  summary.duplicatesRemoved = duplicateResult.modifiedCount || 0;

  const loadedStack = validateMenuItem({
    id: "infusion-loaded-stack",
    name: "Infusion Loaded Stack",
    categoryId: "snacks",
    subcategory: "Burger",
    description: "",
    image: "/assets/images/Snacks/Burger/Infusion Loaded Stack.jpg",
    sizes: [{ id: "one", name: "Regular", label: "Regular", price: 188 }],
    active: true,
    isActive: true,
    isDeleted: false,
    deletedAt: null
  });
  const existingLoadedStack = await MenuItem.findOne({ id: loadedStack.id }, { _id: 1 }).lean();
  if (!existingLoadedStack) {
    await MenuItem.create(loadedStack);
    summary.itemsCreated += 1;
  } else {
    const result = await MenuItem.updateOne(
      { id: loadedStack.id },
      {
        $set: {
          name: loadedStack.name,
          categoryId: loadedStack.categoryId,
          subcategory: loadedStack.subcategory,
          subCategoryName: loadedStack.subCategoryName,
          subCategoryId: loadedStack.subCategoryId,
          image: loadedStack.image,
          isDeleted: false,
          deletedAt: null
        }
      },
      { runValidators: true }
    );
    summary.itemsRepaired += result.modifiedCount || 0;
  }

  return summary;
}

async function syncSeedMenuImages(menuItemsToSeed = []) {
  const seedItemsByIdentity = new Map();

  for (const item of menuItemsToSeed) {
    const cleanItem = validateMenuItem(item);
    const subcategory = getMenuItemSyncSubcategory(cleanItem);
    if (!cleanItem.name || !cleanItem.categoryId || !subcategory || !cleanItem.image) continue;
    const key = `${cleanItem.name}\n${cleanItem.categoryId}\n${subcategory}`;
    if (!seedItemsByIdentity.has(key)) seedItemsByIdentity.set(key, { ...cleanItem, subcategory });
  }

  const candidates = Array.from(seedItemsByIdentity.values());
  let updated = 0;

  for (const seedItem of candidates) {
    const matchFilter = {
      name: seedItem.name,
      categoryId: seedItem.categoryId,
      $or: [
        { subcategory: seedItem.subcategory },
        { subCategoryName: seedItem.subcategory },
        { subCategoryId: seedItem.subCategoryId }
      ]
    };
    const existing = await MenuItem.findOne(matchFilter, { _id: 1, image: 1, name: 1 }).lean();
    if (!existing || !shouldSyncSeedMenuImage(existing.image, seedItem.image)) continue;
    await MenuItem.findByIdAndUpdate(existing._id, { $set: { image: seedItem.image } }, { new: true, runValidators: true }).lean();
    updated += 1;
  }

  if (updated > 0) {
    console.log(`[Menu Image Sync] Updated ${updated} existing menu item image path${updated === 1 ? "" : "s"}.`);
  }
}

export async function seedDatabase() {
  const persistedMemory = loadPersistedMemory();
  const categoryCount = await Category.countDocuments();
  const itemCount = await MenuItem.countDocuments();
  const rawMaterialCount = await RawMaterial.countDocuments();
  const recipeCount = await Recipe.countDocuments();

  const categoriesToSeed = Array.isArray(persistedMemory.categories) && persistedMemory.categories.length ? persistedMemory.categories : seedCategories;
  const menuItemsToSeed = Array.isArray(persistedMemory.menuItems) && persistedMemory.menuItems.length ? persistedMemory.menuItems : seedItems;

  const outletIds = usingMongo()
    ? (await Outlet.find({}, { _id: 1 }).lean()).map((outlet) => normalizeOutletId(outlet)).filter(Boolean)
    : (memory.outlets || []).map((outlet) => normalizeOutletId(outlet)).filter(Boolean);

  for (const category of categoriesToSeed) {
    const cleanCategory = {
      ...category,
      id: category.id,
      name: category.name,
      icon: category.icon || "Utensils",
      sortOrder: Number(category.sortOrder || 0),
      isDeleted: Boolean(category.isDeleted),
      deletedAt: category.isDeleted ? category.deletedAt || new Date() : null
    };
    const sharedCategory = await Category.findOneAndUpdate(
      { id: cleanCategory.id },
      { ...cleanCategory, outletId: null },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    ).lean();
    if (sharedCategory) {
      await Category.deleteMany({ id: cleanCategory.id, _id: { $ne: sharedCategory._id } });
    }
  }

  for (const item of menuItemsToSeed) {
    const cleanItem = validateMenuItem(item);
    for (const outletId of outletIds) {
      await MenuItem.findOneAndUpdate(
        {
          id: cleanItem.id,
          $or: [
            { outletId },
            { outletId: null },
            { outletId: { $exists: false } }
          ]
        },
        {
          $setOnInsert: { ...cleanItem, outletId }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );
    }
  }

  await MenuItem.updateMany({ $or: [{ active: { $exists: false } }, { active: null }] }, { $set: { active: true } });
  await syncSeedMenuImages(menuItemsToSeed);
  const menuRepairSummary = await repairMenuData();
  if (menuRepairSummary.duplicatesRemoved || menuRepairSummary.itemsRepaired || menuRepairSummary.itemsCreated) {
    console.log(`[Menu Repair] ${JSON.stringify(menuRepairSummary)}`);
  }

  if (itemCount === 0) {
    await MenuItem.updateOne(
      { id: "kit-kat-shake" },
      { $set: { image: "/assets/images/Cold Drinks/Milk Shakes/Kit-Kat Shake.jpg" } }
    );
    await MenuItem.updateOne(
      { id: "paneer-tikka-melt" },
      { $set: { image: "/assets/images/Snacks/Sandwich/Paneer Tikka Melt.jpg" } }
    );
  }

  await RawMaterial.deleteMany({ $or: [{ id: "paper-cup" }, { name: /^Paper Cup$/i }] });
  await Recipe.updateMany(
    { "ingredients.rawMaterialId": { $regex: /^paper[- ]?cup$/i } },
    { $pull: { ingredients: { rawMaterialId: { $regex: /^paper[- ]?cup$/i } } } }
  );

  const existingRawMaterials = await RawMaterial.find({}, { id: 1, name: 1, _id: 1 }).lean();
  const existingIds = new Set(existingRawMaterials.map((item) => String(item.id || "").trim().toLowerCase()));
  const existingNames = new Set(existingRawMaterials.map((item) => String(item.name || "").trim().toLowerCase()));
  const existingRecipes = await Recipe.find({}, { id: 1, itemId: 1, _id: 1 }).lean();
  const existingRecipeKeys = new Set(existingRecipes.flatMap((item) => [String(item.id || "").trim().toLowerCase(), String(item.itemId || "").trim().toLowerCase()]));

  const materialsToInsert = seedRawMaterials.filter((item) => {
    const normalizedId = String(item.id || "").trim().toLowerCase();
    const normalizedName = String(item.name || "").trim().toLowerCase();
    return !(existingIds.has(normalizedId) || existingNames.has(normalizedName));
  }).map((item) => ({
    ...item,
    id: String(item.id || item.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: String(item.name || "").trim(),
    category: String(item.category || "Inventory").trim(),
    unit: ["g", "ml", "pcs"].includes(item.unit) ? item.unit : "pcs",
    stock: Number(item.stock || 0),
    minStock: Number(item.minStock || 0),
    costPerUnit: Number(item.costPerUnit || 0),
    active: item.active !== false
  }));

  if (materialsToInsert.length > 0) {
    await RawMaterial.insertMany(materialsToInsert);
  }

  await RawMaterial.updateMany({ $or: [{ active: { $exists: false } }, { active: null }] }, { $set: { active: true } });

  const availableRawMaterials = await RawMaterial.find({}, { id: 1, name: 1 }).lean();
  const recipesToInsert = seedRecipes.filter((item) => {
    const normalizedId = String(item.id || "").trim().toLowerCase();
    const normalizedItemId = String(item.itemId || "").trim().toLowerCase();
    return !(existingRecipeKeys.has(normalizedId) || existingRecipeKeys.has(normalizedItemId));
  }).map((item) => {
    const { ingredients, skipped } = normalizeRecipeIngredients(item.ingredients || [], availableRawMaterials);
    if (skipped.length > 0) {
      console.warn(`Skipped unresolved recipe ingredients for ${item.itemId || item.id}:`, skipped);
    }
    return {
      ...item,
      id: String(item.id || item.itemId || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      itemId: String(item.itemId || "").trim(),
      ingredients
    };
  });

  if (recipesToInsert.length > 0) {
    await Recipe.insertMany(recipesToInsert);
    console.log(`[Recipe Sync] Auto-synced ${recipesToInsert.length} default recipes into database.`);
  }
  
  const totalRecipes = await Recipe.countDocuments();
  console.log(`[Recipe Sync] Total recipes in database: ${totalRecipes} (${recipeCount} existing, ${recipesToInsert.length} newly synced)`);
}

export const store = {
  async outlets(query = {}) {
    const includeInactive = query.includeInactive === true || query.includeInactive === "true";
    if (usingMongo()) {
      const filter = includeInactive ? {} : { isActive: { $ne: false } };
      return Outlet.find(filter).sort({ name: 1 }).lean();
    }
    return [...(memory.outlets || [])]
      .filter((outlet) => (includeInactive ? true : outlet.isActive !== false))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  },
  async outletBySlug(slug) {
    const cleanSlug = slugifyOutlet(slug);
    if (!cleanSlug) return null;
    if (usingMongo()) return Outlet.findOne({ slug: cleanSlug }).lean();
    return (memory.outlets || []).find((outlet) => outlet.slug === cleanSlug) || null;
  },
  async outletById(id) {
    const cleanId = String(id || "").trim();
    if (!cleanId) return null;
    if (usingMongo()) {
      if (mongoose.Types.ObjectId.isValid(cleanId)) {
        const outlet = await Outlet.findById(cleanId).lean();
        if (outlet) return outlet;
      }
      return Outlet.findOne({ $or: [{ id: cleanId }, { slug: cleanId }] }).lean();
    }
    return (memory.outlets || []).find((outlet) => String(outlet._id || outlet.id || "") === cleanId || outlet.slug === cleanId) || null;
  },
  async createOutlet(payload) {
    const clean = normalizeOutletPayload(payload);
    if (usingMongo()) return Outlet.create(clean);

    memory.outlets = memory.outlets || [];
    if (memory.outlets.some((outlet) => outlet.slug === clean.slug)) {
      throw new Error("Outlet slug must be unique.");
    }
    const now = new Date().toISOString();
    const saved = { ...clean, id: `outlet-${Date.now()}`, createdAt: now, updatedAt: now };
    memory.outlets.push(saved);
    savePersistedMemory(memory);
    return saved;
  },
  async updateOutlet(id, payload) {
    const existing = await this.outletById(id);
    if (!existing) return null;
    const clean = normalizeOutletPayload(payload, existing);

    if (usingMongo()) {
      return Outlet.findByIdAndUpdate(existing._id, { $set: clean }, { new: true, runValidators: true }).lean();
    }

    memory.outlets = memory.outlets || [];
    const duplicate = memory.outlets.find((outlet) => outlet.slug === clean.slug && String(outlet.id || outlet._id || "") !== String(existing.id || existing._id || ""));
    if (duplicate) throw new Error("Outlet slug must be unique.");
    const index = memory.outlets.findIndex((outlet) => String(outlet.id || outlet._id || "") === String(existing.id || existing._id || ""));
    if (index < 0) return null;
    memory.outlets[index] = { ...existing, ...clean, updatedAt: new Date().toISOString() };
    savePersistedMemory(memory);
    return memory.outlets[index];
  },
  async deleteOutlet(id) {
    const cleanId = String(id || "").trim();
    if (!cleanId) return { deletedCount: 0 };
    if (usingMongo()) {
      let outletDoc = null;
      if (mongoose.Types.ObjectId.isValid(cleanId)) {
        outletDoc = await Outlet.findByIdAndUpdate(cleanId, { $set: { isActive: false } }, { new: true }).lean();
      }
      if (!outletDoc) {
        outletDoc = await Outlet.findOneAndUpdate({ $or: [{ id: cleanId }, { slug: cleanId }] }, { $set: { isActive: false } }, { new: true }).lean();
      }
      return { deletedCount: outletDoc ? 1 : 0, outlet: outletDoc };
    }
    memory.outlets = memory.outlets || [];
    const index = memory.outlets.findIndex((outlet) => String(outlet.id || outlet._id || "") === cleanId);
    if (index < 0) return { deletedCount: 0 };
    memory.outlets[index] = { ...memory.outlets[index], isActive: false, updatedAt: new Date().toISOString() };
    savePersistedMemory(memory);
    return { deletedCount: 1, outlet: memory.outlets[index] };
  },
  async categories(query = {}) {
    const outletId = await resolveCollectionOutletScope("categories", query);
    const filter = { isDeleted: { $ne: true }, ...(outletId ? { outletId } : {}) };
    if (usingMongo()) {
      const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
      return deduplicateSharedRecords(categories).sort((a, b) => a.sortOrder - b.sortOrder || String(a.name || "").localeCompare(String(b.name || "")));
    }
    return deduplicateSharedRecords(
      [...memory.categories].filter((item) => item.isDeleted !== true && matchesOutlet(item, outletId))
    ).sort((a, b) => a.sortOrder - b.sortOrder || String(a.name || "").localeCompare(String(b.name || "")));
  },
  async deletedCategories(query = {}) {
    const outletId = await resolveCollectionOutletScope("categories", query);
    const filter = { isDeleted: true, ...(outletId ? { outletId } : {}) };
    if (usingMongo()) {
      const categories = await Category.find(filter).sort({ deletedAt: -1, sortOrder: 1, name: 1 }).lean();
      return deduplicateSharedRecords(categories).sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0) || a.sortOrder - b.sortOrder || String(a.name || "").localeCompare(String(b.name || "")));
    }
    return deduplicateSharedRecords(
      [...memory.categories].filter((item) => item.isDeleted === true && matchesOutlet(item, outletId))
    ).sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0) || a.sortOrder - b.sortOrder || String(a.name || "").localeCompare(String(b.name || "")));
  },
  async upsertCategory(payload) {
    const name = String(payload.name || "").trim();
    const id = String(payload.id || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!name) throw new Error("Category name is required.");
    const clean = {
      id,
      name,
      icon: payload.icon || "Utensils",
      sortOrder: Number(payload.sortOrder || 0),
      isDeleted: payload.isDeleted === true,
      deletedAt: payload.isDeleted ? payload.deletedAt || new Date() : null
    };

    if (usingMongo()) {
      const saved = await Category.findOneAndUpdate(
        { id: clean.id },
        { ...clean, outletId: null },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      ).lean();
      await Category.deleteMany({ id: clean.id, _id: { $ne: saved._id } });
      savePersistedMemory(memory);
      return saved;
    }

    const index = memory.categories.findIndex((item) => item.id === clean.id);
    if (index >= 0) memory.categories[index] = { ...memory.categories[index], ...clean };
    else memory.categories.push(clean);
    savePersistedMemory(memory);
    return clean;
  },
  async deleteCategory(id, query = {}) {
    const outletId = await resolveCollectionOutletScope("categories", query);
    const deletedAt = new Date();
    if (usingMongo()) {
      const filter = { id, ...(outletId ? { outletId } : {}) };
      await Category.updateMany(filter, { $set: { isDeleted: true, deletedAt } }, { runValidators: true });
      return Category.findOne({ id, ...(outletId ? { outletId } : { outletId: null }) }).lean();
    }
    const index = memory.categories.findIndex((item) => item.id === id && matchesOutlet(item, outletId));
    if (index < 0) return null;
    memory.categories[index] = { ...memory.categories[index], isDeleted: true, deletedAt: deletedAt.toISOString() };
    savePersistedMemory(memory);
    return memory.categories[index];
  },
  async restoreCategory(id, query = {}) {
    const outletId = await resolveCollectionOutletScope("categories", query);
    if (usingMongo()) {
      const filter = { id, ...(outletId ? { outletId } : {}) };
      await Category.updateMany(filter, { $set: { isDeleted: false, deletedAt: null } }, { runValidators: true });
      return Category.findOne({ id, ...(outletId ? { outletId } : { outletId: null }) }).lean();
    }
    const index = memory.categories.findIndex((item) => item.id === id && matchesOutlet(item, outletId));
    if (index < 0) return null;
    memory.categories[index] = { ...memory.categories[index], isDeleted: false, deletedAt: null };
    savePersistedMemory(memory);
    return memory.categories[index];
  },
  async permanentlyDeleteCategory(id, query = {}) {
    const outletId = await resolveCollectionOutletScope("categories", query);
    if (usingMongo()) return Category.deleteMany({ id, ...(outletId ? { outletId } : {}) });
    const originalLength = memory.categories.length;
    memory.categories = memory.categories.filter((item) => item.id !== id || !matchesOutlet(item, outletId));
    if (memory.categories.length !== originalLength) savePersistedMemory(memory);
    return { deletedCount: originalLength - memory.categories.length };
  },
  async menuItems(query = {}) {
    const outletId = await resolveCollectionOutletScope("menuitems", query);
    const filter = { ...(outletId ? { outletId } : {}) };
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.search) filter.name = { $regex: query.search, $options: "i" };
    if (!query.includeInactive) {
      filter.active = { $ne: false };
      filter.isActive = { $ne: false };
    }
    if (!query.includeDeleted) filter.isDeleted = { $ne: true };
    if (usingMongo()) {
      const categoryFilter = query.includeDeleted ? {} : { isDeleted: { $ne: true } };
      const visibleCategoryIds = await Category.find(categoryFilter).distinct("id");
      if (!query.includeDeleted) {
        if (query.categoryId && !visibleCategoryIds.includes(query.categoryId)) return [];
        filter.categoryId = query.categoryId ? query.categoryId : { $in: visibleCategoryIds };
      }
      return MenuItem.find(filter).sort({ name: 1 }).lean();
    }
    const filteredCategories = memory.categories.filter((category) => matchesOutlet(category, outletId) && (query.includeDeleted ? true : category.isDeleted !== true));
    const visibleCategoryIds = filteredCategories.map((category) => category.id);
    return memory.menuItems
      .filter((item) => matchesOutlet(item, outletId))
      .filter((item) => (query.includeInactive ? true : item.active !== false && item.isActive !== false))
      .filter((item) => (query.includeDeleted ? true : item.isDeleted !== true))
      .filter((item) => (query.includeDeleted ? true : visibleCategoryIds.includes(item.categoryId)))
      .filter((item) => (!query.categoryId ? true : item.categoryId === query.categoryId))
      .filter((item) => (!query.search ? true : item.name.toLowerCase().includes(query.search.toLowerCase())))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  async menuItem(id, query = {}) {
    const outletId = await resolveCollectionOutletScope("menuitems", query);
    const filter = { ...buildMenuItemLookup(id), ...(outletId ? { outletId } : {}) };
    if (usingMongo()) {
      return MenuItem.findOne(filter).lean();
    }
    return memory.menuItems.find((item) => (item.id === id || String(item._id || "") === String(id)) && matchesOutlet(item, outletId));
  },
  async deletedMenuItems(query = {}) {
    const outletId = await resolveCollectionOutletScope("menuitems", query);
    if (usingMongo()) return MenuItem.find({ isDeleted: true, ...(outletId ? { outletId } : {}) }).sort({ deletedAt: -1, name: 1 }).lean();
    return [...memory.menuItems]
      .filter((item) => item.isDeleted === true && matchesOutlet(item, outletId))
      .sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));
  },
  async upsertMenuItem(payload) {
    const clean = validateMenuItem(payload);
    const targetOutletIds = await getTargetOutletIds(payload);
    if (!targetOutletIds.length) throw new Error("Invalid or missing outletId.");
    const results = [];

    for (const outletId of targetOutletIds) {
      const record = { ...clean, outletId };
      if (usingMongo()) {
        const saved = await MenuItem.findOneAndUpdate(
          { id: record.id, outletId },
          record,
          { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
        ).lean();
        results.push(saved);
        continue;
      }

      const index = memory.menuItems.findIndex((item) => item.id === record.id && matchesOutlet(item, outletId));
      if (index >= 0) memory.menuItems[index] = record;
      else memory.menuItems.push(record);
      results.push(record);
    }

    savePersistedMemory(memory);
    return results.length === 1 ? results[0] : results;
  },
  async updateMenuItem(id, payload, query = {}) {
    const outletIds = await getTargetOutletIds(query);
    const results = [];
    for (const outletId of outletIds) {
      console.log('[Debug:updateMenuItem] id=', id);
      console.log('[Debug:updateMenuItem] payload=', JSON.stringify(payload || {}));
      console.log('[Debug:updateMenuItem] query=', JSON.stringify(query || {}));
      console.log('[Debug:updateMenuItem] resolved outletId=', outletId);
      if (usingMongo()) {
        const existing = await this.menuItem(id, { ...query, outletId });
        console.log('[Debug:updateMenuItem] existing menuItem=', JSON.stringify(existing));
        if (!existing) continue;
        const nextPayload = { ...existing, ...payload, id: payload.id || existing.id };
        if (Object.prototype.hasOwnProperty.call(payload, "price") && !Object.prototype.hasOwnProperty.call(payload, "sizes")) {
          const price = Number(payload.price);
          if (!Number.isFinite(price)) throw new Error("Price must be a valid number.");
          const existingSizes = Array.isArray(existing.sizes) ? existing.sizes : [];
          nextPayload.sizes = existingSizes.map((size, index) => (index === 0 ? { ...size, price } : size));
        }
        const clean = validateMenuItem(nextPayload);
        const filter = { ...buildMenuItemLookup(id), outletId };
        console.log('[Debug:updateMenuItem] MongoDB filter=', JSON.stringify(filter));
        const updated = await MenuItem.findOneAndUpdate(
          filter,
          { $set: clean },
          { new: true, runValidators: true }
        ).lean();
        console.log('[Debug:updateMenuItem] MongoDB returned=', JSON.stringify(updated));
        if (updated) results.push(updated);
        continue;
      }

      const index = memory.menuItems.findIndex((item) => (item.id === id || String(item._id || "") === String(id)) && matchesOutlet(item, outletId));
      if (index < 0) continue;
      const nextPayload = { ...memory.menuItems[index], ...payload, id: payload.id || memory.menuItems[index].id };
      if (Object.prototype.hasOwnProperty.call(payload, "price") && !Object.prototype.hasOwnProperty.call(payload, "sizes")) {
        const price = Number(payload.price);
        if (!Number.isFinite(price)) throw new Error("Price must be a valid number.");
        const existingSizes = Array.isArray(memory.menuItems[index].sizes) ? memory.menuItems[index].sizes : [];
        nextPayload.sizes = existingSizes.map((size, sizeIndex) => (sizeIndex === 0 ? { ...size, price } : size));
      }
      const clean = validateMenuItem(nextPayload);
      memory.menuItems[index] = clean;
      results.push(clean);
    }

    if (!results.length) return null;
    savePersistedMemory(memory);
    return results.length === 1 ? results[0] : results;
  },
  async setMenuItemActive(id, active, query = {}) {
    const nextActive = active !== false;
    const outletIds = await getTargetOutletIds(query);
    const results = [];
    for (const outletId of outletIds) {
      if (usingMongo()) {
        const updated = await MenuItem.findOneAndUpdate(
          { ...buildMenuItemLookup(id), ...(outletId ? { outletId } : {}) },
          { $set: { active: nextActive, isActive: nextActive, isDeleted: false, deletedAt: null } },
          { new: true, runValidators: true }
        ).lean();
        if (updated) results.push(updated);
        continue;
      }
      const index = memory.menuItems.findIndex((item) => (item.id === id || String(item._id || "") === String(id)) && matchesOutlet(item, outletId));
      if (index < 0) continue;
      memory.menuItems[index] = { ...memory.menuItems[index], active: nextActive, isActive: nextActive, isDeleted: false, deletedAt: null };
      results.push(memory.menuItems[index]);
    }
    if (!results.length) return null;
    savePersistedMemory(memory);
    return results.length === 1 ? results[0] : results;
  },
  async deleteMenuItem(id, query = {}) {
    const outletId = await resolveCollectionOutletScope("menuitems", query);
    const deletedAt = new Date();
    if (usingMongo()) {
      const filter = { ...buildMenuItemLookup(id), ...(outletId ? { outletId } : {}) };
      return MenuItem.findOneAndUpdate(filter, { $set: { isDeleted: true, deletedAt } }, { new: true, runValidators: true }).lean();
    }
    const index = memory.menuItems.findIndex((item) => (item.id === id || String(item._id || "") === String(id)) && matchesOutlet(item, outletId));
    if (index < 0) return null;
    memory.menuItems[index] = { ...memory.menuItems[index], isDeleted: true, deletedAt: deletedAt.toISOString() };
    savePersistedMemory(memory);
    return memory.menuItems[index];
  },
  async restoreMenuItem(id, query = {}) {
    const outletId = await resolveCollectionOutletScope("menuitems", query);
    if (usingMongo()) {
      const filter = { ...buildMenuItemLookup(id), ...(outletId ? { outletId } : {}) };
      return MenuItem.findOneAndUpdate(filter, { $set: { isDeleted: false, deletedAt: null } }, { new: true, runValidators: true }).lean();
    }
    const index = memory.menuItems.findIndex((item) => (item.id === id || String(item._id || "") === String(id)) && matchesOutlet(item, outletId));
    if (index < 0) return null;
    memory.menuItems[index] = { ...memory.menuItems[index], isDeleted: false, deletedAt: null };
    savePersistedMemory(memory);
    return memory.menuItems[index];
  },
  async permanentlyDeleteMenuItem(id, query = {}) {
    const outletId = await resolveCollectionOutletScope("menuitems", query);
    if (usingMongo()) return MenuItem.deleteOne({ ...buildMenuItemLookup(id), ...(outletId ? { outletId } : {}) });
    const originalLength = memory.menuItems.length;
    memory.menuItems = memory.menuItems.filter((item) => {
      const matchesId = item.id === id || String(item._id || "") === String(id);
      return matchesId ? !matchesOutlet(item, outletId) : true;
    });
    if (memory.menuItems.length !== originalLength) savePersistedMemory(memory);
    return { deletedCount: originalLength - memory.menuItems.length };
  },
  async rawMaterials(query = {}) {
    const outletId = await resolveCollectionOutletScope("inventory", query);
    const outletFilter = outletId ? { outletId } : {};
    if (usingMongo()) {
      const deletedFilter = query.includeDeleted ? {} : { isDeleted: { $ne: true } };
      const filter = outletId ? { $and: [deletedFilter, outletFilter, { $nor: [{ id: "paper-cup" }, { name: /^Paper Cup$/i }] }] } : { $and: [deletedFilter, { $nor: [{ id: "paper-cup" }, { name: /^Paper Cup$/i }] }] };
      const results = await RawMaterial.find(filter).sort({ category: 1, name: 1 }).lean();
      return deduplicateSharedRecords(results).filter((item) => !isHiddenInventoryItem(item));
    }
    return deduplicateSharedRecords(
      [...memory.rawMaterials]
        .filter((item) => matchesOutlet(item, outletId))
        .filter((item) => (query.includeDeleted ? true : !isDeletedInventoryItem(item)) && !isHiddenInventoryItem(item))
    ).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  },
  async rawMaterial(id, query = {}) {
    const outletId = await resolveCollectionOutletScope("inventory", query);
    const filter = { id, isDeleted: { $ne: true }, $nor: [{ id: "paper-cup" }, { name: /^Paper Cup$/i }] };
    if (outletId) filter.outletId = outletId;
    if (usingMongo()) return findRawMaterialById(id, outletId, { isDeleted: { $ne: true }, $nor: [{ id: "paper-cup" }, { name: /^Paper Cup$/i }] });
    return memory.rawMaterials.find((item) => item.id === id && matchesOutlet(item, outletId) && !isDeletedInventoryItem(item) && !isHiddenInventoryItem(item));
  },
  async upsertRawMaterial(payload) {
    const outletId = await resolveCollectionOutletScope("inventory", payload);
    const stockValue = Number(payload.stock ?? payload.quantity ?? 0);
    const minStockValue = Number(payload.minStock ?? payload.minimumStock ?? 0);
    const costValue = Number(payload.costPerUnit ?? payload.purchasePrice ?? payload.price ?? 0);
    const clean = {
      id: String(payload.id || payload.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: String(payload.name || "").trim(),
      category: String(payload.category || "Inventory").trim(),
      unit: ["g", "ml", "pcs"].includes(payload.unit) ? payload.unit : "pcs",
      stock: Number.isFinite(stockValue) ? stockValue : 0,
      minStock: Number.isFinite(minStockValue) ? minStockValue : 0,
      costPerUnit: Number.isFinite(costValue) ? costValue : 0,
      active: payload.active !== false,
      isDeleted: payload.isDeleted === true,
      deletedAt: payload.isDeleted ? payload.deletedAt || new Date() : null
    };
    if (outletId) clean.outletId = outletId;
    if (!clean.name) throw new Error("Inventory item name is required.");
    if (!["g", "ml", "pcs"].includes(clean.unit)) throw new Error("Inventory unit must be g, ml, or pcs.");
    if (usingMongo()) {
      const existing = await findRawMaterialById(clean.id, outletId);
      if (existing) {
        clean.id = existing.id;
        const { outletId: _outletId, ...updateFields } = clean;
        return RawMaterial.findOneAndUpdate({ _id: existing._id }, { $set: updateFields }, { new: true, runValidators: true }).lean();
      }
      if (clean.costPerUnit <= 0) throw new Error("Purchase price is required.");
      const filter = { id: clean.id };
      if (outletId) filter.outletId = outletId;
      return RawMaterial.findOneAndUpdate(filter, { $set: clean }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }).lean();
    }
    if (clean.costPerUnit <= 0) throw new Error("Purchase price is required.");
    const index = memory.rawMaterials.findIndex((item) => item.id === clean.id && matchesOutlet(item, outletId));
    if (index >= 0) memory.rawMaterials[index] = clean;
    else memory.rawMaterials.push(clean);
    savePersistedMemory(memory);
    return clean;
  },
  async deleteRawMaterial(id, query = {}) {
    const outletId = await resolveCollectionOutletScope("inventory", query);
    if (usingMongo()) {
      const existing = await findRawMaterialById(id, outletId);
      if (!existing) return null;
      return RawMaterial.findOneAndUpdate(
        { _id: existing._id },
        { isDeleted: true, deletedAt: new Date() },
        { new: true, runValidators: true }
      ).lean();
    }
    const index = memory.rawMaterials.findIndex((item) => item.id === id && matchesOutlet(item, outletId));
    if (index >= 0) {
      memory.rawMaterials[index] = {
        ...memory.rawMaterials[index],
        isDeleted: true,
        deletedAt: new Date().toISOString()
      };
      savePersistedMemory(memory);
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  },
  async restoreRawMaterial(id, query = {}) {
    const outletId = await resolveCollectionOutletScope("inventory", query);
    if (usingMongo()) {
      const existing = await findRawMaterialById(id, outletId);
      if (!existing) return null;
      return RawMaterial.findOneAndUpdate(
        { _id: existing._id },
        { $set: { isDeleted: false, deletedAt: null } },
        { new: true, runValidators: true }
      ).lean();
    }
    const index = memory.rawMaterials.findIndex((item) => item.id === id && matchesOutlet(item, outletId));
    if (index < 0) return null;
    memory.rawMaterials[index] = { ...memory.rawMaterials[index], isDeleted: false, deletedAt: null };
    savePersistedMemory(memory);
    return memory.rawMaterials[index];
  },
  async adjustRawMaterialStock(id, change, note, orderId, query = {}, purchasePrice = null) {
    const resolvedOutletId =
      typeof query === "string" || query instanceof mongoose.Types.ObjectId || query?._id || query?.id
        ? normalizeOutletId(query)
        : await getCurrentOutletId(query);
    return adjustRawMaterialStock(id, change, note, orderId, resolvedOutletId, purchasePrice);
  },
  async recipes(query = {}) {
    const outletId = await resolveCollectionOutletScope("recipes", query);
    const filter = outletId ? { outletId } : {};
    if (usingMongo()) {
      const [recipes, rawMaterials] = await Promise.all([
        Recipe.find(filter).sort({ itemId: 1 }).lean(),
        RawMaterial.find({ ...filter, $nor: [{ id: "paper-cup" }, { name: /^Paper Cup$/i }] }, { id: 1, name: 1 }).lean()
      ]);
      return recipes
        .map((recipe) => {
          const { ingredients, skipped } = normalizeRecipeIngredients(recipe.ingredients || [], rawMaterials);
          if (skipped.length > 0) console.warn(`Normalized recipe ingredients for ${recipe.itemId || recipe.id}:`, skipped);
          return { ...recipe, ingredients };
        })
        .sort((a, b) => a.itemId.localeCompare(b.itemId));
    }
    const rawMaterials = memory.rawMaterials.filter((item) => matchesOutlet(item, outletId));
    return [...memory.recipes]
      .filter((recipe) => matchesOutlet(recipe, outletId))
      .map((recipe) => {
        const { ingredients, skipped } = normalizeRecipeIngredients(recipe.ingredients || [], rawMaterials);
        if (skipped.length > 0) console.warn(`Normalized recipe ingredients for ${recipe.itemId || recipe.id}:`, skipped);
        return { ...recipe, ingredients };
      })
      .sort((a, b) => a.itemId.localeCompare(b.itemId));
  },
  async recipeByItem(itemId, query = {}) {
    const outletId = await resolveCollectionOutletScope("recipes", query);
    const filter = { itemId };
    if (outletId) filter.outletId = outletId;
    const matFilter = outletId ? { outletId } : {};
    if (usingMongo()) {
      const [recipe, rawMaterials] = await Promise.all([
        Recipe.findOne(filter).lean(),
        RawMaterial.find({ ...matFilter, $nor: [{ id: "paper-cup" }, { name: /^Paper Cup$/i }] }, { id: 1, name: 1 }).lean()
      ]);
      if (!recipe) return null;
      const { ingredients, skipped } = normalizeRecipeIngredients(recipe.ingredients || [], rawMaterials);
      if (skipped.length > 0) console.warn(`Normalized recipe ingredients for ${recipe.itemId || recipe.id}:`, skipped);
      return { ...recipe, ingredients };
    }
    const recipe = memory.recipes.find((item) => item.itemId === itemId && matchesOutlet(item, outletId));
    if (!recipe) return null;
    const rawMaterials = memory.rawMaterials.filter((item) => matchesOutlet(item, outletId));
    const { ingredients, skipped } = normalizeRecipeIngredients(recipe.ingredients || [], rawMaterials);
    return { ...recipe, ingredients };
  },
  async upsertRecipe(payload) {
    const outletId = await resolveCollectionOutletScope("recipes", payload);
    const rawMaterials = usingMongo()
      ? await RawMaterial.find({ outletId, $nor: [{ id: "paper-cup" }, { name: /^Paper Cup$/i }] }, { id: 1, name: 1 }).lean()
      : memory.rawMaterials.filter((item) => matchesOutlet(item, outletId));
    const { ingredients, skipped } = normalizeRecipeIngredients(payload.ingredients || [], rawMaterials);
    if (skipped.length > 0) {
      console.warn(`Skipped unresolved recipe ingredients for ${payload.itemId || payload.id}:`, skipped);
    }
    const clean = {
      id: String(payload.id || payload.itemId).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      itemId: String(payload.itemId || "").trim(),
      ingredients
    };
    if (outletId) clean.outletId = outletId;
    if (usingMongo()) {
      const filter = { id: clean.id };
      if (outletId) filter.outletId = outletId;
      return Recipe.findOneAndUpdate(filter, clean, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }).lean();
    }
    const index = memory.recipes.findIndex((item) => item.id === clean.id && matchesOutlet(item, outletId));
    if (index >= 0) memory.recipes[index] = clean;
    else memory.recipes.push(clean);
    savePersistedMemory(memory);
    return clean;
  },
  async deleteRecipe(id, query = {}) {
    const outletId = await resolveCollectionOutletScope("recipes", query);
    if (usingMongo()) {
      const filter = { id };
      if (outletId) filter.outletId = outletId;
      return Recipe.deleteOne(filter);
    }
    memory.recipes = memory.recipes.filter((item) => item.id !== id || !matchesOutlet(item, outletId));
    savePersistedMemory(memory);
    return { deletedCount: 1 };
  },
  async syncDefaultRecipes(defaultRecipes, query = {}) {
    const results = { created: 0, skipped: 0, failed: 0, errors: [] };
    const outletId = await resolveCollectionOutletScope("recipes", query);
    
    try {
      // Get existing recipe keys for comparison
      const existingRecipes = usingMongo()
        ? await Recipe.find({ outletId }, { id: 1, itemId: 1, _id: 1 }).lean()
        : memory.recipes.filter((item) => matchesOutlet(item, outletId));
      const existingRecipeKeys = new Set(existingRecipes.flatMap((item) => [
        String(item.id || "").trim().toLowerCase(),
        String(item.itemId || "").trim().toLowerCase()
      ]));
      
      // Get available raw materials for ingredient normalization
      const availableRawMaterials = usingMongo()
        ? await RawMaterial.find({ outletId }, { id: 1, name: 1 }).lean()
        : memory.rawMaterials.filter((item) => matchesOutlet(item, outletId));
      
      for (const defaultRecipe of defaultRecipes) {
        try {
          const normalizedId = String(defaultRecipe.id || "").trim().toLowerCase();
          const normalizedItemId = String(defaultRecipe.itemId || "").trim().toLowerCase();
          
          // Skip if recipe already exists
          if (existingRecipeKeys.has(normalizedId) || existingRecipeKeys.has(normalizedItemId)) {
            results.skipped++;
            continue;
          }
          
          // Normalize ingredients
          const { ingredients, skipped } = normalizeRecipeIngredients(defaultRecipe.ingredients || [], availableRawMaterials);
          if (skipped.length > 0) {
            console.warn(`[Recipe Manual Sync] Skipped unresolved ingredients for ${defaultRecipe.itemId || defaultRecipe.id}:`, skipped);
          }
          
          const cleanRecipe = {
            id: String(defaultRecipe.id || defaultRecipe.itemId || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            itemId: String(defaultRecipe.itemId || "").trim(),
            ingredients
          };
          if (outletId) cleanRecipe.outletId = outletId;
          
          if (usingMongo()) {
            await Recipe.create(cleanRecipe);
          } else {
            memory.recipes.push(cleanRecipe);
            savePersistedMemory(memory);
          }
          
          results.created++;
          console.log(`[Recipe Manual Sync] Created recipe: ${cleanRecipe.itemId || cleanRecipe.id}`);
        } catch (error) {
          results.failed++;
          results.errors.push({ recipeId: defaultRecipe.id, error: error.message });
          console.error(`[Recipe Manual Sync] Failed to sync recipe ${defaultRecipe.id}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`[Recipe Manual Sync] Fatal error:`, error.message);
    }
    
    console.log(`[Recipe Manual Sync] Complete: ${results.created} created, ${results.skipped} skipped, ${results.failed} failed`);
    return results;
  },
  async inventoryHistory(query = {}) {
    const outletId = await resolveCollectionOutletScope("inventoryHistory", query);
    const filter = outletId ? { outletId } : {};
    if (usingMongo()) return InventoryHistory.find(filter).sort({ createdAt: -1 }).lean();
    return [...memory.inventoryHistory].filter((item) => matchesOutlet(item, outletId)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async orders(query = {}) {
    const outletId = await getCurrentOutletId(query);
    const requestedLimit = Number(query?.limit ?? 100);
    const safeLimit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 500) : 100;
    const rawStatuses = Array.isArray(query?.statuses)
      ? query.statuses
      : typeof query?.status === "string"
        ? query.status.split(",")
        : [];
    const statuses = Array.from(new Set(rawStatuses.map((value) => normalizeSalesStatus(value)).filter(Boolean)));

    const filter = {};
    if (outletId) filter.outletId = outletId;
    if (statuses.length > 0) {
      filter.$or = [
        { status: { $in: statuses } },
        { paymentStatus: { $in: statuses } }
      ];
    }

    if (usingMongo()) {
      return Order.find(filter).sort({ createdAt: -1 }).limit(safeLimit).lean({ virtuals: true });
    }

    const records = [...memory.orders]
      .filter((order) => {
        if (!matchesOutlet(order, outletId)) return false;
        if (!statuses.length) return true;
        const status = normalizeSalesStatus(order?.status);
        const paymentStatus = normalizeSalesStatus(order?.paymentStatus);
        return statuses.includes(status) || statuses.includes(paymentStatus);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return records.slice(0, safeLimit);
  },
  async orderById(id, query = {}) {
    const selector = buildOrderLookup(id);
    if (!selector) return null;
    const outletId = await getCurrentOutletId(query);
    const outletSlug = String(getRequestOutletValue(query, "outletSlug") || "").trim();
    const filter = { ...selector };
    if (outletId) {
      const outletMatches = [{ outletId }];
      if (outletSlug && outletSlug !== "all" && outletSlug !== String(outletId)) {
        outletMatches.push({
          $expr: { $eq: [{ $toString: "$outletId" }, outletSlug] }
        });
      }
      filter.$and = [{ $or: outletMatches }];
    }
    if (usingMongo()) {
      return Order.findOne(filter).lean({ virtuals: true });
    }
    return memory.orders.find((item) => {
      const matchesId = item.id === id || item.orderId === id || String(item._id || "") === String(id);
      const storedOutlet = String(item.outletId || "");
      const matchesOutletValue = !outletId || storedOutlet === String(outletId) || storedOutlet === outletSlug;
      return matchesId && matchesOutletValue;
    }) || null;
  },
  async createOrder(payload) {
    const outletId = await getExplicitOutletId(payload);
    if (!outletId) {
      throw new Error("Invalid or missing outletId. Orders must be associated with a valid outlet.");
    }
    const order = await buildOrder({ ...payload, outletId });
    order.orderType = payload.orderType || payload.type || order.orderType || inferOrderType(payload) || "COC";
    order.source = payload.source || payload.createdFrom || payload._source || (order.orderType === "OOC" ? "ooc" : order.orderType === "COC" ? "coc" : "qr");
    order.orderId = order.orderId || generateOrderId();
    order.deductionStatus = "pending";
    if (shouldDeductInventoryOnCreate(order)) {
      await deductInventoryForOrder(order);
      order.deductionStatus = "deducted";
    }
    if (usingMongo()) {
      const savedOrder = await Order.create(order);
      console.log(`[Order Save DB] Saved order: _id=${savedOrder._id}, outletId=${savedOrder.outletId}, tableNumber=${savedOrder.tableNumber}`);
      return savedOrder;
    }
    const saved = { ...order, id: `order-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    memory.orders.push(saved);
    savePersistedMemory(memory);
    return saved;
  },
  async createCocRequest(payload) {
    // build a COC request with resolved item names, prices, and total so admin sees correct details
    const outletId = await getExplicitOutletId(payload);
    if (!outletId) {
      throw new Error("Invalid or missing outletId. COC requests must be associated with a valid outlet.");
    }
    const order = await buildOrder({ ...payload, outletId });
    order.orderType = payload.orderType || payload.type || order.orderType || inferOrderType(payload) || "COC";
    order.source = payload.source || payload.createdFrom || payload._source || "coc";
    order.status = payload.status || "pending";
    order.paymentStatus = payload.paymentStatus || "pending";
    order.orderId = order.orderId || generateOrderId();
    order.deductionStatus = "pending";

    const requestId = `coc-${Date.now()}`;
    const request = { ...order, id: requestId, requestId, createdAt: new Date().toISOString() };
    memory.cocRequests = memory.cocRequests || [];
    memory.cocRequests.push(request);

    if (usingMongo()) {
      const savedCoc = await Order.create({ ...order, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      console.log(`[Order Save DB] Saved COC request: _id=${savedCoc._id}, outletId=${savedCoc.outletId}, tableNumber=${savedCoc.tableNumber}`);
    } else {
      memory.orders.push({ ...order, id: request.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      savePersistedMemory(memory);
    }

    return request;
  },
  async cocRequests(query = {}) {
    const outletId = await getCurrentOutletId(query);
    if (usingMongo()) {
      const filter = { orderType: "COC", status: "pending" };
      if (outletId) filter.outletId = outletId;
      return Order.find(filter).sort({ createdAt: -1 }).lean({ virtuals: true });
    }
    memory.cocRequests = memory.cocRequests || [];
    return [...memory.cocRequests].filter((item) => matchesOutlet(item, outletId)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async approveCocRequest(id, query = {}) {
    memory.cocRequests = memory.cocRequests || [];
    const candidate = String(id || "").trim();

    if (usingMongo()) {
      const existingOrder = await Order.findOne({
        ...buildOrderLookup(candidate),
        $or: [
          { orderType: "OOC", status: "new" },
          { orderType: "COC", status: "pending" }
        ]
      }).lean({ virtuals: true });
      if (!existingOrder) return null;
      return this.updateOrder(existingOrder._id || existingOrder.id, {
        orderType: existingOrder.orderType || "COC",
        source: existingOrder.source || "coc",
        status: "confirmed",
        paymentStatus: existingOrder.paymentStatus || "pending",
        outletId: existingOrder.outletId
      }, { outletId: "all" });
    }

    const index = memory.cocRequests.findIndex((r) => {
      const keys = [r.id, r.requestId, r.orderId];
      if (candidate && isSafeMongoOrderId(r._id) && candidate === String(r._id)) return true;
      return keys.some((value) => String(value || "").trim() === candidate);
    });

    if (index >= 0) {
      const req = memory.cocRequests.splice(index, 1)[0];
      const existingOrder = await this.orderById(req.orderId || req.id || req.requestId || id, { outletId: "all" });
      const updates = {
        orderType: req.orderType || req.type || inferOrderType(req) || "COC",
        source: req.source || req.createdFrom || req._source || "coc",
        status: "confirmed",
        paymentStatus: req.paymentStatus || "pending",
        outletId: req.outletId || existingOrder?.outletId
      };

      if (existingOrder) {
        return this.updateOrder(existingOrder._id || existingOrder.id, updates, { outletId: "all" });
      }

      const resolvedOutletId = req.outletId || (await getExplicitOutletId(req));
      if (!resolvedOutletId) {
        throw new Error("Invalid or missing outletId for COC request approval.");
      }
      const order = await buildOrder({ ...req, outletId: resolvedOutletId });
      order.orderType = req.orderType || req.type || inferOrderType(req) || "COC";
      order.source = req.source || req.createdFrom || req._source || "coc";
      order.status = "confirmed";
      order.paymentStatus = req.paymentStatus || "pending";
      order.orderId = order.orderId || generateOrderId();
      order.deductionStatus = "pending";
      if (usingMongo()) {
        return Order.create(order);
      }
      const saved = { ...order, id: `order-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      memory.orders.push(saved);
      savePersistedMemory(memory);
      return saved;
    }

    const existingOrder = await this.orderById(candidate, query);
    if (existingOrder) {
      return this.updateOrder(existingOrder._id || existingOrder.id, {
        status: "confirmed",
        paymentStatus: existingOrder.paymentStatus || "pending"
      }, query);
    }

    return null;
  },
  async updateOrder(id, payload, query = {}) {
    const selector = buildOrderLookup(id);
    if (!selector) return null;
    if (usingMongo()) {
      const outletId = await getCurrentOutletId(query);
      const cleanPayload = { ...payload };
      if (cleanPayload.status !== undefined) cleanPayload.status = normalizeSalesStatus(cleanPayload.status);
      if (cleanPayload.paymentStatus !== undefined) cleanPayload.paymentStatus = normalizeSalesStatus(cleanPayload.paymentStatus);
      const filter = { ...selector };
      if (outletId) filter.outletId = outletId;
      return Order.findOneAndUpdate(filter, cleanPayload, { new: true }).lean();
    }
    const outletId = await getCurrentOutletId(query);
    const index = memory.orders.findIndex((item) => (item.id === id || item.orderId === id || String(item._id || "") === String(id)) && matchesOutlet(item, outletId));
    if (index < 0) return null;
    const updated = { ...memory.orders[index], ...payload, updatedAt: new Date().toISOString() };
    memory.orders[index] = updated;
    savePersistedMemory(memory);
    return updated;
  },
  async deductOrderInventory(id, query = {}) {
    const order = await this.orderById(id, query);
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
    const index = memory.orders.findIndex((item) => item.id === order.id || item.orderId === order.orderId || String(item._id || "") === String(order._id || ""));
    if (index >= 0) {
      memory.orders[index] = { ...memory.orders[index], deductionStatus: "deducted", warnings: order.warnings || [], updatedAt: new Date().toISOString() };
      savePersistedMemory(memory);
      return memory.orders[index];
    }
    return order;
  },
  async reportsDaily(dateString, query = {}) {
    const outletId = await getCurrentOutletId(query);
    const fromDate = dateString ? new Date(dateString) : new Date();
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(fromDate);
    toDate.setDate(fromDate.getDate() + 1);
    const orders = (await this.orders({ outletId })).filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= fromDate && createdAt < toDate && isCompletedSale(order);
    });
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalOrders = orders.length;
    return { totalSales, totalOrders, orders };
  },
  async reportsMonthly(yearMonth, query = {}) {
    const outletId = await getCurrentOutletId(query);
    const now = yearMonth ? new Date(yearMonth) : new Date();
    const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 1);
    const orders = (await this.orders({ outletId })).filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= fromDate && createdAt < toDate && isCompletedSale(order);
    });
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalOrders = orders.length;
    return { totalSales, totalOrders, orders };
  },
  async deleteOrder(id, query = {}) {
    const outletId = await getCurrentOutletId(query);
    if (usingMongo()) {
      const filter = { ...buildOrderLookup(id) };
      if (outletId) filter.outletId = outletId;
      return Order.findOneAndDelete(filter);
    }
    memory.orders = memory.orders.filter((item) => {
      const matchesId = item.id === id || item.orderId === id || String(item._id || "") === String(id);
      return matchesId ? !matchesOutlet(item, outletId) : true;
    });
    savePersistedMemory(memory);
    return { deletedCount: 1 };
  }
};

function validateMenuItem(payload) {
  const sizes = (payload.sizes || [])
    .map((size, index) => ({
      id: String(size.id || size.label || size.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: String(size.name || size.label || "").trim(),
      label: String(size.label || size.name || "").trim(),
      price: Math.round(Number(size.price)),
      sortOrder: Number(size.sortOrder ?? index + 1)
    }))
    .filter((size) => size.name && Number.isFinite(size.price));

  if (!sizes.length) throw new Error("Every item needs at least one size with a price.");
  if (sizes.some((size) => size.price < 0)) throw new Error("Size prices must be zero or greater.");

  const serveOptions = Array.isArray(payload.serveOptions)
    ? payload.serveOptions.map((option) => String(option || "").trim()).filter(Boolean)
    : [];
  const addons = Array.isArray(payload.addons)
    ? payload.addons
        .map((addon) => ({
          id: String(addon.id || addon.name || `addon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`).trim(),
          name: String(addon.name || "").trim(),
          description: String(addon.description || "").trim(),
          price: Math.round(Number(addon.price))
        }))
        .filter((addon) => addon.name && Number.isFinite(addon.price) && addon.price >= 0)
    : payload.addons || [];

  const subCategoryName = String(payload.subCategoryName || payload.subcategoryName || payload.subcategory || payload.subCategory || "").trim();
  const subCategoryId = String(payload.subCategoryId || payload.subcategoryId || subCategoryName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const image = String(payload.image || payload.photoUrl || payload.imageUrl || payload.photo || payload.img || "").trim();
  const isActive = payload.active !== false && payload.isActive !== false;

  return {
    id: String(payload.id || payload.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: String(payload.name || "").trim(),
    categoryId: payload.categoryId,
    description: payload.description || "",
    subCategoryId,
    subCategoryName,
    subcategory: subCategoryName,
    image,
    sizes: sizes.sort((a, b) => a.sortOrder - b.sortOrder),
    serveOptions,
    addons,
    featured: Boolean(payload.featured),
    active: isActive,
    isActive,
    isDeleted: payload.isDeleted === true,
    deletedAt: payload.isDeleted ? payload.deletedAt || new Date() : null
  };
}

function inferOrderType(payload = {}) {
  const explicitType = String(payload.orderType || payload.type || "").trim().toUpperCase();
  if (explicitType) return explicitType;

  const source = String(payload.source || payload.createdFrom || payload._source || "").trim().toLowerCase();
  const paymentMethod = String(payload.paymentMethod || payload.method || "").trim().toLowerCase();
  const notes = String(payload.notes || payload.note || "").trim().toLowerCase();

  if (/\booc\b|order on counter/.test(`${source} ${notes}`)) return "OOC";
  if (/\bcoc\b|cash on counter|cash counter|counter cash/.test(`${source} ${paymentMethod} ${notes}`) || (paymentMethod === "cash" && !/\booc\b/.test(`${source} ${notes}`))) return "COC";
  if (/qr|upi|online/.test(`${paymentMethod} ${notes}`)) return "QR";
  return undefined;
}

async function buildOrder(payload) {
  const items = [];

  for (const raw of payload.items || []) {
    const menuItem = await store.menuItem(raw.itemId, { outletId: payload.outletId });
    if (!menuItem) throw new Error(`Menu item not found: ${raw.itemId}`);
    const size = menuItem.sizes.find((candidate) => candidate.id === raw.sizeId) || menuItem.sizes[0];
    if (!size || !Number.isFinite(Number(size.price))) throw new Error(`Price missing for ${menuItem.name}`);
    const quantity = Math.max(1, Number(raw.quantity || 1));
    const basePrice = Math.round(Number(raw.basePrice ?? raw.originalPrice ?? raw.baseUnitPrice ?? size.price ?? 0));
    const rawSelectedAddons = Array.isArray(raw.addons)
      ? raw.addons
      : Array.isArray(raw.addons?.selectedAddons)
      ? raw.addons.selectedAddons
      : Array.isArray(raw.selectedAddons)
      ? raw.selectedAddons
      : Array.isArray(raw.addOns)
      ? raw.addOns
      : Array.isArray(raw.selectedAddon)
      ? raw.selectedAddon
      : Array.isArray(raw.addons?.selectedAddon)
      ? raw.addons.selectedAddon
      : [];
    const selectedAddons = rawSelectedAddons
      .filter((addon) => addon && String(addon.name || "").trim())
      .map((addon) => ({
        id: String(addon.id || addon.name || "").trim(),
        name: String(addon.name || "").trim(),
        price: Math.round(Number(addon.price || 0))
      }))
      .filter((addon) => Number.isFinite(addon.price) && addon.price >= 0);
    const extraCheeseSelected = !!raw.addons?.extraCheese || selectedAddons.some(isExtraCheeseAddon);
    const requiredExtraCheesePrice = extraCheeseSelected ? getExtraCheesePriceForItem(menuItem) : 0;
    const extraCheeseInventoryDeduction = requiredExtraCheesePrice ? await resolveExtraCheeseInventoryDeduction(menuItem, payload.outletId) : [];
    const normalizedAddOns = selectedAddons
      .filter((addon) => !isExtraCheeseAddon(addon))
      .map((addon) => ({ ...addon, id: addon.id || slugify(addon.name) }));
    if (requiredExtraCheesePrice > 0) {
      normalizedAddOns.push({
        id: "extra-cheese",
        name: "Extra Cheese",
        price: requiredExtraCheesePrice,
        inventoryDeduction: extraCheeseInventoryDeduction
      });
    }
    const selectedAddonTotal = normalizedAddOns.reduce((sum, addon) => sum + Number(addon.price || 0), 0);
    const unitPrice = basePrice + selectedAddonTotal;
    const computedLineTotal = unitPrice * quantity;
    const lineTotal = Math.round(computedLineTotal);
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
        selectedAddons: normalizedAddOns,
        extraCheese: requiredExtraCheesePrice > 0,
        extraCheesePrice: requiredExtraCheesePrice
      },
      addOns: normalizedAddOns
    });
  }

  if (!items.length) throw new Error("Order must include at least one item.");
  if (!payload.tableNumber) throw new Error("Table number is required.");
  if (!payload.paymentMethod) throw new Error("Payment method is required.");

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const orderType = inferOrderType(payload) || "COC";
  const source = String(payload.source || payload.createdFrom || payload._source || (orderType === "OOC" ? "ooc" : orderType === "COC" ? "coc" : "qr")).trim().toLowerCase();

  const order = {
    ...(payload.outletId ? { outletId: payload.outletId } : {}),
    orderId: payload.orderId,
    customerName: payload.customerName || "Guest",
    phone: payload.phone || "Not provided",
    tableNumber: String(payload.tableNumber),
    tableNo: String(payload.tableNumber),
    paymentMethod: payload.paymentMethod,
    source,
    orderType,
    notes: payload.notes || "",
    items,
    total,
    totalAmount: total,
    status: normalizeSalesStatus(payload.status) || "new",
    paymentStatus: payload.paymentStatus ? normalizeSalesStatus(payload.paymentStatus) : undefined
  };

  if (payload.confirmedAt) order.confirmedAt = payload.confirmedAt;
  if (payload.rejectedAt) order.rejectedAt = payload.rejectedAt;
  if (payload.createdAt) order.createdAt = payload.createdAt;

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

async function findRawMaterialById(id, outletId = null, extraFilter = {}) {
  if (!usingMongo()) return null;
  const outletFilter = outletId
    ? { outletId: { $in: [new mongoose.Types.ObjectId(String(outletId)), String(outletId)] } }
    : {};
  const identifiers = [{ id }];
  if (mongoose.isValidObjectId(id)) identifiers.push({ _id: new mongoose.Types.ObjectId(String(id)) });
  return RawMaterial.collection.findOne({ $or: identifiers, ...outletFilter, ...extraFilter });
}

async function getRawMaterial(id, outletId = null) {
  if (usingMongo()) return findRawMaterialById(id, outletId);
  return memory.rawMaterials.find((item) => item.id === id && matchesOutlet(item, outletId));
}

async function getRawMaterials(outletId = null) {
  if (usingMongo()) return RawMaterial.find({ isDeleted: { $ne: true }, ...(outletId ? { outletId } : {}) }).lean();
  return memory.rawMaterials.filter((item) => item?.isDeleted !== true && matchesOutlet(item, outletId));
}

async function getRawMaterialByNameOrId(value, outletId = null) {
  const normalized = normalizeInventoryName(value);
  if (!normalized) return null;
  const rawMaterials = await getRawMaterials(outletId);
  return rawMaterials.find((item) => {
    return normalizeInventoryName(item?.id) === normalized || normalizeInventoryName(item?.name) === normalized;
  }) || null;
}

async function getRecipeForItem(itemId, outletId = null) {
  const normalizedItemId = String(itemId || "").trim();
  const legacyItemId = normalizedItemId.replace(/-+$/, "");
  const normalizeLegacyPackagedRecipe = (recipe) => {
    if (normalizedItemId === "redbull-250ml-" && recipe?.itemId === "redbull-250ml") {
      return {
        ...recipe,
        itemId: normalizedItemId,
        ingredients: [{ rawMaterialId: "redbull-250-ml-can", amount: 1, unit: "pcs", serveType: "" }]
      };
    }
    return recipe;
  };

  if (usingMongo()) {
    const exact = await Recipe.findOne({ itemId: normalizedItemId, ...(outletId ? { outletId } : {}) }).lean();
    if (exact) return exact;
    if (legacyItemId && legacyItemId !== normalizedItemId) {
      const legacy = await Recipe.findOne({ itemId: legacyItemId, ...(outletId ? { outletId } : {}) }).lean();
      if (legacy) return normalizeLegacyPackagedRecipe(legacy);
    }
    return null;
  }

  const exact = memory.recipes.find((item) => item.itemId === normalizedItemId && matchesOutlet(item, outletId));
  if (exact) return exact;
  if (legacyItemId && legacyItemId !== normalizedItemId) {
    const legacy = memory.recipes.find((item) => item.itemId === legacyItemId && matchesOutlet(item, outletId));
    if (legacy) return normalizeLegacyPackagedRecipe(legacy);
  }
  return null;
}

async function resolveExtraCheeseInventoryDeduction(menuItem = {}, outletId = null) {
  if (isBurgerMenuItem(menuItem)) {
    const cheeseSlice = await getRawMaterialByNameOrId("Cheese Slice", outletId);
    if (cheeseSlice) {
      return [{ rawMaterialId: cheeseSlice.id, itemName: "Cheese Slice", quantity: 1, unit: "pcs" }];
    }
    const mozzarella = await getRawMaterialByNameOrId("Mozzarella Cheese", outletId);
    if (mozzarella) {
      return [{ rawMaterialId: mozzarella.id, itemName: "Mozzarella Cheese", quantity: 25, unit: "g" }];
    }
    return [{ itemName: "Mozzarella Cheese", quantity: 25, unit: "g" }];
  }

  if (isPizzaMenuItem(menuItem)) {
    const mozzarella = await getRawMaterialByNameOrId("Mozzarella Cheese", outletId);
    return [{ rawMaterialId: mozzarella?.id, itemName: "Mozzarella Cheese", quantity: 40, unit: "g" }];
  }

  return [];
}

function getOrderItemAddOns(item = {}) {
  if (Array.isArray(item.addOns)) return item.addOns;
  if (Array.isArray(item.addons?.selectedAddons)) return item.addons.selectedAddons;
  if (Array.isArray(item.addons)) return item.addons;
  return [];
}

async function adjustRawMaterialStock(rawMaterialId, change, note, orderId, outletId = null, purchasePrice = null) {
  let targetOutletId = outletId ? String(outletId) : null;

  if (usingMongo()) {
    if (!targetOutletId) {
      const mat = await RawMaterial.findOne({ id: rawMaterialId }).lean();
      targetOutletId = mat?.outletId;
    }
    if (!targetOutletId) {
      throw new Error("Raw material must be associated with a valid outlet.");
    }
    const existing = await findRawMaterialById(rawMaterialId, targetOutletId);
    if (!existing) throw new Error(`Inventory item not found: ${rawMaterialId}`);
    const updated = await RawMaterial.findOneAndUpdate({ _id: existing._id }, { $inc: { stock: change } }, { new: true }).lean();
    await InventoryHistory.create({ rawMaterialId, change, note, orderId, purchasePrice, outletId: targetOutletId });
    return {
      material: updated,
      isLowStock: isLowStockItem(updated)
    };
  }

  const material = memory.rawMaterials.find((item) => item.id === rawMaterialId && matchesOutlet(item, targetOutletId));
  if (!material) throw new Error(`Inventory item not found: ${rawMaterialId}`);
  targetOutletId = material.outletId || targetOutletId;
  if (!targetOutletId) {
    throw new Error("Raw material must be associated with a valid outlet.");
  }
  material.stock = Number(material.stock || 0) + Number(change || 0);
  memory.inventoryHistory.push({
    rawMaterialId,
    change,
    note,
    orderId,
    purchasePrice,
    outletId: targetOutletId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  savePersistedMemory(memory);
  return {
    material,
    isLowStock: isLowStockItem(material)
  };
}

async function deductInventoryForOrder(order) {
  if (!order?.items?.length) return;
  if (order.deductionStatus === "deducted") return;
  const orderId = order.orderId || order.id || `order-${Date.now()}`;
  order.warnings = order.warnings || [];
  order.lowStockItems = [];

  for (const item of order.items) {
    const recipe = await getRecipeForItem(item.itemId, order.outletId);
    if (!recipe) {
      order.warnings.push(`Recipe missing for ${item.name || item.itemId}. Inventory deduction skipped for this item.`);
    } else if (!recipe.ingredients?.length) {
      order.warnings.push(`Recipe has no ingredients for ${item.name || item.itemId}. Inventory deduction skipped for this item.`);
    } else {
      for (const ingredient of recipe.ingredients) {
        if (ingredient.serveType && ingredient.serveType !== item.serveType) continue;
        const material = await getRawMaterial(ingredient.rawMaterialId, order.outletId);
        if (!material) throw new Error(`Inventory item missing: ${ingredient.rawMaterialId}`);
        const required = convertQuantity(ingredient.amount, ingredient.unit, material.unit) * item.quantity;
        if (material.stock < required) {
          throw new Error(`Low inventory for ${material.name} (${material.stock}${material.unit} available, ${required}${material.unit} required).`);
        }
        const result = await adjustRawMaterialStock(material.id, -required, `Order ${order.customerName} (${order.tableNumber})`, orderId, order.outletId);
        if (result.isLowStock) {
          order.lowStockItems.push({
            name: material.name,
            stock: result.material.stock,
            minStock: material.minStock,
            unit: material.unit
          });
        }
      }
    }

    for (const addon of getOrderItemAddOns(item)) {
      for (const deduction of addon?.inventoryDeduction || []) {
        const material = deduction.rawMaterialId
          ? await getRawMaterial(deduction.rawMaterialId, order.outletId)
          : await getRawMaterialByNameOrId(deduction.itemName || deduction.name, order.outletId);
        if (!material) throw new Error(`Inventory item missing: ${deduction.itemName || deduction.rawMaterialId}`);
        const required = convertQuantity(deduction.quantity, deduction.unit, material.unit) * item.quantity;
        if (material.stock < required) {
          throw new Error(`Low inventory for ${material.name} (${material.stock}${material.unit} available, ${required}${material.unit} required).`);
        }
        const result = await adjustRawMaterialStock(material.id, -required, `Order ${order.customerName} (${order.tableNumber}) - ${addon.name}`, orderId, order.outletId);
        if (result.isLowStock) {
          order.lowStockItems.push({
            name: material.name,
            stock: result.material.stock,
            minStock: material.minStock,
            unit: material.unit
          });
        }
      }
    }
  }
  order.deductionStatus = "deducted";
}
