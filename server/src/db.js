import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { categories as seedCategories, menuItems as seedItems, rawMaterials as seedRawMaterials, defaultRecipes as seedRecipes } from "./seed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const persistenceFile = path.join(__dirname, "persisted-store.json");
const authPersistenceFile = path.join(__dirname, "persisted-auth.json");

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
    id: { type: String, unique: true, required: true },
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
    id: { type: String, unique: true, required: true },
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
    addons: { type: mongoose.Schema.Types.Mixed, default: {} }
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
    id: { type: String, unique: true, required: true },
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

export const Category = mongoose.model("Category", categorySchema);
export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export const Order = mongoose.model("Order", orderSchema);
export const RawMaterial = mongoose.model("RawMaterial", rawMaterialSchema);
export const Recipe = mongoose.model("Recipe", recipeSchema);
export const InventoryHistory = mongoose.model("InventoryHistory", inventoryHistorySchema);
export const StaffAccount = mongoose.model("StaffAccount", staffAccountSchema);

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

function isHiddenInventoryItem(item) {
  return normalizeInventoryName(item?.name || item?.id) === "paper cup";
}

function isDeletedInventoryItem(item) {
  return item?.isDeleted === true;
}

function isLowStockItem(item) {
  const stock = Number(item?.stock || 0);
  const minStock = Number(item?.minStock || 0);
  return stock <= minStock;
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

function isSafeMongoOrderId(value) {
  return typeof value === "string" && mongoose.isValidObjectId(value);
}

function buildOrderLookup(identifier) {
  const key = String(identifier || "").trim();
  if (!key) return {};

  const filters = [];
  if (isSafeMongoOrderId(key)) filters.push({ _id: key });
  filters.push({ orderId: key });
  filters.push({ id: key });
  filters.push({ requestId: key });

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

  return {
    categories: fallbackCategories.map((item) => ({ ...item })),
    menuItems: fallbackMenuItems.map((item) => ({ ...item, sizes: Array.isArray(item.sizes) ? item.sizes.map((size) => ({ ...size })) : [] })),
    orders: Array.isArray(raw.orders) ? raw.orders.map((item) => ({ ...item })) : [],
    rawMaterials: fallbackRawMaterials.filter((item) => !isHiddenInventoryItem(item)).map((item) => ({ ...item })),
    recipes: fallbackRecipes.map((item) => ({ ...item })),
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
      categories: memoryState.categories || [],
      menuItems: memoryState.menuItems || [],
      orders: memoryState.orders || [],
      rawMaterials: memoryState.rawMaterials || [],
      recipes: memoryState.recipes || [],
      inventoryHistory: memoryState.inventoryHistory || []
    }, null, 2), "utf8");
  } catch (error) {
    console.warn("Failed to save persisted fallback memory.", error);
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
  }
}

const memory = loadPersistedMemory();

export const usingMongo = () => mongoose.connection.readyState === 1;

function canUsePersistedStaffFallback() {
  return process.env.NODE_ENV !== "production" && !process.env.MONGODB_URI;
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
    return false;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  await seedDatabase();
  await seedStaffAccounts();
  console.log("Connected to MongoDB.");
  return true;
}

export async function seedDatabase() {
  const persistedMemory = loadPersistedMemory();
  const categoryCount = await Category.countDocuments();
  const itemCount = await MenuItem.countDocuments();
  const rawMaterialCount = await RawMaterial.countDocuments();
  const recipeCount = await Recipe.countDocuments();

  const categoriesToSeed = Array.isArray(persistedMemory.categories) && persistedMemory.categories.length ? persistedMemory.categories : seedCategories;
  const menuItemsToSeed = Array.isArray(persistedMemory.menuItems) && persistedMemory.menuItems.length ? persistedMemory.menuItems : seedItems;

  for (const category of categoriesToSeed) {
    await Category.findOneAndUpdate(
      { id: category.id },
      { $set: { ...category, sortOrder: Number(category.sortOrder || 0), icon: category.icon || "Utensils", isDeleted: Boolean(category.isDeleted), deletedAt: category.isDeleted ? category.deletedAt || new Date() : null } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  for (const item of menuItemsToSeed) {
    const cleanItem = validateMenuItem(item);
    await MenuItem.findOneAndUpdate(
      { id: cleanItem.id },
      { $set: cleanItem },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  if (itemCount === 0) {
    await MenuItem.updateOne(
      { id: "kit-kat-shake" },
      { $set: { image: "/assets/images/Cold Drinks/Milk Shakes/kitkat-shake-v2.jpg" } }
    );
    await MenuItem.updateOne(
      { id: "paneer-tikka-melt" },
      { $set: { image: "/assets/images/Snacks/Sandwich/paneer-tikka-melt-v2.jpg" } }
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
  }
}

export const store = {
  async categories() {
    if (usingMongo()) return Category.find({ isDeleted: { $ne: true } }).sort({ sortOrder: 1, name: 1 }).lean();
    return [...memory.categories].filter((item) => item.isDeleted !== true).sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async deletedCategories() {
    if (usingMongo()) return Category.find({ isDeleted: true }).sort({ deletedAt: -1, sortOrder: 1, name: 1 }).lean();
    return [...memory.categories].filter((item) => item.isDeleted === true).sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));
  },
  async upsertCategory(payload) {
    const clean = {
      ...payload,
      isDeleted: payload.isDeleted === true,
      deletedAt: payload.isDeleted ? payload.deletedAt || new Date() : null
    };
    if (usingMongo()) {
      return Category.findOneAndUpdate({ id: clean.id }, clean, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    }
    const index = memory.categories.findIndex((item) => item.id === clean.id);
    if (index >= 0) memory.categories[index] = { ...memory.categories[index], ...clean };
    else memory.categories.push(clean);
    savePersistedMemory(memory);
    return clean;
  },
  async deleteCategory(id) {
    const deletedAt = new Date();
    if (usingMongo()) {
      return Category.findOneAndUpdate({ id }, { $set: { isDeleted: true, deletedAt } }, { new: true }).lean();
    }
    const index = memory.categories.findIndex((item) => item.id === id);
    if (index < 0) return null;
    memory.categories[index] = { ...memory.categories[index], isDeleted: true, deletedAt: deletedAt.toISOString() };
    savePersistedMemory(memory);
    return memory.categories[index];
  },
  async restoreCategory(id) {
    if (usingMongo()) {
      return Category.findOneAndUpdate({ id }, { $set: { isDeleted: false, deletedAt: null } }, { new: true }).lean();
    }
    const index = memory.categories.findIndex((item) => item.id === id);
    if (index < 0) return null;
    memory.categories[index] = { ...memory.categories[index], isDeleted: false, deletedAt: null };
    savePersistedMemory(memory);
    return memory.categories[index];
  },
  async permanentlyDeleteCategory(id) {
    if (usingMongo()) return Category.deleteOne({ id });
    memory.categories = memory.categories.filter((item) => item.id !== id);
    savePersistedMemory(memory);
    return { deletedCount: 1 };
  },
  async menuItems(query = {}) {
    if (usingMongo()) {
      const filter = {};
      if (query.categoryId) filter.categoryId = query.categoryId;
      if (query.search) filter.name = { $regex: query.search, $options: "i" };
      if (!query.includeInactive) filter.active = true;
      if (!query.includeDeleted) filter.isDeleted = { $ne: true };
      const categoryFilter = query.includeDeleted ? {} : { isDeleted: { $ne: true } };
      const visibleCategoryIds = await Category.find(categoryFilter).distinct("id");
      if (!query.includeDeleted) {
        if (query.categoryId && !visibleCategoryIds.includes(query.categoryId)) return [];
        filter.categoryId = query.categoryId ? query.categoryId : { $in: visibleCategoryIds };
      }
      return MenuItem.find(filter).sort({ name: 1 }).lean();
    }
    return memory.menuItems
      .filter((item) => (query.includeInactive ? true : item.active))
      .filter((item) => (query.includeDeleted ? true : item.isDeleted !== true))
      .filter((item) => (query.includeDeleted ? true : (memory.categories.find((category) => category.id === item.categoryId)?.isDeleted !== true)))
      .filter((item) => (!query.categoryId ? true : item.categoryId === query.categoryId))
      .filter((item) => (!query.search ? true : item.name.toLowerCase().includes(query.search.toLowerCase())))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  async menuItem(id) {
    if (usingMongo()) return MenuItem.findOne({ id }).lean();
    return memory.menuItems.find((item) => item.id === id);
  },
  async deletedMenuItems() {
    if (usingMongo()) return MenuItem.find({ isDeleted: true }).sort({ deletedAt: -1, name: 1 }).lean();
    return [...memory.menuItems].filter((item) => item.isDeleted === true).sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));
  },
  async upsertMenuItem(payload) {
    const clean = validateMenuItem(payload);
    if (usingMongo()) {
      return MenuItem.findOneAndUpdate({ id: clean.id }, clean, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    }
    const index = memory.menuItems.findIndex((item) => item.id === clean.id);
    if (index >= 0) memory.menuItems[index] = clean;
    else memory.menuItems.push(clean);
    savePersistedMemory(memory);
    return clean;
  },
  async deleteMenuItem(id) {
    const deletedAt = new Date();
    if (usingMongo()) return MenuItem.findOneAndUpdate({ id }, { $set: { isDeleted: true, deletedAt } }, { new: true }).lean();
    const index = memory.menuItems.findIndex((item) => item.id === id);
    if (index < 0) return null;
    memory.menuItems[index] = { ...memory.menuItems[index], isDeleted: true, deletedAt: deletedAt.toISOString() };
    savePersistedMemory(memory);
    return memory.menuItems[index];
  },
  async restoreMenuItem(id) {
    if (usingMongo()) return MenuItem.findOneAndUpdate({ id }, { $set: { isDeleted: false, deletedAt: null } }, { new: true }).lean();
    const index = memory.menuItems.findIndex((item) => item.id === id);
    if (index < 0) return null;
    memory.menuItems[index] = { ...memory.menuItems[index], isDeleted: false, deletedAt: null };
    savePersistedMemory(memory);
    return memory.menuItems[index];
  },
  async permanentlyDeleteMenuItem(id) {
    if (usingMongo()) return MenuItem.deleteOne({ id });
    memory.menuItems = memory.menuItems.filter((item) => item.id !== id);
    savePersistedMemory(memory);
    return { deletedCount: 1 };
  },
  async rawMaterials() {
    if (usingMongo()) {
      return RawMaterial.find({ $and: [{ isDeleted: { $ne: true } }, { $nor: [{ id: "paper-cup" }, { name: /^Paper Cup$/i }] }] })
        .sort({ category: 1, name: 1 })
        .lean();
    }
    return [...memory.rawMaterials]
      .filter((item) => !isDeletedInventoryItem(item) && !isHiddenInventoryItem(item))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  },
  async rawMaterial(id) {
    if (usingMongo()) return RawMaterial.findOne({ $and: [{ id }, { isDeleted: { $ne: true } }, { $nor: [{ id: "paper-cup" }, { name: /^Paper Cup$/i }] }] }).lean();
    return memory.rawMaterials.find((item) => item.id === id && !isDeletedInventoryItem(item) && !isHiddenInventoryItem(item));
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
    if (usingMongo()) {
      return RawMaterial.findOneAndUpdate(
        { id },
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      ).lean();
    }
    const index = memory.rawMaterials.findIndex((item) => item.id === id);
    if (index >= 0) {
      memory.rawMaterials[index] = {
        ...memory.rawMaterials[index],
        isDeleted: true,
        deletedAt: new Date().toISOString()
      };
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  },
  async adjustRawMaterialStock(id, change, note, orderId) {
    return adjustRawMaterialStock(id, change, note, orderId);
  },
  async recipes() {
    if (usingMongo()) {
      const [recipes, rawMaterials] = await Promise.all([
        Recipe.find().sort({ itemId: 1 }).lean(),
        RawMaterial.find({ $nor: [{ id: "paper-cup" }, { name: /^Paper Cup$/i }] }, { id: 1, name: 1 }).lean()
      ]);
      return recipes
        .map((recipe) => {
          const { ingredients, skipped } = normalizeRecipeIngredients(recipe.ingredients || [], rawMaterials);
          if (skipped.length > 0) console.warn(`Normalized recipe ingredients for ${recipe.itemId || recipe.id}:`, skipped);
          return { ...recipe, ingredients };
        })
        .sort((a, b) => a.itemId.localeCompare(b.itemId));
    }
    return [...memory.recipes]
      .map((recipe) => {
        const { ingredients, skipped } = normalizeRecipeIngredients(recipe.ingredients || [], memory.rawMaterials);
        if (skipped.length > 0) console.warn(`Normalized recipe ingredients for ${recipe.itemId || recipe.id}:`, skipped);
        return { ...recipe, ingredients };
      })
      .sort((a, b) => a.itemId.localeCompare(b.itemId));
  },
  async recipeByItem(itemId) {
    if (usingMongo()) {
      const [recipe, rawMaterials] = await Promise.all([
        Recipe.findOne({ itemId }).lean(),
        RawMaterial.find({ $nor: [{ id: "paper-cup" }, { name: /^Paper Cup$/i }] }, { id: 1, name: 1 }).lean()
      ]);
      if (!recipe) return null;
      const { ingredients, skipped } = normalizeRecipeIngredients(recipe.ingredients || [], rawMaterials);
      if (skipped.length > 0) console.warn(`Normalized recipe ingredients for ${recipe.itemId || recipe.id}:`, skipped);
      return { ...recipe, ingredients };
    }
    const recipe = memory.recipes.find((item) => item.itemId === itemId);
    if (!recipe) return null;
    const { ingredients, skipped } = normalizeRecipeIngredients(recipe.ingredients || [], memory.rawMaterials);
    if (skipped.length > 0) console.warn(`Normalized recipe ingredients for ${recipe.itemId || recipe.id}:`, skipped);
    return { ...recipe, ingredients };
  },
  async upsertRecipe(payload) {
    const rawMaterials = usingMongo()
      ? await RawMaterial.find({ $nor: [{ id: "paper-cup" }, { name: /^Paper Cup$/i }] }, { id: 1, name: 1 }).lean()
      : memory.rawMaterials;
    const { ingredients, skipped } = normalizeRecipeIngredients(payload.ingredients || [], rawMaterials);
    if (skipped.length > 0) {
      console.warn(`Skipped unresolved recipe ingredients for ${payload.itemId || payload.id}:`, skipped);
    }
    const clean = {
      id: String(payload.id || payload.itemId).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      itemId: String(payload.itemId || "").trim(),
      ingredients
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
  async orders(query = {}) {
    const requestedLimit = Number(query?.limit ?? 100);
    const safeLimit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 500) : 100;
    const rawStatuses = Array.isArray(query?.statuses)
      ? query.statuses
      : typeof query?.status === "string"
        ? query.status.split(",")
        : [];
    const statuses = Array.from(new Set(rawStatuses.map((value) => normalizeSalesStatus(value)).filter(Boolean)));

    const filter = {};
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
        if (!statuses.length) return true;
        const status = normalizeSalesStatus(order?.status);
        const paymentStatus = normalizeSalesStatus(order?.paymentStatus);
        return statuses.includes(status) || statuses.includes(paymentStatus);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return records.slice(0, safeLimit);
  },
  async orderById(id) {
    if (usingMongo()) {
      return Order.findOne(buildOrderLookup(id)).lean({ virtuals: true });
    }
    return memory.orders.find((item) => item.id === id || item.orderId === id) || null;
  },
  async createOrder(payload) {
    const order = await buildOrder(payload);
    order.orderType = payload.orderType || payload.type || order.orderType || inferOrderType(payload) || "COC";
    order.source = payload.source || payload.createdFrom || payload._source || (order.orderType === "OOC" ? "ooc" : order.orderType === "COC" ? "coc" : "qr");
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
      await Order.create({ ...order, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    } else {
      memory.orders.push({ ...order, id: request.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }

    return request;
  },
  async cocRequests() {
    memory.cocRequests = memory.cocRequests || [];
    return [...memory.cocRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async approveCocRequest(id) {
    memory.cocRequests = memory.cocRequests || [];
    const candidate = String(id || "").trim();
    const index = memory.cocRequests.findIndex((r) => {
      const keys = [r.id, r.requestId, r.orderId];
      if (candidate && isSafeMongoOrderId(r._id) && candidate === String(r._id)) return true;
      return keys.some((value) => String(value || "").trim() === candidate);
    });

    if (index >= 0) {
      const req = memory.cocRequests.splice(index, 1)[0];
      const existingOrder = await this.orderById(req.orderId || req.id || req.requestId || id);
      const updates = {
        orderType: req.orderType || req.type || inferOrderType(req) || "COC",
        source: req.source || req.createdFrom || req._source || "coc",
        status: "confirmed",
        paymentStatus: req.paymentStatus || "pending"
      };

      if (existingOrder) {
        return this.updateOrder(existingOrder._id || existingOrder.id, updates);
      }

      const order = await buildOrder(req);
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
      return saved;
    }

    const existingOrder = await this.orderById(candidate);
    if (existingOrder) {
      return this.updateOrder(existingOrder._id || existingOrder.id, {
        status: "confirmed",
        paymentStatus: existingOrder.paymentStatus || "pending"
      });
    }

    return null;
  },
  async updateOrder(id, payload) {
    if (usingMongo()) {
      const cleanPayload = { ...payload };
      if (cleanPayload.status !== undefined) cleanPayload.status = normalizeSalesStatus(cleanPayload.status);
      if (cleanPayload.paymentStatus !== undefined) cleanPayload.paymentStatus = normalizeSalesStatus(cleanPayload.paymentStatus);
      return Order.findOneAndUpdate(buildOrderLookup(id), cleanPayload, { new: true }).lean();
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
    if (usingMongo()) return Order.findOneAndDelete(buildOrderLookup(id));
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
          id: String(addon.id || addon.name || `addon-${Date.now()}`).trim(),
          name: String(addon.name || "").trim(),
          description: String(addon.description || "").trim(),
          price: Math.round(Number(addon.price))
        }))
        .filter((addon) => addon.name && Number.isFinite(addon.price) && addon.price >= 0)
    : payload.addons || [];

  const subCategoryName = String(payload.subCategoryName || payload.subcategoryName || payload.subcategory || payload.subCategory || "").trim();
  const subCategoryId = String(payload.subCategoryId || payload.subcategoryId || subCategoryName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  return {
    id: String(payload.id || payload.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: String(payload.name || "").trim(),
    categoryId: payload.categoryId,
    description: payload.description || "",
    subCategoryId,
    subCategoryName,
    subcategory: subCategoryName,
    image: payload.image || "",
    sizes: sizes.sort((a, b) => a.sortOrder - b.sortOrder),
    serveOptions,
    addons,
    featured: Boolean(payload.featured),
    active: payload.active !== false,
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
    const menuItem = await store.menuItem(raw.itemId);
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
        name: String(addon.name || "").trim(),
        price: Math.round(Number(addon.price || 0))
      }))
      .filter((addon) => Number.isFinite(addon.price) && addon.price >= 0);
    const extraCheeseSelected = !!raw.addons?.extraCheese;
    const extraCheesePrice = extraCheeseSelected ? Math.round(Number(raw.addons?.extraCheesePrice || 0)) : 0;
    const selectedAddonTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    const unitPrice = basePrice + extraCheesePrice + selectedAddonTotal;
    const computedLineTotal = unitPrice * quantity;
    const rawLineTotal = Number(raw.lineTotal ?? raw.finalLineTotal);
    const lineTotal = Math.round(Number.isFinite(rawLineTotal) && rawLineTotal > 0 ? rawLineTotal : computedLineTotal);
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
        selectedAddons,
        extraCheese: extraCheeseSelected,
        extraCheesePrice
      }
    });
  }

  if (!items.length) throw new Error("Order must include at least one item.");
  if (!payload.tableNumber) throw new Error("Table number is required.");
  if (!payload.paymentMethod) throw new Error("Payment method is required.");

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const orderType = inferOrderType(payload) || "COC";
  const source = String(payload.source || payload.createdFrom || payload._source || (orderType === "OOC" ? "ooc" : orderType === "COC" ? "coc" : "qr")).trim().toLowerCase();

  const order = {
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
    return {
      material: updated,
      isLowStock: isLowStockItem(updated)
    };
  }

  const material = memory.rawMaterials.find((item) => item.id === rawMaterialId);
  if (!material) throw new Error(`Inventory item not found: ${rawMaterialId}`);
  material.stock = Number(material.stock || 0) + Number(change || 0);
  memory.inventoryHistory.push({ rawMaterialId, change, note, orderId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
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
      const result = await adjustRawMaterialStock(material.id, -required, `Order ${order.customerName} (${order.tableNumber})`, orderId);
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
  order.deductionStatus = "deducted";
}
