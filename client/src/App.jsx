import React, { useEffect, useMemo, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  CakeSlice,
  Coffee,
  CupSoda,
  Droplets,
  Filter,
  LayoutDashboard,
  LogOut,
  Menu,
  Minus,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Utensils,
  Sandwich,
  X,
  Instagram
} from "lucide-react";
import "./styles.css";
import QRCode from "qrcode";
import PrintableReceipt, { normalizeReceiptOrder } from "./PrintableReceipt";
import logoUrl from "./assets/infusion-saga-logo.png";
import ordersStore from "./ordersStore";
import stockTransactionsStore from "./stockTransactionsStore";
import sync from "./sync";
import inventoryStore from "./inventoryStore";
import demoMode from "./demoMode";
import { imageUrl } from "./utils/imageHelper";
import { normalizeMenuItem, filterMenuItems } from "./utils/filterMenuItems";
import { sortMenuItemsForDisplay } from "./utils/menuDisplayOrder";
import { categories as defaultCategories, menuItems as defaultMenuItems, subcategoryConfig } from "./data/menuData";
import { CategoryChips, SubcategoryChips } from "./components/CategoryFilters";
import CustomerMenu from "./components/CustomerMenu";
import MenuItemCard from "./components/MenuItemCard";
import { addToCart as addCartItem, calculateTotals, loadCartFromStorage, parseCartStorageValue, saveCartToStorage, updateQuantity as updateCartQuantity } from "./utils/cartHelpers";
import { createOrderStatusUpdatePayload, endOfDay, generateOrderId, getBillerOrderClassification, getOrderDate, getOrderSourceLabel, getOrderStatusLabel, isValidSalesOrder, isCompletedSale, normalizeOrder, normalizeStatus, preparePrintableOrder, startOfDay } from "./utils/orderHelpers";
import { calculateTodayTotalProfit } from "./utils/profitHelpers";
import { buildUpiString, createQrDataUrl, getPaymentFlowState, getPaymentOutcomeCopy } from "./utils/paymentHelpers";
import { getCocRequestIdentityKeys, isCocTerminalState, mergeCocRequestEntries as mergeCocRequestEntriesFromHelper, resolveCocRequestId } from "./utils/cocRequestUtils";
import { formatOrderItemLine, getBasePrice, getAddonDisplay, getAddonEachText, getFinalItemTotal, getOrderTotal, normalizeVisibleSizeLabel } from "./utils/orderDisplayFormatter";
import { api, API, API_ROOT } from "./services/apiClient";
import orderService from "./services/orderService";
import paymentService from "./services/paymentService";
import authService from "./services/authService";
import menuService from "./services/menuService";

// Subcategory config persistence helpers
const SUBCATEGORY_CONFIG_KEY = "subCategories";
const DELETED_SUBCATEGORY_CONFIG_KEY = "subCategoriesDeleted";
const INVENTORY_ITEMS_KEY = "inventoryItems";
const PENDING_COC_ORDER_KEY = "infusion-pending-coc-order";
const DASHBOARD_CACHE_KEYS = ["infusion-orders", "infusion-inventory", INVENTORY_ITEMS_KEY];

function readJsonStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (err) {
    return fallback;
  }
}

function readPendingCocOrder() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_COC_ORDER_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function savePendingCocOrder(order) {
  if (!order?.orderId) return;
  try {
    localStorage.setItem(PENDING_COC_ORDER_KEY, JSON.stringify({
      ...order,
      pendingApproval: true,
      savedAt: new Date().toISOString()
    }));
  } catch (error) {
    // Ignore storage failures and keep the in-memory flow safe.
  }
}

function clearPendingCocOrder() {
  try {
    localStorage.removeItem(PENDING_COC_ORDER_KEY);
  } catch (error) {
    // Ignore storage failures.
  }
}

function clearDashboardCache() {
  DASHBOARD_CACHE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      // Ignore storage failures.
    }
  });
}

function logLoadStats(context, counts) {
  if (!import.meta.env.DEV) return;
  const {
    rawItems,
    activeItems,
    rawCategories,
    activeCategories,
    rawSubcategories,
    activeSubcategories,
    deletedCount
  } = counts || {};
  console.groupCollapsed(`[${context}] load stats`);
  console.log("rawCategories:", rawCategories);
  console.log("activeCategories:", activeCategories);
  console.log("rawItems:", rawItems);
  console.log("activeItems:", activeItems);
  if (rawSubcategories !== undefined) console.log("rawSubcategories:", rawSubcategories);
  if (activeSubcategories !== undefined) console.log("activeSubcategories:", activeSubcategories);
  if (deletedCount !== undefined) console.log("deletedCount:", deletedCount);
  console.groupEnd();
}

function normalizeSubcategoryList(value) {
  if (Array.isArray(value)) return value.map((entry) => String(entry || "").trim()).filter(Boolean);
  return [];
}

function normalizeDeletedSubcategoryMap(value) {
  const source = value && typeof value === "object" ? value : {};
  const result = {};
  for (const [parentId, entries] of Object.entries(source)) {
    const normalizedEntries = Array.isArray(entries)
      ? entries.map((entry) => {
          if (typeof entry === "string") return { name: entry, deletedAt: null };
          return { name: String(entry?.name || "").trim(), deletedAt: entry?.deletedAt || null };
        })
      : [];
    result[parentId] = normalizedEntries.filter((entry) => entry.name);
  }
  return result;
}

function loadSubcategoryConfig() {
  try {
    const activeStored = readJsonStorage(SUBCATEGORY_CONFIG_KEY, {});
    const deletedStored = normalizeDeletedSubcategoryMap(readJsonStorage(DELETED_SUBCATEGORY_CONFIG_KEY, {}));
    const defaults = typeof subcategoryConfig === "object" ? subcategoryConfig : {};
    const merged = {};
    for (const parentId of new Set([...Object.keys(defaults), ...Object.keys(activeStored)])) {
      const activeValues = Array.from(new Set([...(normalizeSubcategoryList(defaults[parentId])), ...(normalizeSubcategoryList(activeStored[parentId]))]));
      const deletedNames = new Set((deletedStored[parentId] || []).map((entry) => entry.name));
      merged[parentId] = activeValues.filter((name) => !deletedNames.has(name));
    }
    return merged;
  } catch (err) {
    return typeof subcategoryConfig === "object" ? subcategoryConfig : {};
  }
}

function getOrderHistoryTypeLabel(order) {
  if (!order || typeof order !== "object") return undefined;

  const explicitType = String(order.orderType || order.type || "").trim();
  if (explicitType) return explicitType;

  const inferredType = getOrderSourceLabel(order);
  if (inferredType) return inferredType;

  return undefined;
}

function getOrderHistoryFingerprint(order) {
  if (!order || typeof order !== "object") return "";
  
  // Primary: use orderId (immutable unique identifier)
  const orderId = String(order.orderId || order.id || order._id || "").trim();
  if (orderId) return `order:${orderId}`;

  // Fallback: use immutable attributes (createdAt + customer identity)
  // These don't change for a given order
  const createdAt = String(order.createdAt || order.orderDate || order.date || "").trim();
  const customerName = String(order.customerName || order.name || "").trim().toLowerCase();
  const phone = String(order.phone || order.customerPhone || "").trim().toLowerCase();
  
  if (createdAt && (customerName || phone)) {
    return `fallback:${createdAt}|${customerName}|${phone}`;
  }
  
  return "";
}

function mergeOrderHistoryRecords(orders, cocRequests) {
  const normalizedOrders = Array.isArray(orders) ? orders : [];
  const normalizedCocRequests = (Array.isArray(cocRequests) ? cocRequests : []).map((request) => ({
    ...request,
    orderType: request.orderType || "COC"
  }));

  // Group by fingerprint to deduplicate
  const groupedByFingerprint = {};

  for (const order of [...normalizedOrders, ...normalizedCocRequests]) {
    const normalized = { ...order };
    if (!normalized.orderType) {
      normalized.orderType = getOrderHistoryTypeLabel(normalized);
    }

    const fingerprint = getOrderHistoryFingerprint(normalized);
    if (!fingerprint) continue;

    // Keep the most recent version (by updatedAt or createdAt)
    if (!groupedByFingerprint[fingerprint]) {
      groupedByFingerprint[fingerprint] = normalized;
    } else {
      const existingTime = new Date(groupedByFingerprint[fingerprint].updatedAt || groupedByFingerprint[fingerprint].createdAt || 0).getTime();
      const newTime = new Date(normalized.updatedAt || normalized.createdAt || 0).getTime();
      if (newTime > existingTime) {
        groupedByFingerprint[fingerprint] = normalized;
      }
    }
  }

  // Convert to array and sort by creation time (most recent first)
  const merged = Object.values(groupedByFingerprint);
  return merged.sort((a, b) => {
    const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return bTime - aTime;
  });
}

function saveSubcategoryConfig(obj) {
  try {
    localStorage.setItem(SUBCATEGORY_CONFIG_KEY, JSON.stringify(obj || {}));
    dispatchOwnerDataUpdated({ source: "subcategories" });
  } catch (err) {
    console.error("Failed to save subcategory config:", err);
  }
}

function loadDeletedSubcategoryConfig() {
  return normalizeDeletedSubcategoryMap(readJsonStorage(DELETED_SUBCATEGORY_CONFIG_KEY, {}));
}

function saveDeletedSubcategoryConfig(obj) {
  try {
    localStorage.setItem(DELETED_SUBCATEGORY_CONFIG_KEY, JSON.stringify(obj || {}));
    dispatchOwnerDataUpdated({ source: "deletedSubcategories" });
  } catch (err) {
    console.error("Failed to save deleted subcategory config:", err);
  }
}

function restoreDeletedSubcategory(parentId, name) {
  const active = loadSubcategoryConfig();
  const deleted = loadDeletedSubcategoryConfig();
  const normalizedName = String(name || "").trim();
  if (!parentId || !normalizedName) return;
  active[parentId] = Array.from(new Set([...(active[parentId] || []), normalizedName]));
  deleted[parentId] = (deleted[parentId] || []).filter((entry) => entry.name !== normalizedName);
  if (!deleted[parentId] || deleted[parentId].length === 0) delete deleted[parentId];
  saveSubcategoryConfig(active);
  saveDeletedSubcategoryConfig(deleted);
  dispatchOwnerDataUpdated({ source: "subcategoryRestored", parentId, name: normalizedName });
}

function permanentlyDeleteSubcategory(parentId, name) {
  const deleted = loadDeletedSubcategoryConfig();
  const normalizedName = String(name || "").trim();
  if (!parentId || !normalizedName) return;
  deleted[parentId] = (deleted[parentId] || []).filter((entry) => entry.name !== normalizedName);
  if (!deleted[parentId] || deleted[parentId].length === 0) delete deleted[parentId];
  saveDeletedSubcategoryConfig(deleted);
  dispatchOwnerDataUpdated({ source: "subcategoryPermanentlyDeleted", parentId, name: normalizedName });
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

function normalizeLocalInventoryItem(item) {
  const source = item && typeof item === "object" ? item : {};
  return {
    ...source,
    isDeleted: source.isDeleted === true,
    deletedAt: source.isDeleted === true ? source.deletedAt || source.lastUpdated || null : source.deletedAt || null
  };
}

function normalizeLocalInventoryItems(items) {
  if (!Array.isArray(items)) return null;
  return items
    .map((item) => normalizeLocalInventoryItem(item))
    .filter((item) => !isHiddenInventoryItem(item));
}

function loadLocalInventoryItems() {
  const loaded = readJsonStorage(INVENTORY_ITEMS_KEY, []);
  const normalized = normalizeLocalInventoryItems(loaded);
  return Array.isArray(normalized) ? normalized : [];
}

function saveLocalInventoryItems(items) {
  const normalized = normalizeLocalInventoryItems(items);
  if (!Array.isArray(normalized)) {
    return loadLocalInventoryItems();
  }
  try {
    localStorage.setItem(INVENTORY_ITEMS_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent("inventoryUpdated", { detail: normalized }));
    dispatchOwnerDataUpdated({ source: "inventory" });
  } catch (err) {
    console.error("Failed to save inventory items:", err);
    return loadLocalInventoryItems();
  }
  return normalized;
}

function dispatchOwnerDataUpdated(detail = {}) {
  try {
    window.dispatchEvent(new CustomEvent("ownerDataUpdated", { detail }));
  } catch (err) {
    console.error("Failed to dispatch ownerDataUpdated event:", err);
  }
}

function ensureActiveCategories(data) {
  const categories = Array.isArray(data) && data.length ? data : defaultCategories;
  return categories.map((category) => ({
    ...category,
    isDeleted: category?.isDeleted === true,
    deletedAt: category?.deletedAt || null,
    active: category?.active !== false && category?.isActive !== false,
    hidden: category?.hidden === true || category?.isHidden === true
  }));
}

function normalizeOwnerCategories(data) {
  if (!Array.isArray(data)) return [];
  return data.map((category) => ({
    ...category,
    isDeleted: category?.isDeleted === true,
    deletedAt: category?.deletedAt || null
  }));
}

function ensureActiveMenuItems(data, categories) {
  const items = Array.isArray(data) && data.length ? data : (demoMode.isDemoModeEnabled() ? defaultMenuItems : []);
  const allowedCategoryIds = new Set((Array.isArray(categories) && categories.length ? categories : defaultCategories).map((category) => category.id));
  return items
    .filter((item) => {
      if (!item || item?.isDeleted === true || item?.deleted === true) return false;
      if (item?.active === false || item?.isActive === false) return false;
      if (item?.hidden === true || item?.isHidden === true) return false;
      return allowedCategoryIds.has(item.categoryId);
    })
    .map((item) => normalizeMenuItem(item));
}

function getQuickAccessPrice(item) {
  const sizePrice = Array.isArray(item?.sizes) ? Number(item.sizes[0]?.price ?? 0) : 0;
  return Math.max(0, Number(item?.price ?? sizePrice ?? 0));
}

function isCustomerVisibleItem(item) {
  if (!item) return false;
  if (item?.isDeleted === true || item?.deleted === true) return false;
  if (item?.active === false || item?.isActive === false) return false;
  if (item?.hidden === true || item?.isHidden === true) return false;
  return true;
}

function isCustomerVisibleCategory(category) {
  if (!category) return false;
  if (category?.isDeleted === true || category?.deleted === true) return false;
  if (category?.active === false || category?.isActive === false) return false;
  if (category?.hidden === true || category?.isHidden === true) return false;
  return true;
}

const HIDDEN_CUSTOMER_CATEGORY_IDS = new Set(["water-bottles", "cigarettes"]);

function normalizeCategoryId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");
}

function isCustomerHiddenCategory(categoryOrId) {
  const categoryId = normalizeCategoryId(categoryOrId?.id || categoryOrId?.categoryId || categoryOrId || "");
  return HIDDEN_CUSTOMER_CATEGORY_IDS.has(categoryId);
}

function hasLiveQuickAccessPrice(item) {
  return getQuickAccessPrice(item) > 0;
}

function isQuickAccessItemAvailable(item, categoryMap) {
  const category = categoryMap?.get?.(item?.categoryId || item?.category) || null;
  return isCustomerVisibleItem(item) && isCustomerVisibleCategory(category) && hasLiveQuickAccessPrice(item);
}

function findQuickAccessMenuItem(items, name, categoryId, categoryMap = null) {
  const normalizedName = String(name || "").trim().toLowerCase();
  const normalizedCategoryId = String(categoryId || "").trim().toLowerCase();

  return (Array.isArray(items) ? items : []).find((item) => {
    if (!isCustomerVisibleItem(item)) return false;
    const itemName = String(item?.name || "").trim().toLowerCase();
    const itemCategoryId = String(item?.categoryId || item?.category || "").trim().toLowerCase();
    const category = categoryMap?.get?.(itemCategoryId) || categoryMap?.get?.(item?.categoryId) || null;
    const matchesCategory = itemCategoryId === normalizedCategoryId || itemCategoryId === normalizedCategoryId.replace(/\s+/g, "-");
    return itemName === normalizedName && matchesCategory && isCustomerVisibleCategory(category) && hasLiveQuickAccessPrice(item);
  });
}

function getQuickAccessCigaretteItems(items, categoryMap = null) {
  return (Array.isArray(items) ? items : []).filter((item) => {
    if (!isCustomerVisibleItem(item)) return false;
    const categoryId = String(item?.categoryId || item?.category || "").trim().toLowerCase();
    const name = String(item?.name || "").trim().toLowerCase();
    const category = categoryMap?.get?.(categoryId) || null;
    return categoryId === "cigarettes" && name !== "water bottle" && isCustomerVisibleCategory(category) && hasLiveQuickAccessPrice(item);
  });
}

function findBillerQuickAccessMenuItem(items, name, categoryId) {
  const normalizedName = String(name || "").trim().toLowerCase();
  const normalizedCategoryId = String(categoryId || "").trim().toLowerCase();

  return (Array.isArray(items) ? items : []).find((item) => {
    if (!isCustomerVisibleItem(item)) return false;

    const itemName = String(item?.name || "").trim().toLowerCase();
    const itemCategoryId = String(item?.categoryId || item?.category || "").trim().toLowerCase();
    const matchesCategory = itemCategoryId === normalizedCategoryId || itemCategoryId === normalizedCategoryId.replace(/\s+/g, "-");

    return itemName === normalizedName && matchesCategory && hasLiveQuickAccessPrice(item);
  });
}

function getBillerQuickAccessCigaretteItems(items) {
  return (Array.isArray(items) ? items : []).filter((item) => {
    if (!isCustomerVisibleItem(item)) return false;

    const categoryId = String(item?.categoryId || item?.category || "").trim().toLowerCase();
    const name = String(item?.name || "").trim().toLowerCase();

    return categoryId === "cigarettes" && name !== "water bottle" && hasLiveQuickAccessPrice(item);
  });
}

function isQuickAccessGroupAvailable(items, categoryMap, mode) {
  if (mode === "water") {
    const item = findQuickAccessMenuItem(items, "Water Bottle", "water-bottles", categoryMap);
    return Boolean(item && isQuickAccessItemAvailable(item, categoryMap));
  }

  if (mode === "cigarettes") {
    const cigaretteItems = getQuickAccessCigaretteItems(items, categoryMap);
    return Array.isArray(cigaretteItems) && cigaretteItems.length > 0;
  }

  return false;
}

function slugifyValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const TEST_UPI_CONFIG = {
  upiId: import.meta.env.VITE_TEST_UPI_ID || "9929637525-2@axl",
  payeeName: import.meta.env.VITE_TEST_UPI_PAYEE_NAME || "Angel Saini",
  staticQrImage: import.meta.env.VITE_PAYMENT_QR || "/testing-scanner.png"
};

function isPendingVerificationOrder(order) {
  return getBillerOrderClassification(order).isPendingVerification;
}

// Simple non-blocking toast helper used for payment retry UX (no alert popups)
function showToast(message, duration = 3000) {
  try {
    const id = `infusion-toast-${Date.now()}`;
    const el = document.createElement('div');
    el.id = id;
    el.textContent = message;
    Object.assign(el.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '8px 14px',
      borderRadius: '999px',
      background: 'rgba(17,24,39,0.95)',
      color: 'white',
      fontWeight: '700',
      zIndex: 9999,
      boxShadow: '0 6px 18px rgba(0,0,0,0.2)'
    });
    document.body.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity 200ms ease'; el.style.opacity = '0'; }, duration - 300);
    setTimeout(() => { try { document.body.removeChild(el); } catch (e) {} }, duration);
  } catch (e) {
    if (import.meta.env.DEV) console.log('Toast:', message);
  }
}

function rupees(value) {
  return `Rs. ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
}

function getOrderTimeLabel(order) {
  const rawTime = order?.createdAt || order?.timestamp || order?.date || order?.orderTime;
  if (!rawTime) return "";

  const parsedTime = new Date(rawTime);
  if (Number.isNaN(parsedTime.getTime())) return "";

  return parsedTime.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function formatOrderDateTime(createdAt) {
  if (!createdAt) return "Date unavailable";
  try {
    const date = new Date(createdAt);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-IN", { month: "short" });
    const year = date.getFullYear();
    const time = date.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${day} ${month} ${year} • ${time}`;
  } catch (e) {
    return "Date unavailable";
  }
}

function OrderLineCard({ line, order, highlightDetails = false }) {
  const safeLine = line || {};
  const quantity = Number(safeLine.quantity ?? safeLine.qty ?? 1);
  const basePrice = getBasePrice(safeLine);
  const addonText = getAddonDisplay(safeLine);
  const finalTotal = getFinalItemTotal(safeLine);
  const sizeLabel = normalizeVisibleSizeLabel(safeLine);
  const serveText = safeLine.serveType ? ` • ${safeLine.serveType}` : "";
  const itemName = safeLine.name || safeLine.title || safeLine.itemId || "Item";
  const orderTimeLabel = getOrderTimeLabel(order);
  const highlightClassName = highlightDetails ? "text-rose-600 font-black" : "";

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/95 px-4 py-3 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-start md:justify-between md:gap-4">
      <div>
        <p className="text-[15px] font-black uppercase tracking-[0.02em] text-blue-700">{itemName}</p>
        <p className="mt-1 text-sm font-semibold text-stone-700">
          {sizeLabel ? <>{sizeLabel}</> : null}
          {serveText ? <>{sizeLabel ? " • " : ""}<span className={highlightClassName}>{serveText}</span></> : null}
          {(sizeLabel || serveText) ? " • " : ""}
          {quantity} x {rupees(basePrice)}
          {addonText ? <span className={highlightClassName}>{addonText}</span> : null}
          {" = "}{rupees(finalTotal)}
        </p>
      </div>
      {orderTimeLabel && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 md:text-right">Order Time: {orderTimeLabel}</p>
      )}
    </div>
  );
}

function priceText(item, selectedSizeId) {
  if (!item?.sizes?.length) return rupees(0);
  if (selectedSizeId) return rupees(item.sizes.find((size) => size.id === selectedSizeId)?.price ?? item.sizes[0].price);
  const prices = item.sizes.map((size) => Number(size.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? rupees(min) : `${rupees(min)} - ${rupees(max)}`;
}

const serveOptionsByItemId = {
  "infusion-heritage-coffee": ["Kulhad", "Glass", "Cup"],
  "personal-blend-chai": ["Kulhad", "Glass"],
  "signature-infusion-chai": ["Kulhad", "Glass"],
  "hot-chocolate": ["Kulhad", "Glass", "Cup"],
  "core-coffee": ["Kulhad", "Glass", "Cup"],
  "black-coffee": ["Kulhad", "Glass", "Cup"]
};

function getServeOptions(item) {
  if (!item) return [];
  const category = String(item.category || item.categoryId || "").toLowerCase();
  const isHotDrinks = category === "hot-drinks" || category === "hot drinks";
  if (!isHotDrinks) return [];

  // Prioritize serveTypes field
  const safeServeTypes = Array.isArray(item.serveTypes) ? item.serveTypes : [];
  if (safeServeTypes.length > 0) return safeServeTypes;

  const safeServeOptions = Array.isArray(item.serveOptions) ? item.serveOptions : [];
  const safeServingOptions = Array.isArray(item.servingOptions) ? item.servingOptions : [];
  const safeItemServeOptions = Array.isArray(item.itemServeOptions) ? item.itemServeOptions : [];

  if (safeServeOptions.length > 0) return safeServeOptions;
  if (safeServingOptions.length > 0) return safeServingOptions;
  if (safeItemServeOptions.length > 0) return safeItemServeOptions;

  const name = String(item.name || item.itemName || "").toLowerCase();
  const subCategory = String(item.subCategory || item.subcategory || item.subcategoryName || "").toLowerCase();

  const hotCoffeeNames = [
    "black coffee",
    "core coffee",
    "hot chocolate",
    "infusion heritage hot coffee"
  ];
  const chaiNames = [
    "black tea",
    "green tea",
    "tulsi tea",
    "lemon tea",
    "honey lemon tea",
    "personal blend chai",
    "signature infusion chai"
  ];

  if (hotCoffeeNames.includes(name) || subCategory.includes("coffee")) {
    return ["Kulhad", "Glass", "Cup"];
  }
  if (chaiNames.includes(name) || subCategory.includes("chai")) {
    return ["Kulhad", "Glass"];
  }

  return [];
}

// centralized `api` client is provided by src/services/apiClient

function App() {
  const [route, setRoute] = useState(location.pathname);

  useEffect(() => {
    const onPop = () => setRoute(location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function navigate(path) {
    history.pushState(null, "", path);
    setRoute(path);
  }

  const normalizedRoute = route.replace(/\/+$/, "");
  if (normalizedRoute === "/counter") return <CustomerApp navigate={navigate} counterMode />;
  if (normalizedRoute === "/owner/forgot-password") return <OwnerApp navigate={navigate} />;
  if (normalizedRoute === "/biller/forgot-password") return <BillerApp navigate={navigate} />;
  if (normalizedRoute === "/order/biller") return <BillerApp navigate={navigate} />;
  if (normalizedRoute === "/order/owner") return <OwnerApp navigate={navigate} />;
  if (normalizedRoute === "/order" || normalizedRoute === "/order/") return <CustomerApp navigate={navigate} />;
  if (route.startsWith("/order/")) {
    const orderId = route.replace("/order/", "");
    if (!orderId) return <CustomerApp navigate={navigate} />;
    return <OrderTracking orderId={orderId} />;
  }
  // backward-compatibility: redirect old /admin URL and subpaths to /owner
  if (route.startsWith("/admin")) {
    const nextRoute = route.replace(/^\/admin/, "/owner");
    if (nextRoute !== route) {
      navigate(nextRoute);
      return null;
    }
  }
  if (route.startsWith("/owner")) {
    const ownerTabByPath = {
      "/owner/inventory": "inventory",
      "/owner/categories": "categories",
      "/owner/stock": "stock",
      "/owner/recipes": "recipes",
      "/owner/lowstock": "lowstock",
      "/owner/reports": "reports",
      "/owner/history": "history"
    };
    return <OwnerApp navigate={navigate} initialTab={ownerTabByPath[normalizedRoute] || "items"} />;
  }
  if (route.startsWith("/biller")) return <BillerApp navigate={navigate} />;
  return <CustomerApp navigate={navigate} />;
}

function CustomerApp({ navigate, counterMode = false }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategoryId] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [quickAccessMode, setQuickAccessMode] = useState(null);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [orderOnCounter, setOrderOnCounter] = useState(false);
  const [cart, setCart] = useState(() => loadCartFromStorage());
  const [loading, setLoading] = useState(true);
  const [appError, setAppError] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [waterBottleModalOpen, setWaterBottleModalOpen] = useState(false);
  const [cigarettesModalOpen, setCigarettesModalOpen] = useState(false);
  const [cocFallbackVisible, setCocFallbackVisible] = useState(false);

  function handleSetActiveCategory(categoryId) {
    setActiveCategoryId(categoryId);
    setSelectedSubcategory(null);
  }

  function handleQuickAccess(mode) {
    if (mode === "water" && showWaterBottleQuickAccess) {
      setWaterBottleModalOpen(true);
      setQuickAccessMode((current) => (current === mode ? null : mode));
      return;
    }
    if (mode === "cigarettes" && showCigaretteQuickAccess) {
      setCigarettesModalOpen(true);
      setQuickAccessMode((current) => (current === mode ? null : mode));
      return;
    }
    setQuickAccessMode(null);
  }

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const retry = params.get("retryOrder");
      if (retry) {
        (async () => {
          try {
            const order = await api(`/orders/public/${retry}`);
            if (!order) return;
            const items = Array.isArray(order.items) ? order.items : [];
            const subtotal = items.reduce((sum, line) => sum + Number(line.unitPrice || line.price || 0) * Number(line.quantity || 1), 0);
            const total = Number(order.total ?? subtotal);
            setPendingPaymentData({
              customerName: order.customerName,
              phone: order.phone,
              tableNumber: order.tableNumber,
              orderId: order.orderId || order.id || order._id,
              items: items.map((line) => ({ itemId: line.itemId, sizeId: line.sizeId, quantity: line.quantity, serveType: line.serveType })),
              subtotal,
              total
            });
            setPaymentModalOpen(true);
            history.replaceState(null, "", window.location.pathname);
          } catch (error) {
            // ignore
          }
        })();
      }
    } catch (error) {}
  }, []);

  function handleOrderOnCounterClick() {
    if (counterMode) return navigate("/counter");
    setCounterModalOpen(true);
  }

  function openCart(onCounter = false) {
    setOrderOnCounter(onCounter);
    setCartOpen(true);
  }

  function closeCart() {
    setCartOpen(false);
    setOrderOnCounter(false);
  }

  useEffect(() => {
    const pendingCocOrder = readPendingCocOrder();
    if (pendingCocOrder?.pendingApproval && pendingCocOrder?.orderId) {
      setOrderPlaced(preparePrintableOrder(pendingCocOrder));
    }
    setCocFallbackVisible(false);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [categoryData, menuData] = await Promise.all([api("/categories"), api("/menu")]);
        const safeCategories = ensureActiveCategories(categoryData);
        const safeItems = ensureActiveMenuItems(menuData, safeCategories);
        setCategories(safeCategories.filter((category) => isCustomerVisibleCategory(category)));
        setItems(safeItems.filter((item) => isCustomerVisibleItem(item)));
        setAppError(null);
        logLoadStats("CustomerApp", {
          rawCategories: Array.isArray(categoryData) ? categoryData.length : 0,
          activeCategories: safeCategories.length,
          rawItems: Array.isArray(menuData) ? menuData.length : 0,
          activeItems: safeItems.length,
          rawSubcategories: loadSubcategoryConfig(),
          activeSubcategories: Object.keys(loadSubcategoryConfig()).length,
          deletedCount: 0
        });
      } catch (error) {
        // For Customer app, never show demo menu automatically.
        setAppError("Menu could not be loaded. Please try again.");
        // Clear items/categories so demo defaults are not displayed.
        setCategories([]);
        setItems([]);
        logLoadStats("CustomerApp (load-failed)", {
          rawCategories: 0,
          activeCategories: 0,
          rawItems: 0,
          activeItems: 0,
          rawSubcategories: loadSubcategoryConfig(),
          activeSubcategories: Object.keys(loadSubcategoryConfig()).length,
          deletedCount: 0,
          error: String(error && error.message ? error.message : error)
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    function handleOwnerDataUpdated() {
      fetchData();
    }

    function handleStorage(event) {
      if (!event.key) return;
      if (event.key === SUBCATEGORY_CONFIG_KEY || event.key === DELETED_SUBCATEGORY_CONFIG_KEY) {
        fetchData();
      }
    }

    window.addEventListener("ownerDataUpdated", handleOwnerDataUpdated);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("ownerDataUpdated", handleOwnerDataUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  useEffect(() => {
    if (!orderPlaced || orderPlaced._source !== "coc" || !orderPlaced.pendingApproval || !orderPlaced.orderId) return;

    let cancelled = false;
    let timer = null;
    let failedAttempts = 0;
    let fallbackTimer = null;

    const clearStuckPending = () => {
      clearPendingCocOrder();
      setCocFallbackVisible(false);
      setOrderPlaced(null);
      navigate("/");
    };

    const pollApproval = async () => {
      try {
        const publicOrder = await orderService.getPublicOrder(orderPlaced.orderId);
        if (cancelled) return;

        failedAttempts = 0;
        const nextStatus = normalizeStatus(publicOrder?.status || publicOrder?.orderStatus || orderPlaced.status);
        const nextRequestStatus = normalizeStatus(publicOrder?.requestStatus || orderPlaced.requestStatus);
        const nextApprovalStatus = normalizeStatus(publicOrder?.approvalStatus || orderPlaced.approvalStatus);
        const nextPaymentStatus = normalizeStatus(publicOrder?.paymentStatus || orderPlaced.paymentStatus);
        const nextOrderStatus = normalizeStatus(publicOrder?.orderStatus || publicOrder?.status || orderPlaced.orderStatus || orderPlaced.status);
        const approvedStatuses = new Set(["approved", "confirmed", "accepted", "success", "completed"]);
        const pendingStatuses = new Set(["pending", "waiting", "awaiting approval", "awaiting_approval", "request pending", "request_pending"]);
        const rejectedStatuses = new Set(["cancelled", "rejected", "payment issue", "payment rejected", "payment_rejected", "payment_issue"]);

        if (import.meta.env.DEV) {
          console.log("COC POLL RESULT", {
            savedOrderId: orderPlaced.orderId,
            status: nextStatus,
            requestStatus: nextRequestStatus,
            approvalStatus: nextApprovalStatus,
            paymentStatus: nextPaymentStatus,
            orderStatus: nextOrderStatus
          });
        }

        const isApproved = [nextStatus, nextRequestStatus, nextApprovalStatus, nextPaymentStatus, nextOrderStatus].some((candidate) => approvedStatuses.has(candidate))
          || [nextStatus, nextRequestStatus, nextApprovalStatus, nextPaymentStatus, nextOrderStatus].some((candidate) => candidate && candidate.includes("approved"))
          || [nextStatus, nextRequestStatus, nextApprovalStatus, nextPaymentStatus, nextOrderStatus].some((candidate) => candidate && candidate.includes("confirmed"));
        const isRejected = rejectedStatuses.has(nextStatus) || rejectedStatuses.has(nextRequestStatus) || rejectedStatuses.has(nextApprovalStatus) || rejectedStatuses.has(nextPaymentStatus) || rejectedStatuses.has(nextOrderStatus);

        if (!publicOrder || !publicOrder.orderId) {
          clearPendingCocOrder();
          clearStuckPending();
          return;
        }

        if (isApproved || isRejected) {
          const approvedOrder = preparePrintableOrder({
            ...orderPlaced,
            ...publicOrder,
            pendingApproval: false,
            status: publicOrder?.status || orderPlaced.status || (isApproved ? "confirmed" : "cancelled"),
            paymentStatus: publicOrder?.paymentStatus || orderPlaced.paymentStatus || (isApproved ? "paid" : "rejected")
          });
          setOrderPlaced((current) => current && current._source === "coc" ? approvedOrder : current);
          clearPendingCocOrder();
          return;
        }
      } catch (error) {
        failedAttempts += 1;
        if (failedAttempts >= 25) {
          setCocFallbackVisible(true);
        }
      }

      if (!cancelled) {
        timer = setTimeout(pollApproval, 2500);
      }
    };

    fallbackTimer = setTimeout(() => {
      if (!cancelled) {
        setCocFallbackVisible(true);
      }
    }, 60000);

    timer = setTimeout(pollApproval, 1000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [navigate, orderPlaced]);

  useEffect(() => {
    if (!orderPlaced || orderPlaced._source !== "coc" || orderPlaced.pendingApproval) return;

    const timer = setTimeout(() => {
      setOrderPlaced(null);
      navigate("/");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, orderPlaced]);

  useEffect(() => {
    function onStorage(event) {
      if (!event.key) return;
      if (event.key === "infusion-cart") {
        setCart(parseCartStorageValue(event.newValue));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const normalizedItems = useMemo(() => items.map(normalizeMenuItem), [items]);
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const liveWaterBottleItem = useMemo(() => findQuickAccessMenuItem(items, "Water Bottle", "water-bottles", categoryMap), [items, categoryMap]);
  const liveCigaretteItems = useMemo(() => getQuickAccessCigaretteItems(items, categoryMap), [items, categoryMap]);
  const showWaterBottleQuickAccess = useMemo(() => isQuickAccessGroupAvailable(items, categoryMap, "water"), [items, categoryMap]);
  const showCigaretteQuickAccess = useMemo(() => isQuickAccessGroupAvailable(items, categoryMap, "cigarettes"), [items, categoryMap]);
  const hasWaterBottle = Boolean(liveWaterBottleItem && isQuickAccessItemAvailable(liveWaterBottleItem, categoryMap));
  const cigaretteCount = Array.isArray(liveCigaretteItems) ? liveCigaretteItems.length : 0;

  if (import.meta.env.DEV) {
    console.log("QUICK ACCESS AVAILABILITY", {
      hasWaterBottle,
      cigaretteCount
    });
  }
  const preferredCategoryOrder = useMemo(() => ["hot-drinks", "coconut-water", "cold-drinks", "snacks", "dessert", "energy-drinks"], []);

  const orderedCategories = useMemo(() => {
    return [...categories]
      .filter((category) => isCustomerVisibleCategory(category) && !isCustomerHiddenCategory(category))
      .sort((left, right) => {
        const leftIndex = preferredCategoryOrder.indexOf(normalizeCategoryId(left.id));
        const rightIndex = preferredCategoryOrder.indexOf(normalizeCategoryId(right.id));
        const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
        const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
        if (normalizedLeft !== normalizedRight) return normalizedLeft - normalizedRight;
        return String(left.name || "").localeCompare(String(right.name || ""));
      });
  }, [categories, preferredCategoryOrder]);

  const filteredItems = useMemo(() => {
    const filtered = normalizedItems.filter((item) => {
      const categoryId = normalizeCategoryId(item.categoryId || item.category || "");
      if (HIDDEN_CUSTOMER_CATEGORY_IDS.has(categoryId)) return false;

      const category = categoryMap.get(item.categoryId);
      if (!category || category.isDeleted === true || item.isDeleted === true) return false;
      const matchesCategory = activeCategory === "all" || normalizeCategoryId(item.categoryId || item.category) === normalizeCategoryId(activeCategory);
      const matchesSubcategory = !selectedSubcategory || item.subcategory === selectedSubcategory;
      const matchesQuery = !query || `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesSubcategory && matchesQuery;
    });

    return sortMenuItemsForDisplay(filtered, {
      activeCategory,
      selectedSubcategory,
      query
    });
  }, [normalizedItems, activeCategory, selectedSubcategory, query, categoryMap]);

  const cartTotals = calculateTotals(cart);

  function handleAddToCart(item, sizeId, quantity = 1, serveType = "", options = {}) {
    setCart((current) => addCartItem(current, item, sizeId, quantity, serveType, options));
  }

  function handleUpdateQuantity(key, delta) {
    setCart((current) => updateCartQuantity(current, key, delta));
  }

  function handleAddQuickAccessWaterBottle(quantity = 1) {
    const waterBottleItem = findQuickAccessMenuItem(items, "Water Bottle", "water-bottles", categoryMap);
    if (!waterBottleItem) {
      setWaterBottleModalOpen(false);
      return;
    }

    setCart((current) => addCartItem(current, waterBottleItem, "default", quantity, "", { serveTypeFallback: "default" }));
    setWaterBottleModalOpen(false);
  }

  function handleAddQuickAccessCigarettes(items = []) {
    if (!Array.isArray(items) || items.length === 0) {
      setCigarettesModalOpen(false);
      return;
    }

    const cigaretteItems = items.filter((item) => Number(item.quantity || 0) > 0);
    if (cigaretteItems.length === 0) {
      setCigarettesModalOpen(false);
      return;
    }

    setCart((current) => {
      let nextCart = current;
      cigaretteItems.forEach((item) => {
        const quantity = Number(item.quantity || 0);
        if (!quantity) return;

        const realItem = (Array.isArray(items) ? items : []).find((candidate) => candidate.id === item.id) || item;
        if (import.meta.env.DEV) console.log("CIGARETTE addToCart REAL ITEM", realItem, "QTY", quantity);
        nextCart = addCartItem(nextCart, realItem, "default", quantity, "", { serveTypeFallback: "default" });
      });
      return nextCart;
    });

    setCigarettesModalOpen(false);
  }

  async function placeOrder(customer) {
    if (customer.paymentMethod === "cash") {
      try {
        const request = await orderService.createCocRequest({
          ...customer,
          items: cart.map(({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }) => ({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }))
        });
        setCart([]);
        setCartOpen(false);
        const pendingOrder = preparePrintableOrder({
          ...request,
          _source: "coc",
          pendingApproval: true,
          total: cartTotals.total,
          items: cart
        });
        setOrderPlaced(pendingOrder);
        savePendingCocOrder(pendingOrder);
        try { await ordersStore.loadOrders(); } catch (error) {}
        return;
      } catch (error) {
        if (demoMode.isDemoModeEnabled()) {
          const order = demoMode.createDemoOrder(
            customer,
            cart.map(({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }) => ({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }))
          );
          demoMode.addDemoOrder(order);
          setCart([]);
          setCartOpen(false);
          setOrderPlaced(preparePrintableOrder(order));
          try { await ordersStore.loadOrders(); } catch (error) {}
          return;
        }
        throw error;
      }
    }

    if (customer.paymentMethod === "online") {
      setPendingPaymentData({
        customerName: customer.customerName,
        phone: customer.phone,
        tableNumber: customer.tableNumber,
        orderId: generateOrderId(),
        items: cart.map(({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }) => ({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons })),
        subtotal: cartTotals.total,
        total: cartTotals.total
      });
      setPaymentModalOpen(true);
      return;
    }

    const order = preparePrintableOrder(await orderService.createOrder({
      ...customer,
      items: cart.map(({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }) => ({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }))
    }));
    setCart([]);
    setCartOpen(false);
    setOrderPlaced(order);
    try { await ordersStore.loadOrders(); } catch (error) {}
  }

  async function handleIHavePaid() {
    if (!pendingPaymentData) return;
    try {
      const orderKey = pendingPaymentData.orderId;
      let existing = null;
      try {
        existing = await orderService.getPublicOrder(orderKey);
      } catch (error) {
        existing = null;
      }

      const isRetry = existing && ["rejected", "payment_rejected", "payment_issue"].includes(String(existing.paymentStatus || "").toLowerCase());
      if (existing && (existing._id || existing.id || existing.orderId)) {
        const publicId = existing.orderId || existing.id || existing._id;
        await orderService.retryPublicOrder(publicId);
      } else {
        const payload = {
          customerName: pendingPaymentData.customerName,
          phone: pendingPaymentData.phone,
          orderId: pendingPaymentData.orderId,
          tableNumber: pendingPaymentData.tableNumber,
          items: pendingPaymentData.items,
          paymentMethod: "UPI_INTENT_OR_STATIC_QR",
          paymentStatus: "pending_verification",
          status: "pending"
        };
        await orderService.createOrder(payload);
      }

      setPaymentModalOpen(false);
      setPendingPaymentData(null);
      showToast(isRetry ? "Payment resubmitted. Waiting for verification." : "Payment submitted. Waiting for verification.");
      navigate(`/order/${orderKey}`);
      try { await ordersStore.loadOrders(); } catch (error) {}
    } catch (error) {
      console.error("Failed to create or retry order after payment:", error);
      showToast(error.message || "Failed to submit order. Please try again.");
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f6dfc6_0%,#f9b8a9_38%,#f5e5ce_68%,#d8dec8_100%)] text-stone-950">
      <div className="pointer-events-none fixed -left-12 top-24 h-56 w-56 rounded-full bg-white/30 blur-3xl" />
      <div className="pointer-events-none fixed right-0 top-10 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-7 px-4 py-5 sm:px-6 lg:px-8">
        <TopBar
          cartCount={cartTotals.itemCount}
          onCart={() => openCart(false)}
          onOrderOnCounter={handleOrderOnCounterClick}
          onBack={counterMode ? () => navigate("/") : undefined}
        />
        <BrandHeader query={query} setQuery={setQuery} />
        <QuickAccessSection quickAccessMode={quickAccessMode} onQuickAccess={handleQuickAccess} showWaterBottle={showWaterBottleQuickAccess} showCigarettes={showCigaretteQuickAccess} />
        <CategoryChips categories={orderedCategories} active={activeCategory} setActive={handleSetActiveCategory} />
        {loadSubcategoryConfig()[activeCategory] ? (
          <SubcategoryChips options={loadSubcategoryConfig()[activeCategory]} active={selectedSubcategory} setActive={setSelectedSubcategory} />
        ) : null}

        <CustomerMenu
          filteredItems={filteredItems}
          loading={loading}
          appError={appError}
          counterMode={counterMode}
          onDetail={setDetail}
          onAdd={handleAddToCart}
        />
      </section>
      {detail && <DetailModal key={detail.id} item={detail} onClose={() => setDetail(null)} onAdd={handleAddToCart} />}
      {waterBottleModalOpen && <WaterBottleModal item={liveWaterBottleItem} onClose={() => setWaterBottleModalOpen(false)} onAdd={handleAddQuickAccessWaterBottle} />}
      {cigarettesModalOpen && <CigarettesModal items={liveCigaretteItems} onClose={() => setCigarettesModalOpen(false)} onAdd={handleAddQuickAccessCigarettes} />}
      {cartOpen && <CartDrawer cart={cart} total={cartTotals.total} onClose={closeCart} onQty={handleUpdateQuantity} onCheckout={placeOrder} orderOnCounter={counterMode} />}
      {orderPlaced && <OrderSuccess order={orderPlaced} onClose={() => setOrderPlaced(null)} showFallbackAction={cocFallbackVisible} onFallbackAction={() => { clearPendingCocOrder(); setCocFallbackVisible(false); setOrderPlaced(null); navigate("/"); }} />}
      {paymentModalOpen && pendingPaymentData && (
        <PaymentModal
          data={pendingPaymentData}
          onClose={() => { setPaymentModalOpen(false); setPendingPaymentData(null); }}
          onIHavePaid={handleIHavePaid}
        />
      )}
      {counterModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 text-center">
            <h2 className="text-2xl font-black">Please visit the counter</h2>
            <p className="mt-4 text-sm text-stone-600">Please go to the counter and ask the biller to take your order.</p>
            <div className="mt-6 flex justify-center">
              <button onClick={() => setCounterModalOpen(false)} className="rounded-full bg-black px-6 py-3 font-black text-white">Okay</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ItemForm({ categories, editingItem, onCancelEdit, onSaved }) {
  const [form, setForm] = useState({ name: "", categoryId: categories[0]?.id || "", subCategoryId: "", subCategoryName: "", description: "", image: "", active: true, price: "", serveOptions: [], addons: [] });
  const [message, setMessage] = useState("");
  const [newServeOption, setNewServeOption] = useState("");
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");
  const subcategoryOptions = loadSubcategoryConfig()[form.categoryId] || [];
  const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
  const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"]);

  function buildSubcategoryState(categoryId, subcategoryName = "") {
    const options = loadSubcategoryConfig()[categoryId] || [];
    const resolvedName = options.includes(subcategoryName) ? subcategoryName : "";
    return {
      subCategoryName: resolvedName,
      subCategoryId: resolvedName ? slugifyValue(resolvedName) : ""
    };
  }

  useEffect(() => {
    if (!form.categoryId && categories[0]) setForm((current) => ({ ...current, categoryId: categories[0].id }));
  }, [categories]);

  useEffect(() => {
    if (editingItem) {
      const subcategoryName = editingItem.subCategoryName || editingItem.subcategoryName || editingItem.subcategory || "";
      const subcategoryId = editingItem.subCategoryId || editingItem.subcategoryId || slugifyValue(subcategoryName);
      const firstSize = editingItem.sizes?.[0] || {};
      const existingServeOptions = Array.isArray(editingItem.serveOptions) ? editingItem.serveOptions : [];
      const existingAddons = Array.isArray(editingItem.addons)
        ? editingItem.addons.map((addon) => ({
            id: String(addon.id || addon.name || `addon-${Date.now()}`).trim(),
            name: String(addon.name || "").trim(),
            description: String(addon.description || "").trim(),
            price: Number.isFinite(Number(addon.price)) ? Number(addon.price) : 0
          }))
          .filter((addon) => addon.name)
        : editingItem.addons || [];

      setForm({
        id: editingItem.id,
        name: editingItem.name,
        categoryId: editingItem.categoryId,
        subCategoryId: subcategoryId,
        subCategoryName: subcategoryName,
        description: editingItem.description || "",
        image: editingItem.image || "",
        active: editingItem.active !== false,
        price: Number.isFinite(Number(firstSize.price)) ? String(firstSize.price) : "",
        serveOptions: existingServeOptions,
        addons: existingAddons
      });
      setNewServeOption("");
      setNewAddonName("");
      setNewAddonPrice("");
      setMessage("");
    }
  }, [editingItem]);

  function updateCategory(categoryId) {
    setForm((current) => ({ ...current, categoryId, ...buildSubcategoryState(categoryId) }));
  }

  function updateSubcategory(subCategoryName) {
    setForm((current) => ({ ...current, ...buildSubcategoryState(current.categoryId, subCategoryName) }));
  }

  function addServeOption() {
    const option = String(newServeOption || "").trim();
    if (!option) return;
    if (form.serveOptions.includes(option)) {
      setMessage("Serve option already added.");
      return;
    }
    setForm((current) => ({ ...current, serveOptions: [...(Array.isArray(current.serveOptions) ? current.serveOptions : []), option] }));
    setNewServeOption("");
    setMessage("");
  }

  function removeServeOption(option) {
    setForm((current) => ({
      ...current,
      serveOptions: (Array.isArray(current.serveOptions) ? current.serveOptions : []).filter((item) => item !== option)
    }));
  }

  function addAddon() {
    const name = String(newAddonName || "").trim();
    const priceValue = String(newAddonPrice || "").trim();
    const price = Math.round(Number(priceValue));

    if (!name) {
      setMessage("Please enter add-on name.");
      return;
    }
    if (priceValue === "" || !Number.isFinite(price) || price < 0) {
      setMessage("Please enter a valid add-on price.");
      return;
    }

    const addonId = String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `addon-${Date.now()}`;
    const newAddon = { id: addonId, name, price };

    setForm((current) => ({
      ...current,
      addons: [...(Array.isArray(current.addons) ? current.addons : []), newAddon]
    }));
    setNewAddonName("");
    setNewAddonPrice("");
    setMessage("");
  }

  function removeAddon(addonId) {
    setForm((current) => ({
      ...current,
      addons: (Array.isArray(current.addons) ? current.addons : []).filter((addon) => addon.id !== addonId)
    }));
  }

  async function uploadPhoto(file) {
    if (!file) return;
    if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
      throw new Error("Please upload a JPG, PNG, WEBP, or GIF image.");
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      throw new Error("Photo must be 5MB or smaller.");
    }

    setMessage("");
    const body = new FormData();
    body.append("photo", file);
    const data = await menuService.uploadPhoto(body);
    if (!data?.url) throw new Error("Upload did not return an image URL.");
    setForm((current) => ({ ...current, image: data.url }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      if (String(form.price ?? "").trim() === "") {
        throw new Error("Please enter a valid price.");
      }
      const numericPrice = Math.round(Number(form.price));
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        throw new Error("Please enter a valid price.");
      }

      await api("/menu", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          sizes: [
            {
              id: "regular",
              name: "Regular",
              label: "Regular",
              price: numericPrice,
              sortOrder: 1
            }
          ],
          serveOptions: Array.isArray(form.serveOptions) ? form.serveOptions : [],
          addons: Array.isArray(form.addons) ? form.addons : form.addons || []
        })
      });
      setForm({ name: "", categoryId: categories[0]?.id || "", subCategoryId: "", subCategoryName: "", description: "", image: "", active: true, price: "", serveOptions: [], addons: [] });
      setNewServeOption("");
      setNewAddonName("");
      setNewAddonPrice("");
      setMessage("Saved.");
      onSaved();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black">{editingItem ? "Edit item" : "Create item"}</h2>
        {editingItem && <button type="button" onClick={onCancelEdit} className="rounded-full bg-stone-100 px-3 py-2 text-xs font-black">Cancel</button>}
      </div>
      <div className="mt-4 space-y-3">
        <input required className="field bg-stone-50" placeholder="Item name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <select required className="field bg-stone-50" value={form.categoryId} onChange={(event) => updateCategory(event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        <select className="field bg-stone-50" value={form.subCategoryId || ""} onChange={(event) => updateSubcategory(subcategoryOptions.find((subcategory) => slugifyValue(subcategory) === event.target.value) || "")}>
          <option value="">Select sub category</option>
          {subcategoryOptions.map((subcategory) => <option key={subcategory} value={slugifyValue(subcategory)}>{subcategory}</option>)}
        </select>
        <input className="field bg-stone-50" placeholder="Photo URL" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} />
        <label className="block rounded-2xl bg-stone-50 p-3 text-sm font-black text-stone-600">
          Upload photo
          <input type="file" accept="image/*" className="mt-2 block w-full text-xs" onChange={(event) => uploadPhoto(event.target.files?.[0]).catch((err) => setMessage(err.message))} />
        </label>
        {form.image ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-3">
            <p className="text-xs font-bold text-stone-500">Photo preview</p>
            <img src={imageUrl(form.image)} alt="Item preview" className="mt-2 h-36 w-full rounded-xl object-cover" />
          </div>
        ) : null}
        <textarea className="field min-h-24 resize-none bg-stone-50" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <div className="flex gap-4 text-sm font-bold">
          <label><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Active</label>
        </div>
        <input
          required
          placeholder="Price (₹)"
          type="number"
          min="0"
          step="0.01"
          className="field w-full bg-stone-50 p-4 text-lg font-black"
          value={form.price}
          onChange={(event) => setForm({ ...form, price: event.target.value })}
        />
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div className="text-sm font-black text-stone-700">Serve Options</div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              className="field bg-white"
              placeholder="Option name (e.g. Kulhad)"
              value={newServeOption}
              onChange={(event) => setNewServeOption(event.target.value)}
            />
            <button type="button" onClick={addServeOption} className="rounded-full bg-black px-5 py-3 text-sm font-black text-white">
              Add option
            </button>
          </div>
          {Array.isArray(form.serveOptions) && form.serveOptions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {form.serveOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => removeServeOption(option)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-stone-700 ring-1 ring-stone-200"
                >
                  {option}
                  <span className="text-stone-400">×</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div className="text-sm font-black text-stone-700">Add-ons</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="text"
              className="field bg-white"
              placeholder="Add-on name"
              value={newAddonName}
              onChange={(event) => setNewAddonName(event.target.value)}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              className="field bg-white"
              placeholder="Price"
              value={newAddonPrice}
              onChange={(event) => setNewAddonPrice(event.target.value)}
            />
          </div>
          <button type="button" onClick={addAddon} className="mt-3 rounded-full bg-black px-5 py-3 text-sm font-black text-white">
            Add add-on
          </button>
          {Array.isArray(form.addons) && form.addons.length > 0 ? (
            <div className="mt-3 space-y-2">
              {form.addons.map((addon) => (
                <div key={addon.id} className="rounded-2xl border border-stone-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-stone-800">{addon.name}</div>
                      {addon.description ? <p className="text-xs text-stone-500">{addon.description}</p> : null}
                    </div>
                    <button type="button" onClick={() => removeAddon(addon.id)} className="rounded-full bg-stone-100 px-3 py-2 text-xs font-black text-stone-700">Remove</button>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-stone-600">Price: ₹{addon.price}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {message && <p className="text-sm font-bold text-stone-600">{message}</p>}
        <button className="w-full rounded-full bg-black px-5 py-4 font-black text-white">Save item</button>
      </div>
    </form>
  );
}

function CategoryAdmin({ categories, onSaved }) {
  const [name, setName] = useState("");
  const [subParent, setSubParent] = useState(categories[0]?.id || "");
  const [subName, setSubName] = useState("");
  const [subConfig, setSubConfig] = useState(() => loadSubcategoryConfig());
  const [deletedSubConfig, setDeletedSubConfig] = useState(() => loadDeletedSubcategoryConfig());
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!subParent && categories[0]) setSubParent(categories[0].id);
  }, [categories]);

  function refreshSubcategories() {
    setSubConfig(loadSubcategoryConfig());
    setDeletedSubConfig(loadDeletedSubcategoryConfig());
  }

  useEffect(() => {
    function syncSubcategories() {
      refreshSubcategories();
    }

    function handleStorage(event) {
      if (!event.key) return;
      if (event.key === SUBCATEGORY_CONFIG_KEY || event.key === DELETED_SUBCATEGORY_CONFIG_KEY) {
        syncSubcategories();
      }
    }

    window.addEventListener("ownerDataUpdated", syncSubcategories);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("ownerDataUpdated", syncSubcategories);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    const normalizedName = String(name || "").trim();
    if (!normalizedName) return;
    await menuService.createCategory({ name: normalizedName, sortOrder: categories.length + 1 });
    setName("");
    onSaved();
    dispatchOwnerDataUpdated({ source: "categoryCreated" });
  }

  function submitSubcategory(event) {
    event.preventDefault();
    const normalizedSubName = String(subName || "").trim();
    if (!subParent || !normalizedSubName) return;
    const current = loadSubcategoryConfig();
    const currentDeleted = loadDeletedSubcategoryConfig();
    const next = { ...current };
    next[subParent] = Array.from(new Set([...(next[subParent] || []), normalizedSubName]));
    saveSubcategoryConfig(next);
    const deleted = { ...currentDeleted };
    deleted[subParent] = (deleted[subParent] || []).filter((entry) => entry.name !== normalizedSubName);
    if (!deleted[subParent] || deleted[subParent].length === 0) delete deleted[subParent];
    saveDeletedSubcategoryConfig(deleted);
    setSubConfig(next);
    setDeletedSubConfig(deleted);
    setSubName("");
    onSaved();
  }

  function deleteCategory(id) {
    setConfirmDelete({ type: "category", id });
  }

  function deleteSubcategory(parentId, nameToDelete) {
    setConfirmDelete({ type: "subcategory", parentId, name: nameToDelete });
  }

  async function confirmDeletion() {
    if (!confirmDelete) return;
    const action = confirmDelete;
    try {
    if (action.type === "category") {
      await menuService.deleteCategory(action.id);
      dispatchOwnerDataUpdated({ source: "categoryDeleted", id: action.id });
      setConfirmDelete(null);
      onSaved();
      return;
    }
    if (action.type === "subcategory") {
      const next = { ...loadSubcategoryConfig() };
      next[action.parentId] = (next[action.parentId] || []).filter((s) => s !== action.name);
      if (!next[action.parentId] || next[action.parentId].length === 0) delete next[action.parentId];
      saveSubcategoryConfig(next);
      const deleted = { ...loadDeletedSubcategoryConfig() };
      const remaining = (deleted[action.parentId] || []).filter((entry) => entry.name !== action.name);
      remaining.push({ name: action.name, deletedAt: new Date().toISOString() });
      deleted[action.parentId] = remaining;
      saveDeletedSubcategoryConfig(deleted);
      setSubConfig(next);
      setDeletedSubConfig(deleted);
      setConfirmDelete(null);
      onSaved();
    }
    } catch (error) {
      console.error("Failed to delete category or subcategory:", error);
    } finally {
      if (action) {
        setConfirmDelete(null);
      }
    }
  }

  function cancelDeletion() {
    setConfirmDelete(null);
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="order-2 rounded-[1.5rem] bg-white p-4 lg:order-none">
        {categories.map((category) => (
          <div key={category.id} className="border-b py-3 last:border-0">
            <div className="flex items-center justify-between">
              <span className="font-black">{category.name}</span>
              <button type="button" onClick={() => deleteCategory(category.id)} className="rounded-full p-2 hover:bg-red-50"><Trash2 size={17} /></button>
            </div>
            {(subConfig[category.id] || []).length > 0 && (
              <div className="mt-2 ml-3 space-y-2">
                {(subConfig[category.id] || []).map((sub) => (
                  <div key={sub} className="flex items-center justify-between text-sm text-stone-600">
                    <span>- {sub}</span>
                    <button type="button" onClick={() => deleteSubcategory(category.id, sub)} className="rounded-full p-1 hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="order-1 space-y-4 lg:order-none">
        <form onSubmit={submit} className="rounded-[1.5rem] bg-white p-5">
          <h2 className="text-xl font-black">New category</h2>
          <input required className="field mt-4 bg-stone-50" placeholder="Category name" value={name} onChange={(event) => setName(event.target.value)} />
          <button className="mt-3 w-full rounded-full bg-black px-5 py-4 font-black text-white">Save category</button>
        </form>

        <form onSubmit={submitSubcategory} className="rounded-[1.5rem] bg-white p-5">
          <h2 className="text-xl font-black">New sub category</h2>
          <select required className="field mt-4 bg-stone-50" value={subParent} onChange={(e) => setSubParent(e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input required className="field mt-3 bg-stone-50" placeholder="Sub category name" value={subName} onChange={(e) => setSubName(e.target.value)} />
          <button className="mt-3 w-full rounded-full bg-black px-5 py-4 font-black text-white">Save sub category</button>
        </form>
      </div>
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={confirmDelete?.type === "category" ? "Delete category?" : `Delete subcategory \"${confirmDelete?.name}\"?`}
        message={confirmDelete?.type === "category"
          ? "This will move the category to Recently Deleted so it can be restored later."
          : "This will move the subcategory to Recently Deleted so it can be restored later."}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeletion}
        onCancel={cancelDeletion}
      />
    </section>

  );
}

function RecentlyDeletedPanel({ categories, deletedCategories, deletedItems, deletedSubcategories, deletedInventories = [], onRestoreCategory, onRestoreItem, onRestoreSubcategory, onRestoreInventory, onRequestPermanentDelete }) {
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeDeletedCategories = Array.isArray(deletedCategories) ? deletedCategories : [];
  const safeDeletedItems = Array.isArray(deletedItems) ? deletedItems : [];
  const safeDeletedSubcategories = deletedSubcategories && typeof deletedSubcategories === "object" ? deletedSubcategories : {};
  const safeDeletedInventories = Array.isArray(deletedInventories) ? deletedInventories : [];
  const categoryNameById = useMemo(() => new Map(safeCategories.map((category) => [category.id, category.name])), [safeCategories]);
  const deletedCategoryNameById = useMemo(() => new Map(safeDeletedCategories.map((category) => [category.id, category.name])), [safeDeletedCategories]);
  const hasItems = safeDeletedItems.length > 0;
  const hasCategories = safeDeletedCategories.length > 0;
  const hasSubcategories = Object.keys(safeDeletedSubcategories).length > 0;
  const hasInventories = safeDeletedInventories.length > 0;

  return (
    <section className="space-y-5">
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Recently deleted</h2>
            <p className="mt-1 text-sm text-stone-500">Restore items, categories, subcategories, and inventory records before they are removed permanently.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black">Items</h3>
          <div className="mt-4 space-y-3">
            {!hasItems && <p className="text-sm text-stone-500">No deleted items.</p>}
            {safeDeletedItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-stone-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{item.name}</p>
                    <p className="text-xs text-stone-500">{categoryNameById.get(item.categoryId) || item.categoryId || "Unknown category"}</p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-stone-600">Item</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => onRestoreItem(item.id)} className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">Restore</button>
                  <button type="button" onClick={() => onRequestPermanentDelete({ type: "permanent-item", id: item.id, name: item.name })} className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700">Delete forever</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black">Categories</h3>
          <div className="mt-4 space-y-3">
            {!hasCategories && <p className="text-sm text-stone-500">No deleted categories.</p>}
            {safeDeletedCategories.map((category) => (
              <div key={category.id} className="rounded-2xl border border-stone-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{category.name}</p>
                    <p className="text-xs text-stone-500">Category ID: {category.id}</p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-stone-600">Category</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => onRestoreCategory(category.id)} className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">Restore</button>
                  <button type="button" onClick={() => onRequestPermanentDelete({ type: "permanent-category", id: category.id, name: category.name })} className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700">Delete forever</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black">Subcategories</h3>
          <div className="mt-4 space-y-3">
            {!hasSubcategories && <p className="text-sm text-stone-500">No deleted subcategories.</p>}
            {Object.entries(safeDeletedSubcategories).flatMap(([parentId, entries]) => (Array.isArray(entries) ? entries : []).map((entry) => ({ parentId, ...entry }))).map((entry) => (
              <div key={`${entry.parentId}:${entry.name}`} className="rounded-2xl border border-stone-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{entry.name}</p>
                    <p className="text-xs text-stone-500">{categoryNameById.get(entry.parentId) || deletedCategoryNameById.get(entry.parentId) || entry.parentId}</p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-stone-600">Subcategory</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => onRestoreSubcategory(entry.parentId, entry.name)} className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">Restore</button>
                  <button type="button" onClick={() => onRequestPermanentDelete({ type: "permanent-subcategory", parentId: entry.parentId, name: entry.name })} className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700">Delete forever</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black">Inventories</h3>
          <div className="mt-4 space-y-3">
            {!hasInventories && <p className="text-sm text-stone-500">No deleted inventory items.</p>}
            {safeDeletedInventories.map((item) => (
              <div key={item.id} className="rounded-2xl border border-stone-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{item.name}</p>
                    <p className="text-xs text-stone-500">
                      {Number.isFinite(Number(item.quantity)) ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}` : "Stock not available"}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">Deleted: {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : "Unknown"}</p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-stone-600">Inventory</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => onRestoreInventory(item.id)} className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">Restore</button>
                  <button type="button" onClick={() => onRequestPermanentDelete({ type: "permanent-inventory", id: item.id, name: item.name })} className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700">Delete forever</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}

function PaymentModal({ data, onClose, onIHavePaid }) {
  const [submitting, setSubmitting] = useState(false);
  const [dynamicQrSrc, setDynamicQrSrc] = useState(null);
  const safeItems = Array.isArray(data?.items) ? data.items : [];

  if (!data || typeof data !== "object") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-6 p-4 pt-6 pb-12 sm:pt-10 sm:pb-10">
          <div className="upi-modal-container">
            <div className="upi-modal-header">
              <h2>Payment unavailable</h2>
              <p>Unable to load payment details. Please close and try again.</p>
            </div>
            <div className="upi-actions">
              <button onClick={onClose} className="upi-close-btn">Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const upiLink = buildUpiString({
    upiId: TEST_UPI_CONFIG.upiId,
    payeeName: TEST_UPI_CONFIG.payeeName,
    amount: data.total,
    orderId: data.orderId || ""
  });

  // Generate dynamic QR on mount/update
  useEffect(() => {
    async function generateDynamicQr() {
      try {
        if (!upiLink) return;
        const url = await createQrDataUrl(upiLink, { margin: 1, width: 280 });
        setDynamicQrSrc(url);
      } catch (err) {
        console.error("Failed to generate dynamic QR:", err);
        setDynamicQrSrc(null);
      }
    }
    generateDynamicQr();
  }, [upiLink]);

  function openUpiApp() {
    if (!upiLink) {
      alert("UPI link is not ready. Please check UPI ID configuration.");
      return;
    }
    try {
      window.location.href = upiLink;
    } catch (e) {
      try { window.location.href = upiLink; } catch (e2) { window.open(upiLink, "_self"); }
      console.warn("UPI intent failed", e);
    }
  }

  async function clickPaid() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onIHavePaid();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-6 p-4 pt-6 pb-12 sm:pt-10 sm:pb-10">
        <div className="upi-modal-container">
          {/* Header */}
          <div className="upi-modal-header">
            <h2>Pay Using UPI</h2>
            <p>Order total and payment options are shown below.</p>
            <div className="upi-amount">{rupees(data.total)}</div>
          </div>

          {/* Pay with UPI App Button */}
          <button onClick={openUpiApp} className="upi-primary-btn">
            Pay with UPI App
          </button>

          {/* QR Code Card */}
          <div className="upi-qr-card">
            <p>Scan this QR or tap Pay with UPI App.</p>
            <div className="qr-center">
              {dynamicQrSrc ? (
                <img
                  src={dynamicQrSrc}
                  alt="UPI QR (Dynamic)"
                  className="upi-qr-image"
                  onError={() => console.error("Dynamic QR image failed to render")}
                />
              ) : TEST_UPI_CONFIG.staticQrImage ? (
                <img
                  src={TEST_UPI_CONFIG.staticQrImage}
                  alt="UPI QR (Static)"
                  className="upi-qr-image"
                  onError={() => console.error("Static QR image failed to load:", TEST_UPI_CONFIG.staticQrImage)}
                />
              ) : (
                <p style={{ color: "#475569", fontSize: "12px" }}>QR unavailable. Use Pay with UPI App instead.</p>
              )}
            </div>
            <p className="upi-id">{TEST_UPI_CONFIG.upiId}</p>
          </div>

          {/* Action Buttons */}
          <div className="upi-actions">
            <button onClick={clickPaid} disabled={submitting} className="upi-paid-btn">
              {submitting ? "Processing..." : "Paid"}
            </button>
            <button onClick={onClose} className="upi-close-btn">
              Close
            </button>
          </div>

          {/* Order Summary */}
          <div className="upi-order-summary">
            <p className="upi-order-summary-header">{data.customerName}</p>
            <p>{data.phone} • Table {data.tableNumber}</p>
            <div style={{ marginTop: "8px" }}>
              {safeItems.map((line, idx) => (
                <p key={idx}>• {formatOrderItemLine(line)}</p>
              ))}
            </div>
            <p className="upi-order-summary-header" style={{ marginTop: "8px" }}>Total: {rupees(data.total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, title, message, confirmLabel = "Delete", cancelLabel = "Cancel", onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.5rem] bg-white p-6 shadow-2xl">
        <h3 className="text-2xl font-black tracking-tight">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-stone-600">{message}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-full bg-stone-100 px-5 py-3 text-sm font-black text-stone-700">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function OrderTracking({ orderId }) {
  const [order, setOrder] = useState(null);
  const [modal, setModal] = useState({ show: false, type: null });
  const prevStatusRef = useRef(null);
  const [showTalkText, setShowTalkText] = useState(false);
  const [payModalOpenLocal, setPayModalOpenLocal] = useState(false);
  const [retryPaymentData, setRetryPaymentData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let attempts = 0;
    const MAX_RETRIES = 15; // 15 retries * 3000ms = 45 seconds max wait
    const RETRY_INTERVAL = 3000;
    const markFailedAttempt = () => {
      attempts += 1;
      setRetryCount(attempts);
      if (attempts >= MAX_RETRIES) {
        setNotFound(true);
      }
    };

    async function load() {
      try {
        const data = await orderService.getPublicOrder(orderId);
        if (!mounted) return;
        setOrder(preparePrintableOrder(data));
        attempts = 0;
        setRetryCount(0);
        setNotFound(false);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load order:", err);
        
        // Check if this is a 404 (order not found)
        if (err.status === 404 || (err.message && err.message.includes("404"))) {
          // Try localStorage as fallback before giving up
          try {
            const storedOrders = JSON.parse(localStorage.getItem("infusion-orders") || "[]");
            const match = storedOrders.find(
              (o) => String(o._id || o.id || o.orderId) === String(orderId)
            );
            if (match) {
              setOrder(preparePrintableOrder(match));
              setNotFound(false);
              return;
            }
          } catch (e) {
            // ignore localStorage errors
          }
          
          // If still no order after localStorage check, mark as not found but retry a few more times
          markFailedAttempt();
        } else {
          // Network or other error, increment retry
          markFailedAttempt();
        }
      }
    }

    load();
    const timer = setInterval(() => {
      if (attempts >= MAX_RETRIES) {
        clearInterval(timer);
        return;
      }
      load();
    }, RETRY_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    const prev = prevStatusRef.current;
    const current = getPaymentFlowState(order.paymentStatus).normalizedStatus;
    if (prev !== current) {
      if (prev === 'payment issue' && current !== 'payment issue') {
        setModal({ show: false, type: null });
        setShowTalkText(false);
      }
      if (current === 'confirmed') {
        setModal({ show: true, type: 'confirmed' });
        setTimeout(() => {
          setModal({ show: false, type: null });
          try { localStorage.removeItem('infusion-cart'); } catch (e) {}
          window.location.href = '/';
        }, 2000);
      }
      if (current === 'payment issue' || current === 'rejected' || current === 'payment rejected') {
        setModal({ show: true, type: 'payment_issue' });
        // do NOT redirect or clear cart — customer stays on page until issue is resolved
      }
    }
    prevStatusRef.current = current;
  }, [order]);

  const paymentState = getPaymentFlowState(order?.paymentStatus);
  const paymentCopy = getPaymentOutcomeCopy(order?.paymentStatus);

  if (!order) {
    if (notFound) {
      return (
        <div className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f6dfc6_0%,#f9b8a9_38%,#f5e5ce_68%,#d8dec8_100%)] text-stone-950 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-8 text-center">
            <h2 className="text-2xl font-black">Order Not Found</h2>
            <p className="mt-3 text-sm text-stone-600">
              We couldn't find your order (ID: {orderId}). It may not have been created yet. Please go back to the menu and try placing your order again.
            </p>
            <div className="mt-6">
              <a href="/" className="inline-block rounded-full bg-black px-6 py-3 font-black text-white">Back to Menu</a>
            </div>
          </div>
        </div>
      );
    }
    return <div className="p-8 text-center">Loading order...</div>;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f6dfc6_0%,#f9b8a9_38%,#f5e5ce_68%,#d8dec8_100%)] text-stone-950">
      <div className="pointer-events-none fixed -left-12 top-24 h-56 w-56 rounded-full bg-white/30 blur-3xl" />
      <div className="pointer-events-none fixed right-0 top-10 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="glass-card p-6">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Order Tracking</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight">Order ID: {order.orderId}</h1>
            <p className="mt-2 text-sm text-stone-600">Your order status and details are shown below.</p>
          </div>

          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Payment Status</p>
            <div className="mt-3 flex items-center gap-4">
              <p className="text-xl font-black text-stone-950">
                  {paymentState.isPendingVerification ? paymentCopy.headline : (paymentState.isConfirmed ? paymentCopy.headline : order.status)}
              </p>
                {paymentState.isPendingVerification && (
                <div className="flex items-center gap-3">
                  <div className="loader" aria-hidden="true" />
                  <div className="pulsing-dots" aria-hidden="true"><span></span><span></span><span></span></div>
                </div>
              )}
            </div>

            <p className="mt-2 text-sm text-stone-600">
              {paymentState.isPendingVerification && paymentCopy.description}
              {paymentState.isConfirmed && paymentCopy.description}
              {paymentState.isPaymentIssue && (order.rejectionMessage || paymentCopy.description)}
            </p>
          </div>

          <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-2xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Order Items</p>
              <p className="text-sm text-stone-600">Table {order.tableNumber ?? order.table ?? "-"}</p>
            </div>
            <div className="mt-4 space-y-3 text-sm text-stone-700">
              {order.items.map((line, idx) => (
                <div key={idx} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-black text-stone-950">{line.name}</p>
                  <p className="mt-1 text-xs text-stone-600">{normalizeVisibleSizeLabel(line)}{line.serveType ? ` • ${line.serveType}` : ""}</p>
                  <p className="mt-2 text-sm text-stone-700">{formatOrderItemLine(line)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {modal.show && modal.type === 'confirmed' && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
          <div className="rounded-2xl bg-white p-8 text-center shadow-2xl max-w-sm mx-4">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-emerald-100 grid place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-700" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8.414 8.414a1 1 0 01-1.414 0L3.293 11.12a1 1 0 011.414-1.414l2.586 2.586 7.707-7.707a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-black">Order Placed Successfully!</h3>
            <p className="mt-2 text-sm text-stone-600">Your payment has been verified and your order is now being prepared.</p>
          </div>
        </div>
      )}

      {modal.show && modal.type === 'payment_issue' && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20">
          <div className="rounded-2xl bg-white p-6 text-center border border-rose-200 shadow-lg max-w-md mx-4">
            <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-rose-100 grid place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9V6a1 1 0 112 0v3a1 1 0 11-2 0zm0 4a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-rose-600">{paymentCopy.headline || "Payment Rejected"}</h3>
            <p className="mt-2 text-sm text-stone-600">{order.rejectionMessage || paymentCopy.description || "Your payment was not verified. Please check your payment or talk to the biller at the counter."}</p>
            <div className="mt-4 flex justify-center gap-3">
              <button onClick={async () => {
                // Close payment issue modal and open the existing PaymentModal with same order data
                try {
                  setModal({ show: false, type: null });
                  const items = (order.items || []).map((it) => ({
                    itemId: it.itemId,
                    sizeId: it.sizeId,
                    quantity: it.quantity,
                    serveType: it.serveType,
                    unitPrice: it.unitPrice || it.lineTotal / Math.max(1, it.quantity),
                    basePrice: it.basePrice,
                    lineTotal: it.lineTotal,
                    name: it.name,
                    addons: it.addons
                  }));
                  const subtotal = getOrderTotal({ items });
                  setRetryPaymentData({
                    customerName: order.customerName,
                    phone: order.phone,
                    tableNumber: order.tableNumber,
                    orderId: order.orderId || order.id || order._id,
                    items,
                    subtotal,
                    total: Number(order.total || subtotal)
                  });
                  setPayModalOpenLocal(true);
                } catch (e) {
                  showToast('Failed to open payment retry modal');
                }
              }} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white">Check Payment / Try Again</button>
              <button onClick={() => { setShowTalkText(true); }} className="rounded-full bg-white border border-rose-200 px-4 py-2 text-sm font-black text-rose-600">Talk to Biller</button>
            </div>
            {showTalkText && <p className="mt-3 text-sm text-stone-700">Please visit the counter and talk to the biller for quick verification.</p>}
            <p className="mt-3 text-xs text-stone-500">Order ID: {order.orderId} • Table {order.tableNumber ?? order.table ?? '-'}</p>
          </div>
        </div>
      )}

      {payModalOpenLocal && retryPaymentData && (
        <PaymentModal
          data={retryPaymentData}
          onClose={() => { setPayModalOpenLocal(false); setRetryPaymentData(null); }}
                  onIHavePaid={async () => {
                    // When customer confirms payment here, request a public retry so staff can re-verify
                    try {
                      const key = retryPaymentData.orderId;
                      await orderService.retryPublicOrder(key);
                      setPayModalOpenLocal(false);
                      setRetryPaymentData(null);
                      // Inform customer non-blocking
                      showToast('Payment resubmitted. Waiting for verification.');
                      // OrderTracking will pick up SSE update and refresh order
                    } catch (e) {
                      console.error('Failed to retry payment for order:', e);
                      showToast('Failed to update order status. Please try again.');
                    }
                  }}
        />
      )}
    </main>
  );
}

function TopBar({ cartCount, onCart, onOrderOnCounter, onBack }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {onBack && (
          <button type="button" onClick={onBack} className="rounded-full bg-white/85 px-4 py-3 text-xs font-black text-stone-950 shadow-sm hover:bg-stone-100">
            Back
          </button>
        )}
        <a
          className="icon-button"
          aria-label="Visit our Instagram"
          href="https://www.instagram.com/theinfusionsaga?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
          target="_blank"
          rel="noopener noreferrer"
        >
          <Instagram size={22} />
        </a>
        <button
          type="button"
          onClick={onOrderOnCounter}
          className="rounded-full bg-black px-4 py-3 text-xs font-black text-white transition hover:bg-stone-800"
        >
          Order On Counter
        </button>
      </div>
      <div className="flex gap-3">
        <button className="icon-button relative bg-black text-white" aria-label="Open cart" onClick={onCart}>
          <ShoppingCart size={21} />
          {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-300 px-1 text-[11px] font-black text-black">{cartCount}</span>}
        </button>
      </div>
    </div>
  );
}

function BrandHeader({ query, setQuery }) {
  return (
    <header className="mx-auto w-full max-w-3xl text-center">
      <img src={logoUrl} alt="The Infusion Saga - Where Every Sip Begins a Story" className="mx-auto h-auto w-full max-w-[360px] drop-shadow-[0_18px_32px_rgba(67,45,28,0.18)]" />
      <label className="relative mx-auto mt-6 flex max-w-xl items-center gap-3 rounded-full border border-white/60 bg-white/45 px-5 py-3 shadow-glass backdrop-blur-xl">
        <Search size={20} className="text-stone-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-transparent pr-11 text-sm font-semibold outline-none placeholder:text-stone-500"
          placeholder="Search coffee, snacks, dessert..."
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 text-sm font-black text-stone-600 transition hover:bg-white"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </label>
    </header>
  );
}

function QuickAccessSection({ quickAccessMode, onQuickAccess, showWaterBottle = true, showCigarettes = true }) {
  const buttons = [
    { key: "water", label: "💧 Water Bottles", tone: "bg-white/65 hover:bg-white/80", visible: showWaterBottle },
    { key: "cigarettes", label: "🚬 Cigarettes", tone: "bg-white/65 hover:bg-white/80", visible: showCigarettes }
  ].filter((button) => button.visible);

  if (!buttons.length) return null;

  return (
    <section className="mx-auto w-full max-w-3xl rounded-[28px] border border-white/60 bg-white/35 p-4 shadow-glass backdrop-blur-xl sm:p-5">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.35em] text-stone-700">Quick Access</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {buttons.map((button) => {
          const active = quickAccessMode === button.key;
          return (
            <button
              key={button.key}
              type="button"
              onClick={() => onQuickAccess(button.key)}
              className={`flex min-w-[170px] flex-1 items-center justify-center rounded-full px-4 py-3 text-sm font-black shadow-sm transition sm:min-w-[190px] ${active ? "bg-black text-white" : `${button.tone} text-stone-800`}`}
            >
              {button.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DetailModal({ item, onClose, onAdd }) {
  const sizes = item?.sizes?.length
    ? item.sizes
    : [{ id: "default", name: "Regular", label: "Regular", price: item.price ?? 0 }];
  const [sizeId, setSizeId] = useState(sizes[0]?.id);
  const serveOptions = getServeOptions(item);
  const [serveType, setServeType] = useState(serveOptions[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const genericAddons = Array.isArray(item.addons) ? item.addons : [];

  // safe detection across category, subcategory and name (project uses subcategory for some items)
  const categoryStr = String(item.category || item.categoryId || "").toLowerCase();
  const subcategoryStr = String(item.subcategory || "").toLowerCase();
  const nameStr = String(item.name || "").toLowerCase();

  const isBurger = categoryStr.includes("burger") || subcategoryStr.includes("burger") || nameStr.includes("burger");
  const isPizza = categoryStr.includes("pizza") || subcategoryStr.includes("pizza") || nameStr.includes("pizza");
  const showCigaretteFallback = !item?.image && (categoryStr.includes("cigarette") || nameStr.includes("cigarette"));
  const legacyExtraCheesePrice = Number(item.addons?.extraCheesePrice || 0) || (isPizza ? 30 : isBurger ? 25 : 0);
  const availableAddons = [
    ...genericAddons,
    ...(isPizza || isBurger ? [{ id: "extra-cheese", name: "Extra Cheese", price: legacyExtraCheesePrice }] : [])
  ].filter((addon, index, all) => addon && !all.some((other, otherIndex) => otherIndex < index && other.id === addon.id));

  useEffect(() => {
    const currentSizes = item?.sizes?.length
      ? item.sizes
      : [{ id: "default", name: "Regular", label: "Regular", price: item.price ?? 0 }];
    setSizeId(currentSizes[0]?.id);
    setServeType(getServeOptions(item)[0] || "");
    setQuantity(1);
    setSelectedAddons([]);
  }, [item.id, item.sizes, item.price, item.addons, item.serveOptions, item.servingOptions, item.itemServeOptions]);

  const basePrice = Number((sizes.find((s) => s.id === sizeId)?.price) || item.price || 0);
  const genericAddonTotal = selectedAddons.reduce((sum, addon) => sum + Number(addon.price || 0), 0);
  const totalPrice = (basePrice + genericAddonTotal) * quantity;

  function toggleAddon(addon) {
    setSelectedAddons((current) => {
      const exists = current.find((selected) => selected.id === addon.id);
      if (exists) return current.filter((selected) => selected.id !== addon.id);
      return [...current, addon];
    });
  }

  function handleAddToCart() {
    const addons = {};
    if (selectedAddons.length) addons.selectedAddons = selectedAddons;
    onAdd(item, sizeId, quantity, serveType, { addons });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="detail-modal w-full max-w-[380px]">
        <div className="detail-card">
          <div className="detail-header">
            <h2 className="detail-title">{item.name}</h2>
            <button type="button" onClick={onClose} className="detail-close" aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="detail-image-wrap">
            {showCigaretteFallback ? (
              <div className="grid h-[180px] w-full place-items-center rounded-[28px] bg-transparent text-[3rem] text-rose-700 shadow-sm ring-1 ring-white/20">🚬</div>
            ) : (
              <img src={imageUrl(item.image)} alt={item.name} className="detail-image" />
            )}
          </div>

          <div className="detail-body">
            <div className="price-block">
              <span className="price-label">PRICE</span>
              <span className="price-value">{rupees(totalPrice)}</span>
            </div>

            {availableAddons.length > 0 && (
              <div className="section-block">
                <div className="section-label">Add-ons</div>
                <div className="space-y-3">
                  {availableAddons.map((addon) => {
                    const selected = selectedAddons.some((selectedAddon) => selectedAddon.id === addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddon(addon)}
                        className={`rounded-3xl border px-4 py-3 text-left text-sm font-black transition ${selected ? "border-black bg-black text-white shadow-lg" : "border-stone-200 bg-white text-stone-900"}`}
                        style={{ width: "100%" }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div>{addon.name}</div>
                            {addon.description ? <div className="mt-1 text-xs font-medium text-stone-500">{addon.description}</div> : null}
                          </div>
                          <div className="font-black">+ {rupees(addon.price)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sizes.length > 1 && (
              <div className="section-block">
                <div className="section-label">Choose Size</div>
                <div className="pill-row">
                  {sizes.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      className={`pill-button ${sizeId === size.id ? 'selected' : ''}`}
                      onClick={() => setSizeId(size.id)}
                    >
                      {size.label || size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {serveOptions.length === 1 && (
              <div className="section-block">
                <div className="section-label">Serve Option</div>
                <div className="pill-column">
                  <div className="text-sm text-stone-700">{serveOptions[0]}</div>
                </div>
              </div>
            )}

            {serveOptions.length > 1 && (
              <div className="section-block">
                <div className="section-label">Choose Serve Option</div>
                <div className="pill-column">
                  {serveOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`pill-button pill-option ${serveType === option ? 'selected' : ''}`}
                      onClick={() => setServeType(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="quantity-block">
              <div className="quantity-card">
                <span className="qty-label">QUANTITY</span>
                <div className="qty-controls">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="qty-btn">-</button>
                  <span className="qty-num">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => q + 1)} className="qty-btn">+</button>
                </div>
              </div>
            </div>

            {/* TOTAL PRICE is shown within PRICE when needed; avoid duplicate display */}

            <button type="button" onClick={handleAddToCart} className="add-cart-btn">Add to cart</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaterBottleModal({ item, onClose, onAdd }) {
  const [quantity, setQuantity] = useState(1);
  const unitPrice = getQuickAccessPrice(item);
  const totalPrice = quantity * unitPrice;
  const isUnavailable = !isCustomerVisibleItem(item) || !hasLiveQuickAccessPrice(item);

  function handleAdd() {
    if (isUnavailable) return;
    onAdd(quantity);
    onClose();
  }

  if (isUnavailable) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="detail-modal w-full max-w-[380px]">
          <div className="detail-card">
            <div className="detail-header">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2196F3]/20 text-[#2196F3] shadow-lg ring-1 ring-[#2196F3]/30">
                  <Droplets size={22} />
                </div>
                <div>
                  <h2 className="detail-title text-[26px]">Water Bottle</h2>
                </div>
              </div>
              <button type="button" onClick={onClose} className="detail-close" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="detail-body">
              <div className="rounded-3xl border border-dashed border-stone-200 bg-white/80 p-4 text-center text-sm font-semibold text-stone-600">
                Water Bottles are not available for online order right now.<br />Please talk to the biller at the counter.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="detail-modal w-full max-w-[380px]">
        <div className="detail-card">
          <div className="detail-header">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2196F3]/20 text-[#2196F3] shadow-lg ring-1 ring-[#2196F3]/30">
                <Droplets size={22} />
              </div>
              <div>
                <h2 className="detail-title text-[26px]">Water Bottle</h2>
              </div>
            </div>
            <button type="button" onClick={onClose} className="detail-close" aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="detail-body">
            <div className="price-block">
              <span className="price-label">PRICE</span>
              <span className="price-value">{rupees(totalPrice)}</span>
              <p className="text-center text-sm font-semibold text-white/80">Rs. {unitPrice || 0} each</p>
            </div>

            <div className="quantity-block">
              <div className="quantity-card">
                <span className="qty-label">QUANTITY</span>
                <div className="qty-controls">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="qty-btn">-</button>
                  <span className="qty-num">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => value + 1)} className="qty-btn">+</button>
                </div>
              </div>
            </div>

            <button type="button" onClick={handleAdd} className="add-cart-btn">Add to cart</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CigarettesModal({ items = [], onClose, onAdd }) {
  const cigaretteItems = useMemo(() => (Array.isArray(items) ? items : []).filter((item) => item && item?.isDeleted !== true && item?.active !== false), [items]);
  const [quantities, setQuantities] = useState(() => Object.fromEntries(cigaretteItems.map((item) => [item.id, 0])));
  const hasUnavailableItems = cigaretteItems.length === 0;

  useEffect(() => {
    setQuantities(Object.fromEntries(cigaretteItems.map((item) => [item.id, 0])));
  }, [cigaretteItems]);

  function updateQuantity(id, delta) {
    setQuantities((current) => {
      const nextValue = (current[id] ?? 0) + delta;
      return {
        ...current,
        [id]: Math.max(0, nextValue)
      };
    });
  }

  function handleAddSelected() {
    if (hasUnavailableItems) return;

    const cigaretteQuantities = Object.fromEntries(
      cigaretteItems.map((item) => [item.id, Number(quantities[item.id] ?? 0)])
    );
    const selectedItems = cigaretteItems
      .map((item) => ({
        ...item,
        quantity: cigaretteQuantities[item.id] ?? 0,
        price: getQuickAccessPrice(item)
      }))
      .filter((item) => Number(item.quantity) > 0);

    if (import.meta.env.DEV) {
      console.log("CIGARETTE ITEMS FROM LIVE MENU", cigaretteItems);
      console.log("SELECTED CIGARETTE QUANTITIES", cigaretteQuantities);
      console.log("CIGARETTE ITEMS TO ADD", selectedItems);
    }

    if (!selectedItems.length) return;

    if (import.meta.env.DEV) {
      selectedItems.forEach((item) => {
        console.log("CALLING addToCart WITH", item);
      });
    }

    onAdd(selectedItems);
  }

  if (hasUnavailableItems) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center justify-center bg-black/50 p-2 pb-3 backdrop-blur-sm sm:p-4 sm:pb-6">
        <div className="detail-modal w-full max-w-[420px] max-h-[100dvh] md:max-w-[620px] md:max-h-[92vh]">
          <div className="detail-card max-h-[calc(100dvh-16px)] w-full overflow-hidden rounded-[30px] md:max-h-[92vh] md:overflow-visible">
            <div className="detail-header px-4 pb-3 pt-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-700 shadow-lg ring-1 ring-rose-200">
                  <span className="text-xl">🚬</span>
                </div>
                <div>
                  <h2 className="detail-title text-[26px]">Cigarettes</h2>
                </div>
              </div>
              <button type="button" onClick={onClose} className="detail-close" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="detail-body max-h-[calc(100dvh-132px)] overflow-y-auto p-0 pb-0 sm:max-h-[72vh] md:max-h-none md:overflow-visible">
              <div className="rounded-3xl border border-dashed border-stone-200 bg-white/80 p-4 text-sm text-stone-500">Cigarettes are not available for online order right now.<br />Please talk to the biller at the counter.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center justify-center bg-black/50 p-2 pb-3 backdrop-blur-sm sm:p-4 sm:pb-6">
      <div className="detail-modal w-full max-w-[420px] max-h-[100dvh] md:max-w-[620px] md:max-h-[92vh]">
        <div className="detail-card max-h-[calc(100dvh-16px)] w-full overflow-hidden rounded-[30px] md:max-h-[92vh] md:overflow-visible">
          <div className="detail-header px-4 pb-3 pt-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-700 shadow-lg ring-1 ring-rose-200">
                <span className="text-xl">🚬</span>
              </div>
              <div>
                <h2 className="detail-title text-[26px]">Cigarettes</h2>
              </div>
            </div>
            <button type="button" onClick={onClose} className="detail-close" aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="detail-body max-h-[calc(100dvh-132px)] overflow-y-auto p-0 pb-0 sm:max-h-[72vh] md:max-h-none md:overflow-visible">
            <div className="space-y-2 px-3 pb-1 pt-1 md:space-y-3">
              {cigaretteItems.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-stone-200 bg-white/80 p-4 text-sm text-stone-500">No active cigarette items are available right now.</div>
              ) : cigaretteItems.map((item) => (
                <div key={item.id} className="rounded-3xl border border-white/70 bg-white/75 p-3 shadow-sm backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-stone-900">{item.name}</p>
                      <p className="text-xs font-semibold text-stone-500">Rs. {getQuickAccessPrice(item)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQuantity(item.id, -1)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-stone-900 shadow-sm ring-1 ring-stone-200">-</button>
                      <span className="min-w-[1.5rem] text-center text-sm font-black text-stone-900">{quantities[item.id] || 0}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)} className="grid h-8 w-8 place-items-center rounded-full bg-black text-white shadow-sm">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 z-10 px-1 pb-1 pt-0 sm:pb-2">
              <button type="button" onClick={handleAddSelected} className="add-cart-btn mb-0 w-full !py-2 !text-xs">Add To Cart</button>
              <p className="mt-1 text-center text-[10px] font-semibold text-white/90">⚠ Cigarettes are injurious to health.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCartFallbackIcon(line) {
  const safeName = String(line?.name || "").toLowerCase();
  const safeCategory = String(line?.category || line?.categoryId || "").toLowerCase();

  const cigaretteNames = [
    "big advance",
    "big gold flake",
    "connect",
    "ultra mild",
    "mild classic",
    "fine touch",
    "marlboro red",
    "double brust",
    "ice brust",
    "classic regular"
  ];

  const isCigaretteItem = safeCategory.includes("cigarette") || cigaretteNames.some((name) => safeName.includes(name));
  const isWaterBottleItem = safeCategory.includes("water") || safeName.includes("water bottle") || safeName.includes("water-bottle") || safeName.includes("water bottles");

  if (isCigaretteItem) {
    return <span className="text-[1.35rem] leading-none" aria-hidden="true">🚬</span>;
  }

  if (isWaterBottleItem) {
    return <Droplets size={24} className="text-[#2196F3]" strokeWidth={2.1} aria-hidden="true" />;
  }

  return <span className="text-[1.15rem] leading-none" aria-hidden="true">🍽️</span>;
}

function CartDrawer({ cart, total, onClose, onQty, onCheckout, orderOnCounter }) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const tables = Array.from({ length: 17 }, (_, i) => i + 1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function isValidName(value) {
    return /^[A-Za-z ]+$/.test(value.trim());
  }

  function isValidPhone(value) {
    return /^\d{10}$/.test(value);
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    if (!isValidName(customerName)) {
      setError("Name should contain only letters and spaces.");
      setSubmitting(false);
      return;
    }

    if (!isValidPhone(phone)) {
      setError("Phone number must be exactly 10 digits.");
      setSubmitting(false);
      return;
    }

    try {
      await onCheckout({ customerName, phone, tableNumber, paymentMethod });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/25 backdrop-blur-sm">
      <aside className="h-full w-full max-w-md overflow-y-auto bg-[#fff8ec]/95 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">Your cart</h2>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="mt-5 space-y-3">
          {cart.length === 0 && <p className="rounded-3xl bg-white/60 p-5 text-sm font-semibold text-stone-600">Your cart is waiting for something delicious.</p>}
          {cart.map((line) => {
            const safeLine = line || {};
            const safeName = String(safeLine.name || "").trim();
            const safeCategory = String(safeLine.category || safeLine.categoryId || "").toLowerCase();
            const safeQuantity = Math.max(1, Number(safeLine.quantity ?? 1));
            const hasImage = Boolean(safeLine.image);
            const fallbackIcon = getCartFallbackIcon(safeLine);

            return (
              <div key={safeLine.key || `${safeName}-${Math.random()}`} className="flex gap-3 rounded-3xl bg-white/65 p-3">
                {hasImage ? (
                  <img src={imageUrl(safeLine.image)} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                ) : (
                  <div className={`grid h-20 w-20 place-items-center rounded-2xl text-3xl shadow-sm ring-1 ${safeCategory.includes("cigarette") || safeName.toLowerCase().includes("cigarette") ? "bg-rose-100/90 text-rose-700 ring-rose-200" : safeCategory.includes("water") || safeName.toLowerCase().includes("water bottle") ? "bg-blue-100/90 text-blue-700 ring-blue-200" : "bg-stone-100/90 text-stone-700 ring-stone-200"}`}>
                    {fallbackIcon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-black">{safeLine.name || "Item"}</p>
                  <p className="text-xs font-bold text-stone-500">{normalizeVisibleSizeLabel(safeLine)}{safeLine.serveType ? ` • ${safeLine.serveType}` : ""} - {rupees(getBasePrice(safeLine))} each</p>
                  {(() => {
                    const addonText = getAddonEachText(safeLine);
                    return addonText ? <p className="mt-1 text-xs font-semibold text-stone-600">{addonText}</p> : null;
                  })()}
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                  <button className="grid h-8 w-8 place-items-center rounded-full bg-black text-white" onClick={() => onQty(safeLine.key, 1)}><Plus size={15} /></button>
                  <span className="font-black">{safeQuantity}</span>
                  <button className="grid h-8 w-8 place-items-center rounded-full bg-white" onClick={() => onQty(safeLine.key, -1)}><Minus size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 rounded-3xl bg-black p-5 text-white">
          <div className="mb-3 flex items-center justify-between text-sm font-bold"><span>Total</span><span className="text-2xl font-black">{rupees(total)}</span></div>
          <div className="space-y-2 text-xs text-white/80">
            {cart.map((line) => (
              <p key={line.key}>{formatOrderItemLine(line)}</p>
            ))}
          </div>
        </div>
        <p className="mt-3 inline-block rounded-full bg-amber-100/90 px-4 py-2 text-sm font-black text-amber-800 shadow-sm animate-pulse">Order Prep 15-20 mins</p>
        {cart.length > 0 && (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <input
              required
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value.replace(/[^A-Za-z ]/g, ""))}
              placeholder="Name"
              className="field"
            />
            <input
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Phone"
              className="field"
              type="tel"
              inputMode="numeric"
              maxLength={10}
            />
            <div className="space-y-3 rounded-3xl border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-black">Table no.</p>
              <div className="grid grid-cols-3 gap-3">
                {tables.map((number) => (
                  <label key={number} className={`flex cursor-pointer items-center gap-3 rounded-3xl border px-4 py-3 text-sm font-semibold transition ${tableNumber === String(number) ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-800"}`}>
                    <input
                      type="radio"
                      name="tableNumber"
                      value={number}
                      checked={tableNumber === String(number)}
                      onChange={() => setTableNumber(String(number))}
                      required
                      className="h-4 w-4 accent-black"
                    />
                    Table {number}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-3 rounded-3xl border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-black">Payment Method</p>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex cursor-pointer items-center gap-3 rounded-3xl border px-4 py-3 text-sm font-semibold transition ${paymentMethod === "online" ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-800"}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                    required
                    className="h-4 w-4 accent-black"
                  />
                  Pay Online
                </label>
                <label className={`flex cursor-pointer items-center gap-3 rounded-3xl border px-4 py-3 text-sm font-semibold transition ${paymentMethod === "cash" ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-800"}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    required
                    className="h-4 w-4 accent-black"
                  />
                  Pay Cash (COC)
                </label>
              </div>
            </div>
            {error && <p className="text-sm font-bold text-red-700">{error}</p>}
            <button disabled={submitting || !tableNumber || !paymentMethod} className="w-full rounded-full bg-black px-5 py-4 font-black text-white disabled:opacity-60">{submitting ? "Processing..." : orderOnCounter ? "Order On Counter" : "Place Order"}</button>
          </form>
        )}
      </aside>
    </div>
  );
}

function OrderSuccess({ order, onClose, showFallbackAction = false, onFallbackAction }) {
  const isPendingApproval = Boolean(order?.pendingApproval);
  const normalizedStatus = normalizeStatus(order?.status || order?.paymentStatus);
  const isRejected = ["cancelled", "rejected", "payment issue", "payment rejected", "payment_rejected", "payment_issue"].includes(normalizedStatus);
  const statusLabel = getOrderStatusLabel(order) || (isPendingApproval ? "Pending" : isRejected ? "Cancelled" : "Confirmed");
  const title = isPendingApproval ? "Request submitted" : isRejected ? "Order cancelled" : "Order placed";
  const subtitle = isPendingApproval
    ? "Visit the counter and pay cash payment to the biller."
    : isRejected
      ? "Order was cancelled by biller."
      : "Your Order is in the kitchen queue";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-xl p-6 text-center no-print">
        <Sparkles className="mx-auto text-emerald-700" size={36} />
        <h2 className="mt-3 text-2xl font-black">{title}</h2>
        <p className="mt-2 text-sm font-semibold text-stone-600">{subtitle}</p>

        <div className="mt-5 flex flex-col items-center gap-4">
          <div className="coc-loading-shell w-44 max-w-xs rounded-[1.35rem] border border-white/60 bg-white/35 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-md">
            {isPendingApproval && <span className="coc-loading-ring" aria-hidden="true" />}
            <div className="relative z-10 flex flex-col items-center text-center">
              <p className="text-xl font-black">{rupees(order.total)}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-stone-500">Status: {statusLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-black px-4 py-2 text-xs font-black text-white shadow-sm"
          >
            Done
          </button>
        </div>
        {showFallbackAction && isPendingApproval && (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={onFallbackAction}
              className="rounded-full border border-stone-300 bg-white/80 px-5 py-3 text-sm font-black text-stone-700 shadow-sm backdrop-blur-md"
            >
              Cancel / Go back to menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OwnerApp({ navigate, initialTab = "items" }) {
  const [owner, setOwner] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    authService.me().then((data) => setOwner(data.user?.role === "admin" ? data.user.email : null)).finally(() => setAuthLoading(false));
  }, []);

  if (authLoading) return <OwnerShell><p className="font-bold">Loading...</p></OwnerShell>;
  if (!owner) return <Login role="admin" onLogin={setOwner} navigate={navigate} />;
  return <Dashboard owner={owner} onLogout={() => setOwner(null)} navigate={navigate} initialTab={initialTab} />;
}

function BillerApp({ navigate }) {
  const [biller, setBiller] = useState(null);
  const [orders, setOrders] = useState([]);
  const [cocRequests, setCocRequests] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastSync, setLastSync] = useState(null);
  const [billerTab, setBillerTab] = useState("orders");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef(null);
  const loadPromiseRef = useRef(null);

  async function load() {
    if (loadPromiseRef.current) return loadPromiseRef.current;
    loadPromiseRef.current = (async () => {
    try {
      setLoadError("");
      const [cocResult, itemResult, categoryResult] = await Promise.allSettled([
        orderService.listCocRequests(),
        menuService.getMenu({ includeInactive: true }),
        menuService.getCategories()
      ]);

      const cocData = cocResult.status === "fulfilled" ? cocResult.value : [];
      const itemData = itemResult.status === "fulfilled" ? itemResult.value : [];
      const categoryData = categoryResult.status === "fulfilled" ? categoryResult.value : defaultCategories;

      if (cocResult.status === "rejected") {
        setLoadError("COC requests could not be loaded. Live orders are still available.");
      }

      const freshOrders = await orderService.listOrders("limit=100&status=new,pending,pending_verification,confirmed,preparing,ready,payment_rejected,payment_issue,rejected").catch(() => sync.getOrdersFromStorage());
      const safeCategories = ensureActiveCategories(categoryData);
      const safeItems = ensureActiveMenuItems(itemData, safeCategories);
      setOrders(Array.isArray(freshOrders) ? freshOrders : []);
      setCocRequests(cocData || []);
      setItems(safeItems);
      setCategories(safeCategories);
      setLastSync(new Date().toISOString());
      logLoadStats("BillerApp", {
        rawCategories: Array.isArray(categoryData) ? categoryData.length : 0,
        activeCategories: safeCategories.length,
        rawItems: Array.isArray(itemData) ? itemData.length : 0,
        activeItems: safeItems.length,
        rawSubcategories: loadSubcategoryConfig(),
        activeSubcategories: Object.keys(loadSubcategoryConfig()).length,
        deletedCount: 0
      });
    } catch (error) {
      console.error("Failed to load biller data:", error);
      const safeCategories = ensureActiveCategories([]);
      const safeItems = ensureActiveMenuItems([], safeCategories);
      const freshOrders = await orderService.listOrders("limit=100&status=new,pending,pending_verification,confirmed,preparing,ready,payment_rejected,payment_issue,rejected").catch(() => sync.getOrdersFromStorage());
      setOrders(Array.isArray(freshOrders) ? freshOrders : []);
      setCocRequests([]);
      setItems(safeItems);
      setCategories(safeCategories);
      setLastSync(new Date().toISOString());
      logLoadStats("BillerApp (fallback)", {
        rawCategories: 0,
        activeCategories: safeCategories.length,
        rawItems: 0,
        activeItems: safeItems.length,
        rawSubcategories: loadSubcategoryConfig(),
        activeSubcategories: Object.keys(loadSubcategoryConfig()).length,
        deletedCount: 0
      });
    }
    })();
    try {
      return await loadPromiseRef.current;
    } finally {
      loadPromiseRef.current = null;
    }
  }

  useEffect(() => {
    let isMounted = true;

    const authRequest = authService.me().then((data) => ({
      user: data?.user || null
    }));
    const timeout = new Promise((resolve) => {
      setTimeout(() => resolve({ user: null }), 7000);
    });

    Promise.race([authRequest, timeout])
      .then((data) => {
        if (!isMounted) return;
        setBiller(data.user?.role === "biller" ? data.user.email : null);
      })
      .catch(() => {
        if (!isMounted) return;
        setBiller(null);
      })
      .finally(() => {
        if (isMounted) setAuthLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!biller) return;

    let isActive = true;
    setPageLoading(true);
    setLoadError("");

    const unsub = ordersStore.subscribe((data) => {
      if (isActive) setOrders(data || []);
    });

    const runLoad = async () => {
      try {
        const loadPromise = load();
        const timeout = new Promise((resolve) => {
          setTimeout(() => resolve("timeout"), 8000);
        });

        const result = await Promise.race([loadPromise, timeout]);
        if (result === "timeout" && isActive) {
          setLoadError("Biller data is taking longer than expected. Showing the latest available information.");
        }
      } catch (error) {
        if (isActive) setLoadError("Unable to load biller data right now. Showing the latest available information.");
      } finally {
        if (isActive) setPageLoading(false);
      }
    };

    runLoad();

    return () => {
      isActive = false;
      unsub();
    };
  }, [biller]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    function handlePointerDown(event) {
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target)) {
        setMobileNavOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!biller) return;
    let es = null;
    let reconnectTimeout = null;
    let streamLoadTimer = null;
    let isActive = true;
    
    function setupStream() {
      if (!isActive || es) return;
      try {
        es = new EventSource(`${API}/orders/stream`, { withCredentials: true });
        const handleUpdate = () => {
          setLastSync(new Date().toISOString());
          if (streamLoadTimer) clearTimeout(streamLoadTimer);
          streamLoadTimer = setTimeout(() => {
            streamLoadTimer = null;
            load();
          }, 150);
        };
        es.addEventListener("order:created", handleUpdate);
        es.addEventListener("order:updated", handleUpdate);
        es.addEventListener("coc:created", handleUpdate);
        es.onerror = () => {
          try { es.close(); } catch (e) {}
          es = null;
          // Reconnect after 3 seconds
          if (isActive) reconnectTimeout = setTimeout(() => setupStream(), 3000);
        };
      } catch (error) {
        if (isActive) reconnectTimeout = setTimeout(() => setupStream(), 3000);
      }
    }
    
    setupStream();
    return () => {
      isActive = false;
      if (streamLoadTimer) clearTimeout(streamLoadTimer);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      try { if (es) es.close(); } catch (e) {}
    };
  }, [biller]);

  if (authLoading || pageLoading) return <OwnerShell><p className="font-bold">Loading biller data...</p></OwnerShell>;
  if (!biller) return <Login role="biller" onLogin={setBiller} navigate={navigate} />;

  return (
    <OwnerShell>
      <div className="mx-auto max-w-7xl">
        {loadError && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {loadError}
          </div>
        )}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-stone-500">Biller dashboard</p>
            <h1 className="text-4xl font-black tracking-tight">Biller page</h1>
            <p className="mt-1 text-xs text-stone-500">Live sync: {lastSync ? new Date(lastSync).toLocaleTimeString() : "waiting for updates..."}</p>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-full bg-white p-3 text-stone-700 shadow transition hover:bg-stone-100"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2 relative z-10">
            <div className="flex gap-2">
              <button onClick={() => navigate("/")} className="rounded-full bg-white px-4 py-3 text-sm font-black shadow">Customer app</button>
              <button onClick={() => navigate("/owner")} className="rounded-full bg-white px-4 py-3 text-sm font-black shadow">Owner app</button>
            </div>
            <div>
              <button onClick={() => setBillerTab("pos")} className="rounded-full bg-white px-4 py-3 text-sm font-black shadow">OOC (Order On Counter)</button>
            </div>
          </div>
        </div>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 bg-stone-950/40 md:hidden" aria-hidden="true">
            <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-[#fffaf5] p-4 shadow-2xl" ref={mobileNavRef}>
              <div className="mb-4 flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-stone-500">Biller</p>
                  <h2 className="text-xl font-black">Navigation</h2>
                </div>
                <button type="button" onClick={() => setMobileNavOpen(false)} className="rounded-full bg-white p-2 shadow" aria-label="Close navigation menu"><X size={18} /></button>
              </div>
              <div className="space-y-2 overflow-y-auto pb-4">
                {[
                  { key: "customer", label: "Customer app", action: () => navigate("/") },
                  { key: "owner", label: "Owner app", action: () => navigate("/owner") },
                  { key: "pos", label: "OOC (Order On Counter)", action: () => setBillerTab("pos") }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => { item.action(); setMobileNavOpen(false); }}
                    className="w-full rounded-2xl bg-white px-4 py-3 text-left text-sm font-black shadow-sm"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.25em] text-stone-500">Sections</p>
                  <div className="space-y-2">
                    {[
                      { key: "orders", label: "Live Orders" },
                      { key: "coc", label: "COC Requests" },
                      { key: "verify", label: "Pending Verification" }
                    ].map((tabItem) => (
                      <button
                        key={tabItem.key}
                        type="button"
                        onClick={() => { setBillerTab(tabItem.key); setMobileNavOpen(false); }}
                        className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-black ${billerTab === tabItem.key ? "bg-black text-white" : "bg-stone-100 text-stone-900"}`}
                      >
                        {tabItem.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <BillerPage orders={orders} cocRequests={cocRequests} items={items} categories={categories} onSaved={load} activeTab={billerTab} onChangeTab={setBillerTab} />
      </div>
    </OwnerShell>
  );
}

function OwnerShell({ children }) {
  return <main className="min-h-screen overflow-x-hidden bg-[#f8efe2] p-4 text-stone-950 sm:p-6 lg:p-8">{children}</main>;
}

function Login({ onLogin, navigate, role }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);
    try {
      const endpoint = role === "admin" ? "/auth/owner/login" : "/auth/biller/login";
      const data = await authService.request(endpoint, { email, password, role });
      onLogin(data.user.email);
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const roleLabel = role === "biller" ? "Biller" : "Owner";

  return (
    <OwnerShell>
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-5xl place-items-center py-4 sm:min-h-[calc(100vh-4rem)] sm:py-0">
        <form onSubmit={submit} className="w-full max-w-[22rem] rounded-[1.5rem] bg-white p-5 shadow-glass sm:max-w-md sm:rounded-[2rem] sm:p-6">
          <button type="button" onClick={() => navigate("/")} className="mb-5 text-sm font-black text-stone-500">Back to cafe</button>
          <h1 className="text-2xl font-black sm:text-3xl">{roleLabel} login</h1>
          <p className="mt-2 text-sm font-semibold text-stone-600">Use your registered {roleLabel.toLowerCase()} email and password to sign in.</p>
          <div className="mt-5 space-y-3 sm:mt-6">
            <input className="field min-w-0 bg-stone-50 text-base" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required />
            <input className="field min-w-0 bg-stone-50 text-base" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-black px-5 py-3.5 font-black text-white disabled:cursor-not-allowed disabled:opacity-70 sm:py-4"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
            {error && <p className="text-sm font-bold text-red-700">{error}</p>}
          </div>
        </form>
      </div>
    </OwnerShell>
  );
}

function ForgotPassword({ navigate, role }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const roleLabel = role === "biller" ? "Biller" : "Owner";
  const returnPath = role === "biller" ? "/biller" : "/owner";

  async function requestReset(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const data = await authService.forgotPassword(email, role);
      setMessage(data.message || "Password reset instructions sent to your email.");
      if (data.warning) setError(data.warning);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <OwnerShell>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl place-items-center">
        <form onSubmit={requestReset} className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-glass">
          <button type="button" onClick={() => navigate(returnPath)} className="mb-5 text-sm font-black text-stone-500">Back to login</button>
          <h1 className="text-3xl font-black">{roleLabel} password reset</h1>
          <p className="mt-2 text-sm font-semibold text-stone-600">
            Enter the registered {roleLabel.toLowerCase()} email to receive reset instructions.
          </p>
          <div className="mt-6 space-y-4">
            <input
              className="field bg-stone-50"
              type="email"
              placeholder="Registered email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {error && <p className="text-sm font-bold text-red-700">{error}</p>}
            {message && <p className="text-sm text-emerald-700">{message}</p>}
            <button className="w-full rounded-full bg-black px-5 py-4 font-black text-white">Send reset instructions</button>
          </div>
        </form>
      </div>
    </OwnerShell>
  );
}

function Dashboard({ owner, onLogout, navigate, initialTab = "items" }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [deletedCategories, setDeletedCategories] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [deletedSubcategories, setDeletedSubcategories] = useState({});
  const [orders, setOrders] = useState([]);
  const [cocRequests, setCocRequests] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [localInventoryItems, setLocalInventoryItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [reports, setReports] = useState({});
  const [lastSync, setLastSync] = useState(null);
  const [tab, setTab] = useState(initialTab);
  const [initialBillerTab, setInitialBillerTab] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [editingItem, setEditingItem] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef(null);
  const loadPromiseRef = useRef(null);

  async function load() {
    if (loadPromiseRef.current) return loadPromiseRef.current;
    loadPromiseRef.current = (async () => {
    try {
      const [freshOrders, freshInventory, categoryData, itemData, deletedCategoryData, deletedItemData, cocData, recipeData, reportData] = await Promise.all([
        orderService.listOrders("limit=100").catch(() => sync.getOrdersFromStorage()),
        inventoryStore.loadInventory().catch(() => sync.getInventoryFromStorage()),
        menuService.getCategories(),
        menuService.getMenu({ includeInactive: true }),
        menuService.getCategories({ includeDeleted: true }),
        menuService.getMenu({ includeInactive: true, includeDeleted: true }),
        orderService.listCocRequests().catch(() => []),
        menuService.getRecipes().catch(() => []),
        menuService.getReports().catch(() => ({}))
      ]);
      const safeOrders = Array.isArray(freshOrders) ? freshOrders : [];
      const safeInventory = Array.isArray(freshInventory) ? freshInventory : [];
      try { sync.saveOrders(safeOrders); } catch (error) {}
      try { sync.saveInventory(safeInventory); } catch (error) {}
      const safeCategories = normalizeOwnerCategories(categoryData);
      const safeItems = ensureActiveMenuItems(itemData, safeCategories);
      const activeCategoryIds = new Set(safeCategories.map((category) => category.id));
      setCategories(safeCategories);
      setItems(safeItems.filter((item) => {
        if (!item || item?.isDeleted === true) return false;
        if (activeCategoryIds.size === 0) return false;
        return activeCategoryIds.has(item.categoryId);
      }));
      setDeletedCategories((Array.isArray(deletedCategoryData) ? deletedCategoryData : []).filter((category) => category?.isDeleted === true));
      setDeletedItems((Array.isArray(deletedItemData) ? deletedItemData : []).filter((item) => item?.isDeleted === true));
      setDeletedSubcategories(loadDeletedSubcategoryConfig());
      setOrders(safeOrders);
      setCocRequests(cocData || []);
      setRawMaterials(safeInventory);
      setRecipes(recipeData || []);
      setReports(reportData || {});
      logLoadStats("OwnerDashboard", {
        rawCategories: Array.isArray(categoryData) ? categoryData.length : 0,
        activeCategories: safeCategories.length,
        rawItems: Array.isArray(itemData) ? itemData.length : 0,
        activeItems: safeItems.length,
        rawSubcategories: loadSubcategoryConfig(),
        activeSubcategories: Object.keys(loadSubcategoryConfig()).length,
        deletedCount: ((deletedItemData || []).filter((item) => item?.isDeleted === true).length || 0) + ((deletedCategoryData || []).filter((category) => category?.isDeleted === true).length || 0)
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      const safeCategories = [];
      const safeItems = ensureActiveMenuItems([], safeCategories);
      setCategories(safeCategories);
      setItems(safeItems);
      setDeletedCategories([]);
      setDeletedItems([]);
      setDeletedSubcategories(loadDeletedSubcategoryConfig());
      setOrders(sync.getOrdersFromStorage());
      setCocRequests([]);
      setRawMaterials(sync.getInventoryFromStorage());
      setRecipes([]);
      setReports({});
      logLoadStats("OwnerDashboard (fallback)", {
        rawCategories: 0,
        activeCategories: safeCategories.length,
        rawItems: 0,
        activeItems: safeItems.length,
        rawSubcategories: loadSubcategoryConfig(),
        activeSubcategories: Object.keys(loadSubcategoryConfig()).length,
        deletedCount: 0
      });
    }
    })();
    try {
      return await loadPromiseRef.current;
    } finally {
      loadPromiseRef.current = null;
    }
  }

  useEffect(() => {
    const unsubOrders = ordersStore.subscribe(() => { setLastSync(new Date().toISOString()); });
    const unsubInventory = inventoryStore.subscribe((data) => setRawMaterials(data || []));
    load().catch(() => {});
    
    let es = null;
    let reconnectTimeout = null;
    let streamLoadTimer = null;
    let isActive = true;
    
    function setupStream() {
      if (!isActive || es) return;
      try {
        es = new EventSource(`${API}/orders/stream`, { withCredentials: true });
        const handleUpdate = () => {
          setLastSync(new Date().toISOString());
          if (streamLoadTimer) clearTimeout(streamLoadTimer);
          streamLoadTimer = setTimeout(() => {
            streamLoadTimer = null;
            load();
          }, 150);
        };
        es.addEventListener("order:created", handleUpdate);
        es.addEventListener("order:updated", handleUpdate);
        es.addEventListener("coc:created", handleUpdate);
        es.onerror = () => {
          try { es.close(); } catch (e) {}
          es = null;
          // Reconnect after 3 seconds
          if (isActive) reconnectTimeout = setTimeout(() => setupStream(), 3000);
        };
      } catch (error) {
        if (isActive) reconnectTimeout = setTimeout(() => setupStream(), 3000);
      }
    }
    
    setupStream();
    return () => {
      isActive = false;
      if (streamLoadTimer) clearTimeout(streamLoadTimer);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      try { if (es) es.close(); } catch (e) {}
      unsubOrders();
      unsubInventory();
    };
  }, []);

  useEffect(() => {
    function handleOwnerDataUpdated() {
      load();
    }

    function handleStorage(event) {
      if (!event.key) return;
      if (event.key === SUBCATEGORY_CONFIG_KEY || event.key === DELETED_SUBCATEGORY_CONFIG_KEY || event.key === INVENTORY_ITEMS_KEY) {
        load();
      }
    }

    window.addEventListener("ownerDataUpdated", handleOwnerDataUpdated);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("ownerDataUpdated", handleOwnerDataUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    function syncLocalInventory(event) {
      const nextItems = event?.detail ? normalizeLocalInventoryItems(event.detail) : loadLocalInventoryItems();
      setLocalInventoryItems(nextItems);
    }

    syncLocalInventory();
    window.addEventListener("inventoryUpdated", syncLocalInventory);
    window.addEventListener("storage", syncLocalInventory);
    return () => {
      window.removeEventListener("inventoryUpdated", syncLocalInventory);
      window.removeEventListener("storage", syncLocalInventory);
    };
  }, []);

  async function logout() {
    try {
      await authService.logout();
    } catch (error) {
      console.warn("Logout request failed; clearing cached dashboard data anyway.", error);
    }
    clearDashboardCache();
    try { window.dispatchEvent(new CustomEvent("ordersUpdated", { detail: [] })); } catch (error) {}
    try { window.dispatchEvent(new CustomEvent("inventoryUpdated", { detail: [] })); } catch (error) {}
    onLogout();
  }

  async function confirmPendingDelete() {
    if (!pendingDelete) return;
    const action = pendingDelete;
    setPendingDelete(null);
    try {
      if (action.type === "item") {
        await menuService.deleteMenuItem(action.id);
        dispatchOwnerDataUpdated({ source: "itemDeleted", id: action.id });
      } else if (action.type === "category") {
        await menuService.deleteCategory(action.id);
        dispatchOwnerDataUpdated({ source: "categoryDeleted", id: action.id });
      } else if (action.type === "subcategory") {
        permanentlyDeleteSubcategory(action.parentId, action.name);
      } else if (action.type === "permanent-item") {
        await menuService.permanentlyDeleteMenuItem(action.id);
        dispatchOwnerDataUpdated({ source: "itemPermanentlyDeleted", id: action.id });
      } else if (action.type === "permanent-category") {
        await menuService.permanentlyDeleteCategory(action.id);
        dispatchOwnerDataUpdated({ source: "categoryPermanentlyDeleted", id: action.id });
      } else if (action.type === "permanent-subcategory") {
        permanentlyDeleteSubcategory(action.parentId, action.name);
      } else if (action.type === "permanent-inventory") {
        const nextItems = loadLocalInventoryItems().filter((item) => item.id !== action.id);
        saveLocalInventoryItems(nextItems);
      }
      setEditingItem(null);
      load();
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  }

  async function restoreItem(id) {
    await menuService.restoreMenuItem(id);
    dispatchOwnerDataUpdated({ source: "itemRestored", id });
    load();
  }

  async function restoreCategory(id) {
    await menuService.restoreCategory(id);
    dispatchOwnerDataUpdated({ source: "categoryRestored", id });
    load();
  }

  async function restoreSubcategory(parentId, name) {
    restoreDeletedSubcategory(parentId, name);
    setDeletedSubcategories(loadDeletedSubcategoryConfig());
    load();
  }

  function restoreInventoryItem(id) {
    const nextItems = localInventoryItems.map((item) => (item.id === id ? { ...item, isDeleted: false, deletedAt: null } : item));
    setLocalInventoryItems(saveLocalInventoryItems(nextItems));
  }

  useEffect(() => {
    if (!mobileNavOpen) return;

    function handlePointerDown(event) {
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target)) {
        setMobileNavOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileNavOpen]);

  const deletedSubcategoryCount = Object.values(deletedSubcategories || {}).reduce((total, entries) => total + (Array.isArray(entries) ? entries.length : 0), 0);
  const deletedInventoryItems = localInventoryItems.filter((item) => item?.isDeleted === true);
  const deletedCount = (deletedItems?.length || 0) + (deletedCategories?.length || 0) + deletedSubcategoryCount + deletedInventoryItems.length;

  const inventoryAttentionItems = useMemo(() => {
    const serverItems = Array.isArray(rawMaterials) ? rawMaterials : [];
    const localItems = Array.isArray(localInventoryItems) ? localInventoryItems : [];
    const mergedItems = [...serverItems, ...localItems];
    const seen = new Set();

    return mergedItems.filter((item) => {
      if (!item || item?.isDeleted === true) return false;
      const key = String(item.id ?? item._id ?? item.name ?? "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rawMaterials, localInventoryItems]);

  const lowStockCount = inventoryAttentionItems.filter((item) => {
    const quantity = Number(item.quantity ?? item.stock ?? 0) || 0;
    const minStock = Number(item.minStock ?? item.minimumStock ?? 0) || 0;
    return quantity > 0 && quantity <= minStock;
  }).length;

  const outOfStockCount = inventoryAttentionItems.filter((item) => {
    const quantity = Number(item.quantity ?? item.stock ?? 0) || 0;
    return quantity <= 0;
  }).length;

  const attentionCount = lowStockCount + outOfStockCount;
  const needsInventoryAttention = attentionCount > 0;

  const ownerTabs = [
    { key: "items", label: "Items" },
    { key: "categories", label: "Categories" },
    { key: "inventory", label: "Inventory" },
    { key: "stock", label: "Add Stock" },
    { key: "recipes", label: "Recipe Mapping" },
    { key: "lowstock", label: "Low Stock" },
    { key: "reports", label: "Reports" },
    { key: "history", label: "Order History" },
    { key: "profit", label: "Total Profit" }
  ];

  const visibleItems = [...items]
    .filter((item) => item?.isDeleted !== true)
    .filter((item) => !search || item.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (sort === "price" ? a.sizes[0].price - b.sizes[0].price : a.name.localeCompare(b.name)));

  return (
    <OwnerShell>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-stone-500">{owner}</p>
            <h1 className="text-4xl font-black tracking-tight">Owner Dashboard</h1>
            {lastSync && <p className="mt-1 text-xs text-stone-500">Last sync: {new Date(lastSync).toLocaleString()}</p>}
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-full bg-white p-3 text-stone-700 shadow transition hover:bg-stone-100"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button onClick={() => navigate("/")} className="rounded-full bg-white px-4 py-3 text-sm font-black shadow">Customer app</button>
              <button onClick={() => navigate("/biller")} className="rounded-full bg-white px-4 py-3 text-sm font-black shadow">Biller app</button>
              <button onClick={logout} className="flex items-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-black text-white"><LogOut size={17} /> Logout</button>
            </div>
            {tab === "biller" && (
              <div>
                <button
                  onClick={() => { setTab("biller"); setInitialBillerTab("pos"); }}
                  className="rounded-full bg-white px-4 py-3 text-sm font-black shadow"
                >
                  OOC (Order On Counter)
                </button>
              </div>
            )}
            <div>
              <button
                onClick={() => setTab("deleted")}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black shadow"
              >
                <span>Recently Deleted</span>
                <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-stone-100 px-2 py-1 text-[11px] font-black text-stone-700">{deletedCount}</span>
              </button>
            </div>
          </div>
        </div>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 bg-stone-950/40 md:hidden" aria-hidden="true">
            <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-[#fffaf5] p-4 shadow-2xl" ref={mobileNavRef}>
              <div className="mb-4 flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-stone-500">Owner</p>
                  <h2 className="text-xl font-black">Navigation</h2>
                </div>
                <button type="button" onClick={() => setMobileNavOpen(false)} className="rounded-full bg-white p-2 shadow" aria-label="Close navigation menu"><X size={18} /></button>
              </div>
              <div className="space-y-2 overflow-y-auto pb-4">
                {[
                  { key: "customer", label: "Customer app", action: () => navigate("/") },
                  { key: "biller", label: "Biller app", action: () => navigate("/biller") },
                  { key: "deleted", label: `Recently Deleted (${deletedCount})`, action: () => { setTab("deleted"); setMobileNavOpen(false); } },
                  ...(tab === "biller" ? [{ key: "ooc", label: "OOC (Order On Counter)", action: () => { setTab("biller"); setInitialBillerTab("pos"); setMobileNavOpen(false); } }] : [])
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => { item.action(); setMobileNavOpen(false); }}
                    className="w-full rounded-2xl bg-white px-4 py-3 text-left text-sm font-black shadow-sm"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.25em] text-stone-500">Sections</p>
                  <div className="space-y-2">
                    {ownerTabs.map((tabItem) => {
                      const isLowStockAlertButton = tabItem.key === "lowstock" && needsInventoryAttention;
                      return (
                        <button
                          key={tabItem.key}
                          type="button"
                          onClick={() => { setTab(tabItem.key); setMobileNavOpen(false); }}
                          className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-black ${tab === tabItem.key ? "bg-black text-white" : isLowStockAlertButton ? "bg-red-600 text-white shadow-[0_0_0_1px_rgba(220,38,38,0.15),0_10px_20px_rgba(220,38,38,0.18)]" : "bg-stone-100 text-stone-900"}`}
                        >
                          {tabItem.label}
                          {isLowStockAlertButton && attentionCount > 0 ? <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-black">{attentionCount}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button type="button" onClick={() => { logout(); setMobileNavOpen(false); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-black text-white shadow-sm"><LogOut size={17} /> Logout</button>
              </div>
            </div>
          </div>
        )}
        <div className="mb-5 hidden md:flex flex-wrap gap-2">
          {ownerTabs.map((tabItem) => {
            const isLowStockAlertButton = tabItem.key === "lowstock" && needsInventoryAttention;
            return (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className={`rounded-full px-5 py-3 text-sm font-black ${tab === tabItem.key ? "bg-black text-white" : isLowStockAlertButton ? "bg-red-600 text-white shadow-[0_0_0_1px_rgba(220,38,38,0.15),0_10px_20px_rgba(220,38,38,0.18)]" : "bg-white text-stone-900"}`}
              >
                {tabItem.label}
                {isLowStockAlertButton && attentionCount > 0 ? <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-black">{attentionCount}</span> : null}
              </button>
            );
          })}
        </div>
        {tab === "items" && (
          <section className="grid gap-5 lg:grid-cols-[1fr_430px]">
            <div className="order-2 md:order-1 rounded-[1.5rem] bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:flex-wrap">
                <label className="flex w-full items-center gap-2 rounded-full bg-stone-100 px-4 py-2 md:flex-1"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search items" className="w-full bg-transparent text-sm font-bold outline-none" /></label>
                <label className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 md:ml-auto"><SlidersHorizontal size={18} /><select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent text-sm font-bold outline-none"><option value="name">Name</option><option value="price">Base price</option></select></label>
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead><tr className="border-b text-xs uppercase text-stone-500"><th className="py-3">Item</th><th>Category</th><th>Sub Category</th><th>Sizes</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {visibleItems.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 font-black">{item.name}</td>
                        <td>{categories.find((cat) => cat.id === item.categoryId)?.name || item.categoryId}</td>
                        <td>{item.subCategoryName || item.subcategoryName || item.subcategory || "-"}</td>
                        <td>{item.sizes.map((size) => `${size.label} ${rupees(size.price)}`).join(" / ")}</td>
                        <td>{item.active ? "Active" : "Hidden"}</td>
                        <td>
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditingItem(item)} className="rounded-full p-2 hover:bg-stone-100" aria-label={`Edit ${item.name}`}><Pencil size={17} /></button>
                            <button onClick={() => setPendingDelete({ type: "item", id: item.id, name: item.name })} className="rounded-full p-2 hover:bg-red-50" aria-label={`Delete ${item.name}`}><Trash2 size={17} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3 md:hidden">
                {visibleItems.map((item) => (
                  <article key={item.id} className="rounded-[1.5rem] bg-stone-50 p-4 shadow-sm ring-1 ring-stone-200">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-stone-950">{item.name}</h3>
                        <p className="text-sm text-stone-600">{categories.find((cat) => cat.id === item.categoryId)?.name || item.categoryId} • {item.subCategoryName || item.subcategoryName || item.subcategory || "-"}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${item.active ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-700"}`}>{item.active ? "Active" : "Hidden"}</span>
                    </div>
                    <div className="mt-3 text-sm text-stone-700">
                      <p className="font-semibold">{item.sizes.map((size) => `${size.label} ${rupees(size.price)}`).join(" / ")}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button onClick={() => setEditingItem(item)} className="rounded-full bg-white px-3 py-2 text-sm font-black shadow-sm" aria-label={`Edit ${item.name}`}>Edit</button>
                      <button onClick={() => setPendingDelete({ type: "item", id: item.id, name: item.name })} className="rounded-full bg-rose-50 px-3 py-2 text-sm font-black text-rose-700 shadow-sm" aria-label={`Delete ${item.name}`}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <ItemForm categories={categories} editingItem={editingItem} onCancelEdit={() => setEditingItem(null)} onSaved={() => { setEditingItem(null); load(); }} />
            </div>
          </section>
        )}
        {tab === "categories" && <CategoryAdmin categories={categories} onSaved={load} />}
        {tab === "deleted" && (
          <RecentlyDeletedPanel
            categories={categories}
            deletedCategories={deletedCategories}
            deletedItems={deletedItems}
            deletedSubcategories={deletedSubcategories}
            deletedInventories={deletedInventoryItems}
            onRestoreCategory={restoreCategory}
            onRestoreItem={restoreItem}
            onRestoreSubcategory={restoreSubcategory}
            onRestoreInventory={restoreInventoryItem}
            onRequestPermanentDelete={setPendingDelete}
          />
        )}
        {tab === "biller" && <BillerPage orders={orders} cocRequests={cocRequests} items={items} categories={categories} onSaved={load} initialTab={initialBillerTab} />}
        {tab === "inventory" && <InventoryAdmin rawMaterials={rawMaterials} onSaved={load} onInventoryChanged={setLocalInventoryItems} />}
        {tab === "stock" && <AddStockPage rawMaterials={rawMaterials} onSaved={load} />}
        {tab === "recipes" && <RecipeMapping items={items} rawMaterials={rawMaterials} recipes={recipes} onSaved={load} />}
        {tab === "lowstock" && <LowStockAlerts rawMaterials={rawMaterials} />}
        {tab === "reports" && <ReportsPage reports={reports} items={items} orders={orders} rawMaterials={rawMaterials} recipes={recipes} />}
        {tab === "history" && <OrderHistory orders={mergeOrderHistoryRecords(orders, cocRequests)} />}
        {tab === "profit" && <TotalProfitPage orders={orders} rawMaterials={rawMaterials} recipes={recipes} />}
      </div>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete?.type === "item" ? `Delete ${pendingDelete?.name || "item"}?` : "Delete forever?"}
        message={pendingDelete?.type === "item" ? "This will move the item to Recently Deleted so it can be restored later." : "This will permanently remove the selected record."}
        confirmLabel={pendingDelete?.type === "item" ? "Delete" : "Delete forever"}
        cancelLabel="Cancel"
        onConfirm={confirmPendingDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </OwnerShell>
  );
}

function isBillerCocRequestCandidate(order) {
  const orderType = normalizeStatus(order?.orderType || order?.type || "");
  const source = normalizeStatus(order?.source || order?.createdFrom || order?._source || order?.orderSource || "");
  const paymentMethod = String(order?.paymentMethod || order?.method || "").toLowerCase();
  const notes = String(order?.notes || order?.note || "").toLowerCase();
  const status = normalizeStatus(order?.status);
  const paymentStatus = normalizeStatus(order?.paymentStatus);
  const hasOocSignal = orderType === "ooc" || source === "ooc" || /\booc\b|order on counter/.test(`${source} ${notes}`);
  const isCashCounterOrder = paymentMethod === "cash" || /cash/.test(paymentMethod) || /cash on counter|cash counter|counter cash/.test(notes);
  const needsApproval = ["new", "pending", "pending verification", "pending_verification"].includes(status) || ["new", "pending", "pending verification", "pending_verification"].includes(paymentStatus) || Boolean(order?.pendingApproval);

  return hasOocSignal && isCashCounterOrder && needsApproval;
}

function mergeCocRequestEntries(orders, cocRequests) {
  return mergeCocRequestEntriesFromHelper(orders, cocRequests);
}

function mergeBillerOrders(orders, cocRequests) {
  const liveOrders = (Array.isArray(orders) ? orders : []).filter((order) => {
    const classification = getBillerOrderClassification(order);
    return classification.isLiveOrder || classification.isPendingVerification;
  });
  const pendingCocRequests = Array.isArray(cocRequests) ? cocRequests : [];
  const seen = new Map();
  const blockedCocKeys = new Set();

  (Array.isArray(orders) ? orders : []).forEach((order) => {
    if (!isCocTerminalState(order)) return;
    getCocRequestIdentityKeys(order).forEach((key) => blockedCocKeys.add(key));
  });

  liveOrders.forEach((order) => {
    const key = order?.orderId || order?.id || order?._id;
    if (key) seen.set(key, { ...order });
  });

  pendingCocRequests.forEach((request) => {
    if (isCocTerminalState(request)) return;
    if (getCocRequestIdentityKeys(request).some((key) => blockedCocKeys.has(key))) return;
    if (!getBillerOrderClassification(request).isCocRequest) return;
    const key = resolveCocRequestId(request);
    if (!key) return;
    if (!seen.has(key)) {
      seen.set(key, {
        ...request,
        id: key,
        requestId: request?.requestId || key,
        orderType: request?.orderType || "COC",
        paymentMethod: request?.paymentMethod || "cash",
        status: normalizeStatus(request?.status || "pending"),
        paymentStatus: normalizeStatus(request?.paymentStatus || "pending"),
        _source: request?._source || "coc-request",
        pendingApproval: true
      });
    }
  });

  return Array.from(seen.values()).sort((left, right) => {
    const leftTime = new Date(left?.createdAt || left?.updatedAt || 0).getTime();
    const rightTime = new Date(right?.createdAt || right?.updatedAt || 0).getTime();
    return rightTime - leftTime;
  });
}

function BillerPage({ orders, cocRequests, items, categories, onSaved, activeTab = null, onChangeTab, initialTab = null }) {
  const [internalTab, setInternalTab] = useState((activeTab ?? initialTab) || "orders");
  const [seenPendingVerificationCount, setSeenPendingVerificationCount] = useState(0);
  const [hasPendingVerificationAlert, setHasPendingVerificationAlert] = useState(false);
  const [seenCocRequestCount, setSeenCocRequestCount] = useState(0);
  const [hasCocAlert, setHasCocAlert] = useState(false);
  const billerTab = activeTab ?? internalTab;
  const firstBillerRender = useRef(true);

  const liveOrders = useMemo(() => mergeBillerOrders(orders, cocRequests), [orders, cocRequests]);
  const effectiveCocRequests = useMemo(() => mergeCocRequestEntries(orders, cocRequests), [orders, cocRequests]);

  const pendingVerificationOrders = useMemo(() => {
    return (liveOrders || []).filter(isPendingVerificationOrder);
  }, [liveOrders]);

  const pendingVerificationCount = pendingVerificationOrders.length;
  const liveOrderCount = useMemo(() => {
    return (liveOrders || []).filter((order) => getBillerOrderClassification(order).isLiveOrder).length;
  }, [liveOrders]);
  const cocRequestCount = (effectiveCocRequests || []).length;

  useEffect(() => {
    if (firstBillerRender.current) {
      firstBillerRender.current = false;
      setSeenPendingVerificationCount(pendingVerificationCount);
      setSeenCocRequestCount(cocRequestCount);
      return;
    }

    if (billerTab === "verify") {
      setHasPendingVerificationAlert(false);
      setSeenPendingVerificationCount(pendingVerificationCount);
    } else if (pendingVerificationCount > seenPendingVerificationCount) {
      setHasPendingVerificationAlert(true);
      setSeenPendingVerificationCount(pendingVerificationCount);
    } else {
      setSeenPendingVerificationCount(pendingVerificationCount);
    }

    if (billerTab === "coc") {
      setHasCocAlert(false);
      setSeenCocRequestCount(cocRequestCount);
    } else if (cocRequestCount > seenCocRequestCount) {
      setHasCocAlert(true);
      setSeenCocRequestCount(cocRequestCount);
    } else {
      setSeenCocRequestCount(cocRequestCount);
    }
  }, [pendingVerificationCount, cocRequestCount, billerTab, seenPendingVerificationCount, seenCocRequestCount]);

  useEffect(() => {
    if (activeTab !== null && activeTab !== undefined) {
      setInternalTab(activeTab);
    } else if (initialTab) {
      setInternalTab(initialTab);
    }
  }, [activeTab, initialTab]);

  const handleTabChange = (key) => {
    if (onChangeTab) return onChangeTab(key);
    setInternalTab(key);
  };

  return (
    <section className="grid gap-5">
      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { key: "orders", label: "Live Orders" },
          { key: "coc", label: "COC Requests" },
          { key: "verify", label: "Pending Verification" }
        ].map((t) => (
          <button key={t.key} onClick={() => handleTabChange(t.key)} className={`rounded-full px-5 py-3 text-sm font-black ${billerTab === t.key ? "bg-black text-white" : "bg-white"}`}>
            <span className="inline-flex items-center gap-2">
              {t.label}
              {t.key === "orders" && liveOrderCount > 0 && (
                <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-600 px-2 text-[11px] font-black text-white ring-1 ring-emerald-200">
                  {liveOrderCount}
                </span>
              )}
              {t.key === "verify" && pendingVerificationCount > 0 && (
                <span className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-[11px] font-black text-white ${hasPendingVerificationAlert ? "animate-pulse bg-rose-600 ring-2 ring-rose-300" : "bg-rose-600"}`}>
                  {pendingVerificationCount}
                </span>
              )}
              {t.key === "coc" && cocRequestCount > 0 && (
                <span className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-[11px] font-black text-white ${hasCocAlert ? "animate-pulse bg-rose-600 ring-2 ring-rose-300" : "bg-rose-600"}`}>
                  {cocRequestCount}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      <div>
        {billerTab === "orders" && <OrderAdmin orders={liveOrders} onSaved={onSaved} hideWarnings={true} />}
        {billerTab === "coc" && <CocAdmin cocRequests={effectiveCocRequests} onSaved={onSaved} />}
        {billerTab === "pos" && <PosBilling items={items} categories={categories} onSaved={onSaved} />}
        {billerTab === "verify" && <PendingVerification orders={liveOrders} onSaved={onSaved} />}
      </div>
    </section>
  );
}

function PendingVerification({ orders, onSaved }) {
  const [processing, setProcessing] = useState({});
  const [confirmedMap, setConfirmedMap] = useState({});

  const pending = (orders || []).filter((o) => {
    return isPendingVerificationOrder(o);
  });

  async function confirmPayment(order) {
    const key = order._id || order.id;
    if (processing[key]) return;
    setProcessing((p) => ({ ...p, [key]: true }));
    try {
      const payload = createOrderStatusUpdatePayload({ paymentStatus: "confirmed", status: "confirmed", timestampField: "confirmedAt" });
      const updated = await orderService.patchOrder(key, payload);
      setConfirmedMap((m) => ({ ...m, [key]: true }));
      onSaved();
    } catch (err) {
      alert(err.message || "Failed to confirm order.");
    } finally {
      setProcessing((p) => ({ ...p, [key]: false }));
    }
  }

  async function rejectPayment(order) {
    const key = order._id || order.id;
    if (processing[key]) return;
    if (!window.confirm("Are you sure you want to reject this payment?")) return;
    setProcessing((p) => ({ ...p, [key]: true }));
    try {
      const payload = createOrderStatusUpdatePayload({ paymentStatus: "rejected", status: "pending", rejectionMessage: "Your payment was rejected by the biller. Please check your payment and tap Check Payment / Try Again.", timestampField: "rejectedAt" });
      const updated = await orderService.patchOrder(key, payload);
      onSaved();
    } catch (err) {
      alert(err.message || "Failed to reject payment.");
    } finally {
      setProcessing((p) => ({ ...p, [key]: false }));
    }
  }

  if (!pending.length) return <p className="rounded-[1.5rem] bg-white p-6 font-bold text-stone-500">No pending payments.</p>;

  return (
    <section className="space-y-3">
      {pending.map((order) => {
        const sourceLabel = getBillerOrderClassification(order).sourceBadge;
        const orderItems = Array.isArray(order?.items) ? order.items : [];
        const paymentLabel = String(order?.paymentMethod || order?.method || "").toLowerCase().includes("cash") ? "Cash on Counter" : "Online";

        return (
          <article key={order._id || order.id} className="rounded-[1.5rem] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-black sm:text-xl">
                  <span className="sm:hidden">{order.customerName || "Customer"} • Table {order.tableNumber ?? order.table ?? "-"}</span>
                  <span className="hidden sm:inline">{order.customerName}</span>
                </h2>
                <p className="text-sm font-bold leading-5 text-stone-500">
                  <span className="sm:hidden">{order.phone || "-"} • {rupees(order.total)} • {paymentLabel}</span>
                  <span className="hidden sm:inline">Order {order.orderId || order.id || order._id} • Table {order.tableNumber} • {order.phone} • {rupees(order.total)}</span>
                </p>
              </div>
              {sourceLabel && (
                <span className="w-fit rounded-full bg-stone-100 px-2 py-1 text-[11px] font-black uppercase tracking-[0.04em] text-stone-700 sm:hidden">
                  {sourceLabel}
                </span>
              )}
              <div className="hidden w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto sm:flex-wrap">
                {sourceLabel && (
                  <span className="w-fit rounded-full bg-stone-100 px-2 py-1 text-[11px] font-black uppercase tracking-[0.04em] text-stone-700">
                    {sourceLabel}
                  </span>
                )}
                {['payment_issue', 'rejected', 'payment_rejected'].includes(String(order.paymentStatus || '').toLowerCase()) && (
                  <span className="w-fit rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-600">Payment Rejected</span>
                )}
                {(!confirmedMap[order._id || order.id] && order.status !== 'confirmed') ? (
                  <button onClick={() => confirmPayment(order)} disabled={processing[order._id || order.id]} className="col-span-2 rounded-full bg-emerald-700 px-3 py-2 text-xs font-black leading-tight text-white sm:col-span-1 sm:px-4 sm:text-sm">Confirm Payment & Order</button>
                ) : (
                  <button disabled className="col-span-2 rounded-full bg-emerald-700 px-3 py-2 text-xs font-black text-white sm:col-span-1 sm:px-4 sm:text-sm">Confirmed</button>
                )}
                {(!confirmedMap[order._id || order.id] && order.status !== 'confirmed') && (
                  <button onClick={() => rejectPayment(order)} disabled={processing[order._id || order.id]} className="col-span-2 rounded-full bg-rose-200 px-3 py-2 text-xs font-black sm:col-span-1 sm:px-4 sm:text-sm">Reject Payment</button>
                )}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-200/80 pt-4 sm:hidden">
              <div className="grid gap-3 text-sm text-stone-700">
                {orderItems.map((line, index) => (
                  <OrderLineCard key={index} line={line} order={order} />
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-200/80 pt-4 sm:hidden">
              <div className="flex items-center gap-2">
                {(!confirmedMap[order._id || order.id] && order.status !== 'confirmed') ? (
                  <button onClick={() => confirmPayment(order)} disabled={processing[order._id || order.id]} className="flex-1 rounded-full bg-emerald-700 px-3 py-2 text-xs font-black leading-tight text-white">Confirm Payment & Order</button>
                ) : (
                  <button disabled className="flex-1 rounded-full bg-emerald-700 px-3 py-2 text-xs font-black text-white">Confirmed</button>
                )}
                {(!confirmedMap[order._id || order.id] && order.status !== 'confirmed') && (
                  <button onClick={() => rejectPayment(order)} disabled={processing[order._id || order.id]} className="flex-1 rounded-full bg-rose-200 px-3 py-2 text-xs font-black">Reject Payment</button>
                )}
              </div>
            </div>
            <div className="mt-3 hidden gap-2 text-sm font-semibold text-stone-700 sm:grid">
              {orderItems.map((line, index) => <p key={index}>{formatOrderItemLine(line)}</p>)}
            </div>
          </article>
        );
      })}
    </section>
  );
}


function OrderAdmin({ orders, onSaved, hideWarnings = false }) {
  const [updateError, setUpdateError] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [printConfig, setPrintConfig] = useState({});

  async function updateOrderStatus(orderId, newStatus) {
    try {
      setUpdateError("");
      setUpdateMessage("");
      await orderService.patchOrder(orderId, { status: newStatus });
      setUpdateMessage("Order status updated successfully.");
      onSaved();
    } catch (error) {
      setUpdateError(error.message || "Failed to update order status");
      console.error(error);
    }
  }

  function setPrintOption(orderId, key, value) {
    setPrintConfig((current) => ({ ...current, [orderId]: { ...current[orderId], [key]: value } }));
  }

  function isLiveOrderVisible(order) {
    return getBillerOrderClassification(order).isLiveOrder;
  }

  function printOrder(order, copyType = "customer") {
    const normalizedOrder = normalizeReceiptOrder(order);
    const config = printConfig[normalizedOrder._id || normalizedOrder.id || normalizedOrder.orderId] || {};
    const receiptLabel = copyType === "customer" ? "Customer Bill" : copyType === "kitchen" ? "Kitchen Copy" : "Customer / Kitchen Copy";
    const receiptHtml = `
      <html>
        <head>
          <title>${receiptLabel} - ${normalizedOrder.orderId}</title>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <style>
            body{margin:0;padding:0}
            .receipt{width:300px;background:#fff;color:#000;font-family:'Courier New',monospace;font-size:11px;padding:12px;margin:8px auto}
            .receipt *{color:#000}
            .receipt-header{text-align:center}
            .receipt-title{font-size:18px;font-weight:900;letter-spacing:3px}
            .receipt-line{border-top:1px dashed #000;margin:8px 0}
            .receipt-row{display:flex;justify-content:space-between;gap:8px}
            .receipt-table-header,.receipt-item{display:grid;grid-template-columns:30px 1fr 70px;gap:6px}
            .receipt-amount{text-align:right}
            .receipt-total{display:flex;justify-content:space-between;font-size:20px;font-weight:900;margin-top:8px}
            .receipt-qr{display:flex;justify-content:center;margin-top:10px}
            @media print{body *{visibility:hidden}.receipt,.receipt *{visibility:visible}.receipt{position:absolute;left:0;top:0;margin:0;width:300px}}
          </style>
        </head>
        <body>
          <article class="receipt">
            <div class="receipt-header">
              <div>CUSTOMER COPY</div>
              <div class="receipt-title">THE INFUSION SAGA</div>
              <div style="font-size:11px">A155, Ramnagariya Rd, Mahadev Nagar, Jagatpura, Jaipur, Rajasthan 302017</div>
            </div>
            <div class="receipt-line"></div>
            <div>
              <div class="receipt-row"><div>Date</div><div>${new Date(normalizedOrder.createdAt||Date.now()).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div></div>
              <div class="receipt-row"><div>Order ID</div><div>${normalizedOrder.orderId}</div></div>
              <div class="receipt-row"><div>Table</div><div>${normalizedOrder.tableNumber ?? (normalizedOrder.table ?? '-')}</div></div>
              <div class="receipt-row"><div>Customer</div><div>${normalizedOrder.customerName || 'Guest'}</div></div>
              <div class="receipt-row"><div>Phone</div><div>${normalizedOrder.phone || '-'}</div></div>
              <div class="receipt-row"><div>Payment</div><div>${normalizedOrder.paymentMethod || 'Cash'}</div></div>
              <div class="receipt-row"><div>Status</div><div>${normalizedOrder.paymentStatus || 'Unknown'}</div></div>
              <div class="receipt-row"><div>Invoice</div><div>${normalizedOrder.invoiceNo || `INV-${String(normalizedOrder.orderId).slice(-8)}`}</div></div>
              <div class="receipt-row"><div>GSTIN</div><div>${normalizedOrder.gstin || normalizedOrder.GSTIN || '08AAAPL1234C1Z1'}</div></div>
            </div>
            <div class="receipt-line"></div>
            <div>
              <div class="receipt-table-header"><div>QTY</div><div>DESC</div><div class="receipt-amount">AMT</div></div>
              ${Array.isArray(normalizedOrder.items) && normalizedOrder.items.length? normalizedOrder.items.map(line=>{
                const qty = line.quantity||line.qty||1;
                const amt = Math.round(Number((line.lineTotal ?? ((line.unitPrice || 0) * qty)) || 0));
                return `<div class="receipt-item"><div>${qty}</div><div><div style="font-weight:700">${formatOrderItemLine(line)}</div></div><div class="receipt-amount">Rs. ${amt}</div></div>`;
              }).join('') : '<div style="padding:8px 0">No items.</div>'}
            </div>
            <div class="receipt-line"></div>
            <div>
              <div class="receipt-row"><div>Subtotal</div><div>Rs. ${Math.round(Number(normalizedOrder.subtotal || getOrderTotal(normalizedOrder) || 0))}</div></div>
              <div class="receipt-row"><div>Tax (${Math.round((normalizedOrder.gstRate||0.05)*100)}%)</div><div>Rs. ${Math.round(Number(normalizedOrder.gst||0))}</div></div>
              <div class="receipt-total"><div>AMOUNT</div><div>Rs. ${Math.round(Number(normalizedOrder.total||normalizedOrder.grandTotal||0))}</div></div>
            </div>
            <div class="receipt-qr"><div><img src="" id="qrimg" style="width:64px;height:64px;object-fit:contain"/></div></div>
          </article>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    // try to generate QR in the opened window if QRCode available
    try {
      if (window.QRCode && typeof window.QRCode.toDataURL === 'function') {
        window.QRCode.toDataURL(String(normalizedOrder.orderId), {width:150}).then(url=>{
          const img = printWindow.document.getElementById('qrimg');
          if (img) img.src = url;
        }).catch(()=>{});
      }
    } catch(e) {}
    if (config.autoPrint) {
      printWindow.print();
    }
  }

  // In-page preview state and helper
  const [previewOrder, setPreviewOrder] = useState(null);
  const [previewCopy, setPreviewCopy] = useState("customer");
  const [showPreview, setShowPreview] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(300);
  const [previewFontSize, setPreviewFontSize] = useState(11);

  function openPreview(order, copyType = "customer") {
    setPreviewOrder(preparePrintableOrder(order));
    setPreviewCopy(copyType);
    setShowPreview(true);
    setPreviewWidth(300);
    setPreviewFontSize(11);
    // allow printing directly after opening using browser print
  }

  // Shared standard status options for both QR and COC orders
  const STANDARD_ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'payment_rejected'];

  return (
    <section className="space-y-3">
      {updateError && <div className="rounded-[1.5rem] bg-red-50 p-4 text-sm font-bold text-red-700">Error: {updateError}</div>}
      {updateMessage && <div className="rounded-[1.5rem] bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{updateMessage}</div>}
      {((orders || []).filter((o) => isLiveOrderVisible(o))).map((order) => {
        const safeOrder = order || {};
        const orderItems = Array.isArray(safeOrder.items) ? safeOrder.items : [];
        const orderWarnings = Array.isArray(safeOrder.warnings) ? safeOrder.warnings : [];
        const sourceLabel = getBillerOrderClassification(safeOrder).sourceBadge;
        const statusValue = STANDARD_ORDER_STATUSES.includes(String(safeOrder.status || "").toLowerCase()) ? String(safeOrder.status || "").toLowerCase() : 'pending';

        return (
        <article key={safeOrder._id || safeOrder.id} className="rounded-[1.5rem] border-2 border-black bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{safeOrder.customerName || "Customer"}</h2>
              <p className="text-sm font-bold text-stone-500">Order {safeOrder.orderId || safeOrder.id || safeOrder._id || "-"} • Table {safeOrder.tableNumber ?? safeOrder.table ?? "-"} • {safeOrder.phone || "-"} • {rupees(safeOrder.total || 0)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {sourceLabel && (
                <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-black uppercase tracking-[0.04em] text-stone-700">
                  {sourceLabel}
                </span>
              )}
              <select value={statusValue} onChange={(event) => updateOrderStatus(safeOrder._id || safeOrder.id, event.target.value)} className="rounded-full bg-stone-100 px-4 py-2 text-sm font-black">
                {STANDARD_ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>{getOrderStatusLabel({ status })}</option>
                ))}
              </select>
              <button onClick={() => openPreview(safeOrder, 'customer')} className="rounded-full bg-black px-4 py-2 text-sm font-black text-white">Print Customer Bill</button>
              <button onClick={() => openPreview(safeOrder, 'kitchen')} className="rounded-full bg-stone-800 px-4 py-2 text-sm font-black text-white">Print Kitchen Copy</button>
              <button onClick={() => openPreview(safeOrder, 'both')} className="rounded-full bg-stone-600 px-4 py-2 text-sm font-black text-white">Print Both</button>
            </div>
          </div>
          {!hideWarnings && orderWarnings.length > 0 && (
            <div className="mt-3 rounded-[1.5rem] bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              <p className="font-black">Inventory warnings</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-amber-900">
                {orderWarnings.map((warning, index) => <li key={index}>{warning}</li>)}
              </ul>
            </div>
          )}
          <div className="mt-3 grid gap-2 text-sm font-semibold text-stone-700">
            {orderItems.map((line, index) => <OrderLineCard key={index} line={line} order={safeOrder} highlightDetails />)}
          </div>
        </article>
        );
      })}
      {(orders || []).length === 0 && <p className="rounded-[1.5rem] bg-white p-6 font-bold text-stone-500">No orders yet.</p>}
      {/* In-page receipt preview modal for admin */}
      {showPreview && previewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white p-4 rounded shadow max-h-[90vh] overflow-auto" style={{minWidth:320}}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <label className="text-sm">Width</label>
                {[280,300,320].map((w)=> (
                  <button key={w} onClick={()=>setPreviewWidth(w)} className={`px-2 py-1 rounded border ${previewWidth===w? 'bg-black text-white':'bg-white'}`}>
                    {w}
                  </button>
                ))}
                <label className="text-sm ml-3">Font</label>
                {[10,11,12].map((f)=> (
                  <button key={f} onClick={()=>setPreviewFontSize(f)} className={`px-2 py-1 rounded border ${previewFontSize===f? 'bg-black text-white':'bg-white'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { window.print(); }} className="rounded-full bg-black px-4 py-2 text-sm font-black text-white">Print</button>
                <button onClick={() => setShowPreview(false)} className="rounded-full border px-4 py-2 text-sm font-black">Close</button>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'center'}}>
              <PrintableReceipt order={previewOrder} copyType={previewCopy} receiptWidth={previewWidth} fontSize={previewFontSize} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CocAdmin({ cocRequests, onSaved }) {
  const [error, setError] = useState("");
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    let mounted = true;
    authService.me()
      .then((data) => {
        if (!mounted) return;
        setIsStaff(data.user?.role === "admin" || data.user?.role === "biller");
      })
      .catch(() => {
        if (!mounted) return;
        setIsStaff(false);
      });
    return () => (mounted = false);
  }, []);

  async function approve(id) {
    try {
      setError("");
      await orderService.patchCocRequest(id);
      onSaved();
    } catch (err) {
      setError(err.message || "Failed to approve request");
    }
  }

  return (
    <section className="space-y-3">
      {error && <div className="rounded-[1.5rem] bg-red-50 p-4 text-sm font-bold text-red-700">Error: {error}</div>}
      {(cocRequests || []).map((req) => {
        const safeRequest = req || {};
        const requestId = resolveCocRequestId(safeRequest);
        const requestItems = Array.isArray(safeRequest.items) ? safeRequest.items : [];
        const sourceLabel = getBillerOrderClassification(safeRequest).sourceBadge;

        return (
        <article key={requestId || safeRequest._id || safeRequest.id} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{safeRequest.customerName || "Customer"} • Table {safeRequest.tableNumber ?? safeRequest.table ?? "-"}</h2>
              <p className="text-sm font-bold text-stone-500">{safeRequest.phone || "-"} • {rupees(safeRequest.total || 0)} • {safeRequest.paymentMethod === 'cash' ? 'Cash on Counter' : 'Online'}</p>
            </div>
            {sourceLabel && (
              <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-black uppercase tracking-[0.04em] text-stone-700">
                {sourceLabel}
              </span>
            )}
          </div>
          <div className="mt-4 border-t border-slate-200/80 pt-4">
            <div className="grid gap-3 text-sm text-stone-700">
              {requestItems.map((line, index) => (
                <OrderLineCard key={index} line={line} order={safeRequest} />
              ))}
            </div>
          </div>
          <div className="mt-4 border-t border-slate-200/80 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Only staff can approve COC requests.</p>
              <div className="flex items-center gap-2">
                {isStaff ? (
                  <button onClick={() => approve(requestId)} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white">Approve & Create Order</button>
                  ) : (
                  <button onClick={() => { history.pushState(null, '', '/owner'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="rounded-full bg-white border px-4 py-2 text-sm font-black">Owner login to approve</button>
                )}
              </div>
            </div>
          </div>
        </article>
        );
      })}
      {(cocRequests || []).length === 0 && <p className="rounded-[1.5rem] bg-white p-6 font-bold text-stone-500">No COC requests.</p>}
    </section>
  );
}

function InventoryAdmin({ rawMaterials, recipes = [], onSaved, onInventoryChanged }) {
  const [inventoryItems, setInventoryItems] = useState([]);

  function normalizeServerInventoryItem(item) {
    if (!item || typeof item !== "object") return null;
    return {
      ...item,
      id: String(item.id ?? item._id ?? item.name ?? ""),
      name: String(item.name || "").trim(),
      quantity: Number(item.quantity ?? item.stock ?? 0) || 0,
      unit: String(item.unit || item.measurementUnit || "pcs").trim() || "pcs",
      minStock: Number(item.minStock ?? item.minimumStock ?? 0) || 0,
      purchasePrice: Number(item.purchasePrice ?? item.costPerUnit ?? item.price ?? 0) || 0,
      supplier: String(item.supplier || "").trim(),
      lastUpdated: item.lastUpdated || item.updatedAt || new Date().toISOString(),
      isDeleted: item.isDeleted === true,
      deletedAt: item.deletedAt || null
    };
  }

  function mergeInventoryItems(apiItems, localItems) {
    const normalizedApiItems = Array.isArray(apiItems)
      ? apiItems.map(normalizeServerInventoryItem).filter(Boolean).filter((item) => !isHiddenInventoryItem(item))
      : [];
    const normalizedLocalItems = Array.isArray(localItems)
      ? localItems.filter((item) => item && item?.isDeleted !== true && !isHiddenInventoryItem(item))
      : [];
    const seen = new Set();

    return [...normalizedApiItems, ...normalizedLocalItems].filter((item) => {
      if (!item || !item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }
  const [editingItem, setEditingItem] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", quantity: "", unit: "pcs", minStock: "", purchasePrice: "", supplier: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Load inventory items from localStorage on mount
  useEffect(() => {
    loadInventoryItems();
    
    function handleInventoryUpdated(event) {
      const latestItems = event?.detail ? normalizeLocalInventoryItems(event.detail) : loadLocalInventoryItems();
      setInventoryItems(latestItems);
    }

    function handleStorage(event) {
      if (event.key && event.key !== INVENTORY_ITEMS_KEY) return;
      setInventoryItems(loadLocalInventoryItems());
    }
    
    window.addEventListener("inventoryUpdated", handleInventoryUpdated);
    window.addEventListener("storage", handleStorage);
    
    return () => {
      window.removeEventListener("inventoryUpdated", handleInventoryUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function loadInventoryItems() {
    const saved = loadLocalInventoryItems();
    setInventoryItems(saved);
    if (onInventoryChanged) onInventoryChanged(saved);
  }

  function saveInventoryItems(updatedItems) {
    const normalized = saveLocalInventoryItems(updatedItems);
    setInventoryItems(normalized);
    if (onInventoryChanged) onInventoryChanged(normalized);
    return normalized;
  }

  function getStockStatus(quantity, minStock) {
    if (quantity <= 0) return "Out of Stock";
    if (quantity <= minStock) return "Low Stock";
    return "In Stock";
  }

  function validateForm(requirePurchasePrice = false) {
    if (!form.name.trim()) return "Item name is required.";
    if (!form.quantity || isNaN(Number(form.quantity))) return "Quantity must be a valid number.";
    if (!form.unit) return "Unit is required.";
    if (!form.minStock || isNaN(Number(form.minStock))) return "Minimum stock must be a valid number.";
    const purchasePriceValue = form.purchasePrice === "" ? NaN : Number(form.purchasePrice);
    if (requirePurchasePrice) {
      if (form.purchasePrice === "" || isNaN(purchasePriceValue) || purchasePriceValue <= 0) {
        return "Purchase Price is required.";
      }
    } else if (form.purchasePrice && isNaN(purchasePriceValue)) {
      return "Purchase price must be a valid number.";
    }
    return "";
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    
    const error = validateForm(!editingItem);
    if (error) {
      setMessage(error);
      setMessageType("error");
      return;
    }

    const purchasePriceValue = form.purchasePrice === "" ? null : Number(form.purchasePrice);
    let updatedItems;
    if (editingItem) {
      const editedPrice = purchasePriceValue === null ? editingItem.purchasePrice : purchasePriceValue;
      updatedItems = inventoryItems.map(item => 
        item.id === editingItem.id
          ? {
              ...item,
              name: form.name.trim(),
              quantity: Number(form.quantity),
              unit: form.unit,
              minStock: Number(form.minStock),
              purchasePrice: editedPrice === null || Number.isNaN(editedPrice) ? item.purchasePrice : editedPrice,
              supplier: form.supplier.trim(),
              lastUpdated: new Date().toISOString()
            }
          : item
      );
      setMessage("Inventory item updated successfully.");
    } else {
      const newItem = {
        id: Date.now().toString(),
        name: form.name.trim(),
        quantity: Number(form.quantity),
        unit: form.unit,
        minStock: Number(form.minStock),
        purchasePrice: purchasePriceValue,
        supplier: form.supplier.trim(),
        lastUpdated: new Date().toISOString()
      };
      updatedItems = [...inventoryItems, newItem];
      setMessage("Inventory item added successfully.");
    }

    setMessageType("success");
    saveInventoryItems(updatedItems);
    setForm({ id: "", name: "", quantity: "", unit: "pcs", minStock: "", purchasePrice: "", supplier: "" });
    setEditingItem(null);
    
    if (onSaved) onSaved();
  }

  function handleEdit(item) {
    setEditingItem(item);
    setForm({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      minStock: item.minStock,
      purchasePrice: item.purchasePrice || "",
      supplier: item.supplier || ""
    });
    setMessage("");
  }

  function handleDelete(item) {
    if (!item) return;
    setPendingDelete(item);
  }

  function confirmDeletion() {
    if (!pendingDelete) return;
    const deletedAt = new Date().toISOString();
    const updatedItems = inventoryItems.map((item) => (item.id === pendingDelete.id ? { ...item, isDeleted: true, deletedAt } : item));
    saveInventoryItems(updatedItems);
    setPendingDelete(null);
    setMessage("Inventory item deleted successfully.");
    setMessageType("success");
    if (onSaved) onSaved();
  }

  function cancelDeletion() {
    setPendingDelete(null);
  }

  function handleIncreaseStock(itemId, amount = 1) {
    const updatedItems = inventoryItems.map(item =>
      item.id === itemId
        ? { ...item, quantity: item.quantity + amount, lastUpdated: new Date().toISOString() }
        : item
    );
    saveInventoryItems(updatedItems);
  }

  function handleDecreaseStock(itemId, amount = 1) {
    const item = inventoryItems.find(i => i.id === itemId);
    if (item && item.quantity - amount >= 0) {
      const updatedItems = inventoryItems.map(i =>
        i.id === itemId
          ? { ...i, quantity: i.quantity - amount, lastUpdated: new Date().toISOString() }
          : i
      );
      saveInventoryItems(updatedItems);
    }
  }

  function handleCancel() {
    setEditingItem(null);
    setForm({ id: "", name: "", quantity: "", unit: "pcs", minStock: "", purchasePrice: "", supplier: "" });
    setMessage("");
  }

  const inventoryStoreItems = useMemo(() => Array.isArray(rawMaterials) ? rawMaterials.map(normalizeServerInventoryItem).filter(Boolean) : [], [rawMaterials]);
  const renderedInventory = useMemo(() => mergeInventoryItems(inventoryStoreItems, inventoryItems), [inventoryStoreItems, inventoryItems]);

  if (import.meta.env.DEV) {
    console.log("INVENTORY API COUNT", inventoryStoreItems.length);
    console.log("INVENTORY STORE COUNT", inventoryStoreItems.length);
  }

  const activeItems = renderedInventory.filter((item) => item?.isDeleted !== true);
  const filteredItems = activeItems.filter(item => {
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getStockStatus(item.quantity, item.minStock);
    let matchesFilter = true;
    if (filterStatus === "low") matchesFilter = status === "Low Stock";
    if (filterStatus === "out") matchesFilter = status === "Out of Stock";
    if (filterStatus === "in") matchesFilter = status === "In Stock";
    return matchesQuery && matchesFilter;
  });

  // Calculate summary
  const lowStockCount = activeItems.filter(item => getStockStatus(item.quantity, item.minStock) === "Low Stock").length;
  const outOfStockCount = activeItems.filter(item => getStockStatus(item.quantity, item.minStock) === "Out of Stock").length;
  const totalValue = activeItems.reduce((sum, item) => sum + (item.quantity * (item.purchasePrice || 0)), 0);

  if (import.meta.env.DEV) {
    console.log("INVENTORY FILTERED COUNT", filteredItems.length);
    console.log("INVENTORY RENDER COUNT", renderedInventory.length);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-5 lg:hidden">
        <form onSubmit={handleSubmit} className="w-full max-w-full overflow-hidden rounded-[1.5rem] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">{editingItem ? "Edit item" : "Add item"}</h2>
            {editingItem && <button type="button" onClick={handleCancel} className="rounded-full bg-stone-100 px-3 py-2 text-xs font-black">Cancel</button>}
          </div>
          <div className="space-y-3">
            <input required className="field w-full bg-stone-50" placeholder="Item name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <div className="grid w-full grid-cols-1 gap-3">
              <input required type="number" className="field w-full bg-stone-50" placeholder="Quantity" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
              <select required className="field w-full bg-stone-50" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}>
                <option value="">Select unit</option>
                <option value="kg">kg</option>
                <option value="gram">gram</option>
                <option value="liter">liter</option>
                <option value="ml">ml</option>
                <option value="pcs">pcs</option>
                <option value="packet">packet</option>
                <option value="bottle">bottle</option>
              </select>
            </div>
            <input required type="number" className="field w-full bg-stone-50" placeholder="Min stock level" value={form.minStock} onChange={(event) => setForm({ ...form, minStock: event.target.value })} />
            <input required={!editingItem} type="number" className="field w-full bg-stone-50" placeholder="Purchase price" value={form.purchasePrice} onChange={(event) => setForm({ ...form, purchasePrice: event.target.value })} />
            <input className="field w-full bg-stone-50" placeholder="Supplier (optional)" value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} />
            {message && (<p className={`text-sm font-bold ${messageType === "error" ? "text-red-700" : "text-emerald-700"}`}>{message}</p>)}
            <button disabled={!!validateForm(!editingItem)} className="mt-1 w-full rounded-full bg-black px-5 py-4 font-black text-white disabled:cursor-not-allowed disabled:bg-stone-400">{editingItem ? "Update item" : "Add item"}</button>
          </div>
        </form>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.5rem] bg-white p-4 shadow-sm"><p className="text-xs font-bold text-stone-500">Total Items</p><p className="mt-2 text-2xl font-black">{activeItems.length}</p></div>
          <div className="rounded-[1.5rem] bg-orange-50 p-4 shadow-sm"><p className="text-xs font-bold text-orange-600">Low Stock</p><p className="mt-2 text-2xl font-black text-orange-700">{lowStockCount}</p></div>
          <div className="rounded-[1.5rem] bg-red-50 p-4 shadow-sm"><p className="text-xs font-bold text-red-600">Out of Stock</p><p className="mt-2 text-2xl font-black text-red-700">{outOfStockCount}</p></div>
          <div className="rounded-[1.5rem] bg-emerald-50 p-4 shadow-sm"><p className="text-xs font-bold text-emerald-600">Total Value</p><p className="mt-2 text-2xl font-black text-emerald-700">{rupees(totalValue)}</p></div>
        </div>

        <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-black">Inventory items</h2>
            <button onClick={handleCancel} className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">+ New item</button>
          </div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <input placeholder="Search by item name..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="field w-full flex-1 bg-stone-50" />
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="field w-full bg-stone-50 sm:max-w-[220px]">
              <option value="all">All items</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
          <div className="space-y-3">
            {filteredItems.length > 0 ? filteredItems.map((item) => {
              const status = getStockStatus(item.quantity, item.minStock);
              const statusClass = status === "Out of Stock" ? "text-red-600" : status === "Low Stock" ? "text-orange-600" : "text-emerald-600";
              return (
                <article key={item.id} className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black">{item.name}</h3>
                      <p className="text-sm text-stone-600">{item.quantity} {item.unit} • {rupees(item.purchasePrice || 0)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass}`}>{status}</span>
                  </div>
                  <p className="mt-2 text-sm text-stone-500">Min stock: {item.minStock} {item.unit} • Supplier: {item.supplier || "-"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => handleDecreaseStock(item.id)} className="rounded-full bg-white px-3 py-2 text-xs font-black shadow-sm">-</button>
                    <button onClick={() => handleIncreaseStock(item.id)} className="rounded-full bg-white px-3 py-2 text-xs font-black shadow-sm">+</button>
                    <button onClick={() => handleEdit(item)} className="rounded-full bg-white px-3 py-2 text-xs font-black shadow-sm">Edit</button>
                    <button type="button" onClick={() => handleDelete(item)} className="rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 shadow-sm">Delete</button>
                  </div>
                </article>
              );
            }) : <p className="rounded-[1.25rem] border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">No inventory items found. Click “New item” to add one.</p>}
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-[1.5rem] bg-white p-4 shadow-sm"><p className="text-xs font-bold text-stone-500">Total Items</p><p className="mt-2 text-2xl font-black">{activeItems.length}</p></div>
          <div className="rounded-[1.5rem] bg-orange-50 p-4 shadow-sm"><p className="text-xs font-bold text-orange-600">Low Stock</p><p className="mt-2 text-2xl font-black text-orange-700">{lowStockCount}</p></div>
          <div className="rounded-[1.5rem] bg-red-50 p-4 shadow-sm"><p className="text-xs font-bold text-red-600">Out of Stock</p><p className="mt-2 text-2xl font-black text-red-700">{outOfStockCount}</p></div>
          <div className="rounded-[1.5rem] bg-emerald-50 p-4 shadow-sm"><p className="text-xs font-bold text-emerald-600">Total Value</p><p className="mt-2 text-2xl font-black text-emerald-700">{rupees(totalValue)}</p></div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 rounded-[1.5rem] bg-white p-3 shadow-sm sm:p-4 lg:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">Inventory items</h2><button onClick={handleCancel} className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">+ New item</button></div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row"><input placeholder="Search by item name..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="field w-full flex-1 bg-stone-50" /><select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="field w-full bg-stone-50 sm:max-w-[220px]"><option value="all">All items</option><option value="in">In Stock</option><option value="low">Low Stock</option><option value="out">Out of Stock</option></select></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[780px] table-fixed text-left text-sm lg:min-w-0"><thead><tr className="border-b text-[11px] uppercase tracking-wide text-stone-500"><th className="w-[30%] py-3 pr-3">Item Name</th><th className="w-[8%] whitespace-nowrap">Stock</th><th className="w-[8%] whitespace-nowrap pl-2 pr-3">Min Stock</th><th className="w-[9%] whitespace-nowrap px-3">Status</th><th className="w-[8%] whitespace-nowrap pl-4 pr-2">Price</th><th className="w-[10%] whitespace-nowrap">Supplier</th><th className="w-[12%] whitespace-nowrap">Last Updated</th><th className="w-[15%] text-right">Actions</th></tr></thead><tbody>{filteredItems.length > 0 ? filteredItems.map((item) => { const status = getStockStatus(item.quantity, item.minStock); const statusClass = status === "Out of Stock" ? "text-red-600" : status === "Low Stock" ? "text-orange-600" : "text-emerald-600"; return (<tr key={item.id} className="border-b last:border-0"><td className="py-3 pr-3 font-black align-top">{item.name}</td><td className="align-top text-sm text-stone-700">{item.quantity} {item.unit}</td><td className="align-top pl-2 pr-3 text-sm text-stone-700">{item.minStock} {item.unit}</td><td className="align-top px-3"><span className={`text-xs font-bold ${statusClass}`}>{status}</span></td><td className="align-top pl-4 pr-2 text-sm text-stone-700">{rupees(item.purchasePrice || 0)}</td><td className="align-top text-xs text-stone-500">{item.supplier || "-"}</td><td className="align-top text-xs text-stone-500">{new Date(item.lastUpdated).toLocaleDateString()}</td><td className="align-top text-right"><div className="flex gap-1 justify-end"><button onClick={() => handleDecreaseStock(item.id)} className="rounded-full p-2 hover:bg-stone-100" title="Decrease stock"><Minus size={14} /></button><button onClick={() => handleIncreaseStock(item.id)} className="rounded-full p-2 hover:bg-stone-100" title="Increase stock"><Plus size={14} /></button><button onClick={() => handleEdit(item)} className="rounded-full p-2 hover:bg-stone-100" title="Edit"><Pencil size={14} /></button><button type="button" onClick={(event) => { event.stopPropagation(); handleDelete(item); }} className="rounded-full p-2 hover:bg-red-50" title="Delete" aria-label={`Delete ${item.name}`}><Trash2 size={14} /></button></div></td></tr>); }) : <tr><td colSpan="8" className="py-6 text-center text-sm text-stone-500">No inventory items found. Click "New item" to add one.</td></tr>}</tbody></table></div>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-full overflow-hidden rounded-[1.5rem] bg-white p-5 shadow-sm h-fit">
            <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-black">{editingItem ? "Edit item" : "Add item"}</h2>{editingItem && <button type="button" onClick={handleCancel} className="rounded-full bg-stone-100 px-3 py-2 text-xs font-black">Cancel</button>}</div>
            <div className="space-y-3">
              <input required className="field w-full bg-stone-50" placeholder="Item name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2"><input required type="number" className="field w-full bg-stone-50" placeholder="Quantity" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /><select required className="field w-full bg-stone-50" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}><option value="">Select unit</option><option value="kg">kg</option><option value="gram">gram</option><option value="liter">liter</option><option value="ml">ml</option><option value="pcs">pcs</option><option value="packet">packet</option><option value="bottle">bottle</option></select></div>
              <input required type="number" className="field w-full bg-stone-50" placeholder="Min stock level" value={form.minStock} onChange={(event) => setForm({ ...form, minStock: event.target.value })} />
              <input required={!editingItem} type="number" className="field w-full bg-stone-50" placeholder="Purchase price" value={form.purchasePrice} onChange={(event) => setForm({ ...form, purchasePrice: event.target.value })} />
              <input className="field w-full bg-stone-50" placeholder="Supplier (optional)" value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} />
              {message && <p className={`text-sm font-bold ${messageType === "error" ? "text-red-700" : "text-emerald-700"}`}>{message}</p>}
              <button disabled={!!validateForm(!editingItem)} className="mt-1 w-full rounded-full bg-black px-5 py-4 font-black text-white disabled:cursor-not-allowed disabled:bg-stone-400">{editingItem ? "Update item" : "Add item"}</button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete ? `Delete ${pendingDelete.name || "item"}?` : "Delete this?"}
        message="Are you sure you want to delete this? This can be restored from Recently Deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeletion}
        onCancel={cancelDeletion}
      />
    </section>
  );
}

function AddStockPage({ rawMaterials, onSaved }) {
  const [localItems, setLocalItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Load local inventory items and recent transactions
  useEffect(() => {
    const saved = loadLocalInventoryItems();
    setLocalItems(saved);
    
    // Load transactions
    stockTransactionsStore.loadTransactions();
    setRecentTransactions(stockTransactionsStore.getRecentTransactions(20));
    
    function handleInventoryUpdated(event) {
      const items = event?.detail ? normalizeLocalInventoryItems(event.detail) : loadLocalInventoryItems();
      setLocalItems(items);
    }
    
    // Subscribe to transaction updates
    const unsubscribe = stockTransactionsStore.subscribe((transactions) => {
      setRecentTransactions(transactions.slice(0, 20));
    });
    
    window.addEventListener("inventoryUpdated", handleInventoryUpdated);
    return () => {
      window.removeEventListener("inventoryUpdated", handleInventoryUpdated);
      unsubscribe();
    };
  }, []);

  // Combine backend and local inventory
  const activeLocalItems = localItems.filter((item) => item?.isDeleted !== true);
  const allItems = [...(rawMaterials || []), ...activeLocalItems];

  useEffect(() => {
    if (!allItems.find((item) => item.id === selectedId)) setSelectedId(allItems[0]?.id || "");
  }, [allItems, selectedId]);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    
    if (!selectedId) {
      setMessage("Please select an inventory item.");
      setMessageType("error");
      return;
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setMessage("Quantity must be a positive number.");
      setMessageType("error");
      return;
    }

    try {
      const item = activeLocalItems.find(i => i.id === selectedId);
      if (item) {
        // Update local inventory item
        const updatedItems = localItems.map(i =>
          i.id === selectedId
            ? { ...i, quantity: i.quantity + Number(quantity), lastUpdated: new Date().toISOString() }
            : i
        );
        setLocalItems(saveLocalInventoryItems(updatedItems));
      } else {
        // Try backend API for server-managed materials
        await (await import("./services/inventoryService")).purchaseInventory(selectedId, { quantity: Number(quantity), note });
      }
      
      // Create stock transaction record
      const selectedItem = allItems.find(i => i.id === selectedId);
      if (selectedItem) {
        stockTransactionsStore.addTransaction(
          selectedItem.name,
          Number(quantity),
          selectedItem.unit || "pcs",
          note
        );
        // Dispatch event for immediate UI update
        window.dispatchEvent(new CustomEvent("stockTransactionAdded"));
      }
      
      setQuantity("");
      setNote("");
      setMessage("Stock updated successfully.");
      setMessageType("success");
      if (onSaved) onSaved();
    } catch (err) {
      setMessage(err.message);
      setMessageType("error");
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      {/* Left Panel: Recent Stock Transactions */}
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-black">Recent Stock Transactions</h2>
          <p className="mt-1 text-sm text-stone-600">Latest inventory stock additions</p>
        </div>
        
        <div className="mt-5 space-y-3">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => {
              const date = new Date(transaction.timestamp);
              const formattedDate = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
              const formattedTime = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
              
              return (
                <div key={transaction.id} className="rounded-2xl bg-stone-50 p-4 border border-stone-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-black text-stone-900">{transaction.itemName}</p>
                      <p className="mt-2 text-sm font-bold text-emerald-700">+{transaction.quantityAdded} {transaction.unit}</p>
                      <p className="mt-1 text-xs text-stone-500">{formattedDate} • {formattedTime}</p>
                      {transaction.note && (
                        <p className="mt-2 text-xs text-stone-600 italic">{transaction.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl bg-stone-50 p-4 border border-stone-200 text-center">
              <p className="text-sm font-bold text-stone-500">No stock transactions recorded yet.</p>
              <p className="mt-1 text-xs text-stone-400">Transactions will appear here when you add stock.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Panel: Quick Add Stock Form */}
      {allItems.length === 0 ? (
        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <div className="rounded-3xl bg-stone-50 p-4 text-center">
            <p className="text-sm font-bold text-stone-600">No inventory items found. Create items in the Inventory tab first.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-[1.5rem] bg-white p-5 shadow-sm h-fit">
          <h3 className="font-black mb-3">Quick add stock</h3>
          <div className="space-y-4">
            <select required className="field bg-stone-50" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              <option value="">Select item...</option>
              {allItems.map((material) => {
                const isLocal = localItems.find(i => i.id === material.id);
                const qty = isLocal ? material.quantity : material.stock;
                const unit = isLocal ? material.unit : material.unit;
                return (
                  <option key={material.id} value={material.id}>
                    {material.name} ({qty}{unit} available)
                  </option>
                );
              })}
            </select>
            <input required className="field bg-stone-50" type="number" min="0" step="any" placeholder="Quantity to add" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            <textarea className="field min-h-20 resize-none bg-stone-50" placeholder="Note (optional)" value={note} onChange={(event) => setNote(event.target.value)} />
            {message && (
              <p className={`text-sm font-bold ${messageType === "error" ? "text-red-700" : "text-emerald-700"}`}>
                {message}
              </p>
            )}
            <button className="w-full rounded-full bg-black px-5 py-4 font-black text-white">Add to stock</button>
          </div>
        </form>
      )}
    </section>
  );
}

function RecipeMapping({ items, rawMaterials, recipes, onSaved }) {
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || "");
  const [ingredients, setIngredients] = useState([{ rawMaterialId: "", amount: "", unit: "g", serveType: "" }]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!selectedItemId && items[0]) setSelectedItemId(items[0].id);
  }, [items, selectedItemId]);

  useEffect(() => {
    const recipe = recipes.find((recipeItem) => recipeItem.itemId === selectedItemId);
    if (recipe) {
      setIngredients(recipe.ingredients.length ? recipe.ingredients.map((ingat) => ({ ...ingat })) : [{ rawMaterialId: "", amount: "", unit: "g", serveType: "" }]);
    } else {
      setIngredients([{ rawMaterialId: "", amount: "", unit: "g", serveType: "" }]);
    }
  }, [selectedItemId, recipes]);

  function updateIngredient(index, key, value) {
    setIngredients((current) => current.map((ingredient, i) => (i === index ? { ...ingredient, [key]: value } : ingredient)));
  }

  function addIngredient() {
    setIngredients((current) => [...current, { rawMaterialId: "", amount: "", unit: "g", serveType: "" }]);
  }

  function removeIngredient(index) {
    setIngredients((current) => current.filter((_, i) => i !== index));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      const recipeId = selectedItemId;
      await menuService.patchRecipe(recipeId, { id: recipeId, itemId: selectedItemId, ingredients });
      setMessage("Recipe saved.");
      onSaved();
    } catch (err) {
      if (err.message.includes("not found")) {
        try {
          await menuService.createRecipe({ id: selectedItemId, itemId: selectedItemId, ingredients });
          setMessage("Recipe saved.");
          onSaved();
        } catch (postError) {
          setMessage(postError.message);
        }
      } else {
        setMessage(err.message);
      }
    }
  }

  const selectedItem = items.find((item) => item.id === selectedItemId);

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Recipe mapping</h2>
            <p className="mt-1 text-sm text-stone-600">Link menu items to raw material usage for automatic stock adjustment.</p>
          </div>
          <button type="button" onClick={addIngredient} className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">Add ingredient</button>
        </div>
        <div className="space-y-4">
          <select className="field bg-stone-50" value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)}>
            {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="grid gap-3 rounded-3xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-[1.5fr_0.9fr_0.9fr_0.9fr_auto]">
              <select value={ingredient.rawMaterialId} onChange={(event) => updateIngredient(index, "rawMaterialId", event.target.value)} className="field bg-white">
                <option value="">Select raw material</option>
                {rawMaterials.map((material) => (
                  <option key={material.id} value={material.id}>{material.name}</option>
                ))}
              </select>
              <input className="field bg-white" placeholder="Amount" value={ingredient.amount} onChange={(event) => updateIngredient(index, "amount", event.target.value)} />
              <select className="field bg-white" value={ingredient.unit} onChange={(event) => updateIngredient(index, "unit", event.target.value)}>
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="pcs">pcs</option>
              </select>
              <input className="field bg-white" placeholder="Serve type (optional)" value={ingredient.serveType} onChange={(event) => updateIngredient(index, "serveType", event.target.value)} />
              <button type="button" onClick={() => removeIngredient(index)} className="rounded-full bg-white p-2 text-stone-600 hover:bg-stone-100"><Trash2 size={18} /></button>
            </div>
          ))}
          {message && <p className="text-sm font-bold text-stone-600">{message}</p>}
          <button className="w-full rounded-full bg-black px-5 py-4 font-black text-white">Save recipe</button>
        </div>
      </div>
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Current recipe for {selectedItem?.name || "selected item"}</h2>
        <div className="mt-4 space-y-3 text-sm text-stone-700">
          {(ingredients.length === 0) ? <p>No ingredients configured.</p> : ingredients.map((ingredient, index) => {
            const material = rawMaterials.find((mat) =>
              mat.id === ingredient.rawMaterialId ||
              mat.id === ingredient.inventoryId ||
              mat.id === ingredient.ingredientId ||
              mat.name === ingredient.rawMaterialId ||
              mat.name === ingredient.inventoryId ||
              mat.name === ingredient.ingredientId ||
              mat.name === ingredient.name
            );
            return (
              <div key={index} className="rounded-3xl bg-stone-50 p-3">
                <p className="font-black">{material?.name || ingredient.name || ingredient.rawMaterialId || ingredient.inventoryId || ingredient.ingredientId || "Unknown raw material"}</p>
                <p>{ingredient.amount} {ingredient.unit} {ingredient.serveType ? `• ${ingredient.serveType}` : ""}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LowStockAlerts({ rawMaterials }) {
  const [localItems, setLocalItems] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("inventoryItems") || "[]");
    setLocalItems(saved);
    
    function handleInventoryUpdated(event) {
      const items = event.detail || JSON.parse(localStorage.getItem("inventoryItems") || "[]");
      setLocalItems(items);
    }
    
    window.addEventListener("inventoryUpdated", handleInventoryUpdated);
    return () => window.removeEventListener("inventoryUpdated", handleInventoryUpdated);
  }, []);

  const allMaterials = [...(rawMaterials || []), ...localItems].filter((material) => !isHiddenInventoryItem(material));
  const lowMaterials = allMaterials.filter((material) => {
    const qty = material.stock !== undefined ? material.stock : material.quantity || 0;
    const minStock = material.minStock || 0;
    return Number(qty) <= Number(minStock);
  });

  return (
    <section className="space-y-5">
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Low stock & out of stock alerts</h2>
        <p className="mt-2 text-sm text-stone-600">These items need replenishment immediately.</p>
      </div>
      {lowMaterials.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {lowMaterials.map((material) => {
            const qty = material.stock !== undefined ? material.stock : material.quantity || 0;
            const isOutOfStock = qty <= 0;
            return (
              <div key={material.id} className={`rounded-[1.5rem] p-5 shadow-sm ${isOutOfStock ? "bg-red-50" : "bg-orange-50"}`}>
                <p className={`text-sm font-bold ${isOutOfStock ? "text-red-600" : "text-orange-600"}`}>{isOutOfStock ? "OUT OF STOCK" : "LOW STOCK"}</p>
                <h3 className="mt-2 text-xl font-black">{material.name}</h3>
                <p className={`mt-2 text-sm ${isOutOfStock ? "text-red-700" : "text-orange-700"}`}>
                  Stock: {qty}{material.unit || material.unit} / Min: {material.minStock || 0}{material.unit || material.unit}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-[1.5rem] bg-white p-5 text-sm font-bold text-stone-500">All inventory levels are healthy. ✓</p>
      )}
    </section>
  );
}

function ReportsPage({ reports, items, orders = [], rawMaterials = [], recipes = [] }) {
  const savedReports = reports || {};
  const savedItems = Array.isArray(items) ? items : [];
  const savedOrders = Array.isArray(orders) ? orders : [];

  const completedReport = useMemo(() => {
    const itemSales = {};
    let sales = 0;
    const completed = savedOrders.filter((o) => isCompletedSale(o));
    completed.forEach(order => {
      if (order.total) sales += Number(order.total);
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          const itemId = item.itemId || item.id || item.productId || item.menuItemId || item.name;
          if (!itemId) return;
          if (!itemSales[itemId]) {
            itemSales[itemId] = 0;
          }
          itemSales[itemId] += Number(item.quantity || 1);
        });
      }
    });
    return {
      topItems: Object.entries(itemSales)
        .map(([itemId, quantity]) => ({ itemId, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5),
      totalSales: sales,
      totalOrders: completed.length
    };
  }, [savedOrders]);

  const topItems = completedReport.topItems;
  const totalSales = completedReport.totalSales;
  const totalOrders = completedReport.totalOrders;
  
  const enrichedTopItems = topItems.map((record) => ({ ...record, name: savedItems.find((item) => item.id === record.itemId)?.name || record.itemId }));
  const { totalSales: todaySales, inventoryCostUsed: todayInventoryCostUsed, totalProfit } = calculateTodayTotalProfit(savedOrders, rawMaterials, recipes);

  return (
    <section className="space-y-5">
      <div className="mt-5 grid gap-5 lg:mt-0 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Inventory & sales reports</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-stone-50 p-5">
              <p className="text-sm font-semibold text-stone-500">Total sales</p>
              <p className="mt-3 text-3xl font-black">{rupees(totalSales || 0)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-stone-50 p-5">
              <p className="text-sm font-semibold text-stone-500">Total Profit</p>
              <p className={`mt-3 text-3xl font-black ${totalProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>{rupees(totalProfit || 0)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-stone-50 p-5">
              <p className="text-sm font-semibold text-stone-500">Total orders</p>
              <p className="mt-3 text-3xl font-black">{totalOrders || 0}</p>
            </div>
            <div className="rounded-[1.5rem] bg-stone-50 p-5">
              <p className="text-sm font-semibold text-stone-500">Inventory value</p>
              <p className="mt-3 text-3xl font-black">{rupees(savedReports.inventoryValue || 0)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-stone-50 p-5">
              <p className="text-sm font-semibold text-stone-500">Low stock count</p>
              <p className="mt-3 text-3xl font-black">{savedReports.lowStockCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black">Top sold items</h3>
          <div className="mt-4 space-y-3">
            {enrichedTopItems.length > 0 ? enrichedTopItems.map((record) => (
              <div key={record.itemId} className="rounded-3xl bg-stone-50 p-4">
                <p className="font-black">{record.name}</p>
                <p className="text-sm text-stone-600">Qty sold: {record.quantity}</p>
              </div>
            )) : <p className="text-sm text-stone-500">No order data yet.</p>}
          </div>
        </div>
      </div>
      <SalesAnalytics orders={orders} />
    </section>
  );
}

function SalesAnalytics({ orders = [] }) {
  const [filterType, setFilterType] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [activeCustomRange, setActiveCustomRange] = useState({ start: "", end: "" });
  const [customError, setCustomError] = useState("");

  const savedOrders = Array.isArray(orders) ? orders : [];

  function getFilterRange() {
    const today = startOfDay(new Date());
    const filterEnd = endOfDay(new Date());

    if (filterType === "today") {
      return { start: today, end: filterEnd };
    }
    if (filterType === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: endOfDay(yesterday) };
    }
    if (filterType === "week") {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start, end: filterEnd };
    }
    if (filterType === "month") {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start, end: filterEnd };
    }
    if (filterType === "three-months") {
      const start = new Date(today);
      start.setDate(start.getDate() - 89);
      return { start, end: filterEnd };
    }
    if (filterType === "custom") {
      if (activeCustomRange.start && activeCustomRange.end) {
        return { start: startOfDay(activeCustomRange.start), end: endOfDay(activeCustomRange.end) };
      }
      return null;
    }
    return { start: today, end: filterEnd };
  }

  const { salesByDate, totalSales, totalOrders, dates, maxSales, dateRangeLabel } = useMemo(() => {
    const range = getFilterRange();
    const salesByDate = {};
    let totalSales = 0;

    if (!range) {
      return { salesByDate, totalSales: 0, totalOrders: 0, dates: [], maxSales: 0, dateRangeLabel: "" };
    }

    const reportOrders = Array.isArray(savedOrders) ? savedOrders : [];

    const salesAnalysisOrders = reportOrders.map(normalizeOrder);

    const filteredOrders = Array.isArray(salesAnalysisOrders) ? salesAnalysisOrders.filter((order) => {
      const orderDate = getOrderDate(order);
      return orderDate !== null && isCompletedSale(order) && orderDate >= range.start && orderDate <= range.end;
    }) : [];

    filteredOrders.forEach((order) => {
      const orderDate = getOrderDate(order);
      if (!orderDate) return;
      const dateStr = orderDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = { sales: 0, orders: 0, dateObj: new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()) };
      }
      salesByDate[dateStr].sales += Number(order?.total ?? order?.totalAmount ?? order?.grandTotal ?? 0);
      salesByDate[dateStr].orders += 1;
      totalSales += Number(order?.total ?? order?.totalAmount ?? order?.grandTotal ?? 0);
    });

    const dates = Object.keys(salesByDate).sort((a, b) => salesByDate[a].dateObj - salesByDate[b].dateObj);
    const maxSales = dates.length > 0 ? Math.max(...dates.map((d) => salesByDate[d].sales)) : 0;
    const totalOrders = Array.isArray(filteredOrders) ? filteredOrders.length : 0;
    const dateRangeLabel = `${range.start.toLocaleDateString("en-IN")} – ${range.end.toLocaleDateString("en-IN")}`;

    return { salesByDate, totalSales, totalOrders, dates, maxSales, dateRangeLabel };
  }, [orders, filterType, activeCustomRange]);

  const filterButtons = [
    { key: "today", label: "Today Sales" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "One Week" },
    { key: "month", label: "Last Month" },
    { key: "three-months", label: "Last 3 Months" },
    { key: "custom", label: "Custom Date" }
  ];

  function applyCustomRange() {
    setCustomError("");
    if (!customStartDate || !customEndDate) {
      setCustomError("Please select both start and end dates.");
      return;
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      setCustomError("Start date cannot be after end date.");
      return;
    }
    setActiveCustomRange({ start: customStartDate, end: customEndDate });
  }

  function formatLabel(dateString) {
    return new Date(dateString).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  }

  return (
    <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">Sales Analysis</h2>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scroll-smooth md:flex-wrap md:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => {
              setFilterType(btn.key);
              if (btn.key !== "custom") {
                setCustomError("");
              }
            }}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-black transition ${
              filterType === btn.key ? "bg-black text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {filterType === "custom" && (
        <div className="mt-4 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-stone-600 mb-1">From Date</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-stone-600 mb-1">To Date</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <button
            onClick={applyCustomRange}
            className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-stone-800"
          >
            Apply
          </button>
          {customError && <p className="w-full text-sm text-rose-600">{customError}</p>}
        </div>
      )}

      <div className="mt-6 rounded-[1.5rem] bg-stone-50 p-4">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-stone-600">Total Sales</p>
            <p className="mt-2 text-2xl font-black text-black">{rupees(totalSales)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-600">Total Orders</p>
            <p className="mt-2 text-2xl font-black text-black">{totalOrders}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-600">Avg Order Value</p>
            <p className="mt-2 text-2xl font-black text-black">{totalOrders > 0 ? rupees(totalSales / totalOrders) : "₹0"}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-stone-500">
          <span>
            {filterType === "custom"
              ? `Custom range: ${activeCustomRange.start || "-"} to ${activeCustomRange.end || "-"}`
              : filterType === "three-months"
              ? "Watching last 3 months"
              : `Watching ${filterType} sales`}
          </span>
          {dates.length > 0 && <span>{dateRangeLabel}</span>}
        </div>

        {dates.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <div className="relative h-[340px] min-w-full rounded-[1.5rem] bg-white p-4 shadow-sm">
              <div className="absolute left-4 top-4 right-4">
                <div className="flex justify-between text-[11px] text-stone-400">
                  <span>{rupees(maxSales)}</span>
                  <span>{rupees(Math.round(maxSales / 2))}</span>
                  <span>₹0</span>
                </div>
              </div>
              <div className="absolute inset-x-4 top-12 bottom-14 border-t border-stone-200" />
              <div className="absolute inset-x-4 bottom-14 top-16 flex items-end gap-3 overflow-x-auto px-1">
                {dates.map((date) => {
                  const sales = salesByDate[date].sales;
                  const barHeightPercent = maxSales > 0 ? (sales / maxSales) * 100 : 0;
                  return (
                    <div key={date} className="flex flex-col items-center justify-end" style={{ minWidth: "52px" }}>
                      <div
                        className="w-full rounded-t-3xl bg-gradient-to-t from-slate-900 to-stone-700 hover:opacity-90"
                        style={{ height: `${Math.max(barHeightPercent, 8)}%`, minHeight: "18px" }}
                        title={`${date}\nSales: ${rupees(sales)}\nOrders: ${salesByDate[date].orders}`}
                      />
                      <p className="mt-3 text-center text-[11px] font-semibold text-stone-700">{formatLabel(date)}</p>
                      <p className="text-[10px] text-stone-500">{rupees(sales)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-lg text-stone-400">📊 No sales data</p>
            <p className="text-sm text-stone-500 mt-1">for selected period</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TotalProfitPage({ orders = [], rawMaterials = [], recipes = [] }) {
  const savedOrders = Array.isArray(orders) ? orders : [];
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [customError, setCustomError] = useState("");

  const filters = [
    { key: "today", label: "Today" },
    { key: "lastWeek", label: "Last Week" },
    { key: "lastMonth", label: "Last Month" },
    { key: "last3Months", label: "Last 3 Months" },
    { key: "last6Months", label: "Last 6 Months" },
    { key: "custom", label: "Custom Date" }
  ];

  function getActiveRange() {
    const today = new Date();
    const end = endOfDay(today);
    if (selectedFilter === "today") {
      return { start: startOfDay(today), end, label: "Today" };
    }
    if (selectedFilter === "lastWeek") {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start: startOfDay(start), end, label: "Last 7 days" };
    }
    if (selectedFilter === "lastMonth") {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start: startOfDay(start), end, label: "Last 30 days" };
    }
    if (selectedFilter === "last3Months") {
      const start = new Date(today);
      start.setDate(start.getDate() - 89);
      return { start: startOfDay(start), end, label: "Last 90 days" };
    }
    if (selectedFilter === "last6Months") {
      const start = new Date(today);
      start.setDate(start.getDate() - 179);
      return { start: startOfDay(start), end, label: "Last 180 days" };
    }
    if (selectedFilter === "custom") {
      if (!customStartDate && !customEndDate) {
        return null;
      }

      const start = customStartDate ? new Date(customStartDate) : null;
      const endDate = customEndDate ? new Date(customEndDate) : null;

      if ((start && Number.isNaN(start.getTime())) || (endDate && Number.isNaN(endDate.getTime()))) {
        return null;
      }

      const effectiveStart = start || endDate;
      const effectiveEnd = endDate || start;
      if (!effectiveStart || !effectiveEnd || effectiveEnd < effectiveStart) {
        return null;
      }

      return {
        start: startOfDay(effectiveStart),
        end: endOfDay(effectiveEnd),
        label: `${effectiveStart.toISOString().slice(0, 10)} to ${effectiveEnd.toISOString().slice(0, 10)}`
      };
    }

    return null;
  }

  function calculateProfitForRange(ordersToCalculate, range) {
    if (!range || !range.start || !range.end) {
      return { totalSales: 0, inventoryCostUsed: 0, totalProfit: 0 };
    }

    const filteredOrders = Array.isArray(ordersToCalculate)
      ? ordersToCalculate.filter((order) => {
          const orderDate = getOrderDate(order);
          return orderDate !== null && orderDate >= range.start && orderDate <= range.end && isCompletedSale(order);
        })
      : [];

    const totalSales = filteredOrders.reduce((sum, order) => sum + Number(order?.total ?? order?.totalAmount ?? order?.grandTotal ?? 0), 0);

    let inventoryCostUsed = 0;
    filteredOrders.forEach((order) => {
      if (!Array.isArray(order.items)) return;
      order.items.forEach((line) => {
        const qty = Number(line.quantity ?? line.qty ?? 1) || 0;
        const itemId = line.itemId || line.id || line.productId || line.menuItemId || "";
        const recipe = Array.isArray(recipes) ? recipes.find((r) => r.itemId === itemId || r.id === itemId) : null;
        if (!recipe || !Array.isArray(recipe.ingredients)) return;
        let costPerMenuItem = 0;
        recipe.ingredients.forEach((ingredient) => {
          const raw = Array.isArray(rawMaterials)
            ? rawMaterials.find((material) =>
                material.id === ingredient.rawMaterialId ||
                material.id === ingredient.inventoryId ||
                material.id === ingredient.ingredientId ||
                material.name === ingredient.rawMaterialId ||
                material.name === ingredient.inventoryId ||
                material.name === ingredient.ingredientId ||
                material.name === ingredient.name
              )
            : null;
          const unitCost = Number(raw?.costPerUnit ?? raw?.purchasePrice ?? raw?.purchase_price ?? raw?.unitCost ?? raw?.price ?? raw?.unitPrice ?? 0) || 0;
          const amount = Number(ingredient.amount ?? 0) || 0;
          costPerMenuItem += amount * unitCost;
        });
        inventoryCostUsed += costPerMenuItem * qty;
      });
    });

    return {
      totalSales,
      inventoryCostUsed,
      totalProfit: totalSales - inventoryCostUsed
    };
  }

  const activeRange = getActiveRange();
  const { totalSales, inventoryCostUsed, totalProfit } = useMemo(
    () => calculateProfitForRange(savedOrders, activeRange),
    [savedOrders, rawMaterials, recipes, activeRange?.start?.toISOString(), activeRange?.end?.toISOString()]
  );

  function handleFilterSelect(filterKey) {
    setSelectedFilter(filterKey);
    setCustomError("");
  }

  function applyCustomRange() {
    if (!customStartDate && !customEndDate) {
      setCustomError("Please select a start or end date.");
      return;
    }

    const start = customStartDate ? new Date(customStartDate) : null;
    const endDate = customEndDate ? new Date(customEndDate) : null;

    if ((start && Number.isNaN(start.getTime())) || (endDate && Number.isNaN(endDate.getTime()))) {
      setCustomError("Please select valid dates.");
      return;
    }

    const effectiveStart = start || endDate;
    const effectiveEnd = endDate || start;
    if (!effectiveStart || !effectiveEnd) {
      setCustomError("Please select a valid date range.");
      return;
    }

    if (effectiveEnd < effectiveStart) {
      setCustomError("Start date cannot be after end date.");
      return;
    }

    setCustomError("");
  }

  const selectedLabel = activeRange?.label || (selectedFilter === "custom" ? "Custom date" : "Date Range");

  return (
    <section className="space-y-5">
      <div className="rounded-[1.5rem] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">{selectedLabel} Profit</h2>
            <p className="mt-2 text-sm font-semibold text-stone-600">
              Calculated from completed QR/COC orders using recipe-based inventory cost.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scroll-smooth md:flex-wrap md:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((button) => (
            <button
              key={button.key}
              type="button"
              onClick={() => handleFilterSelect(button.key)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-3 text-sm font-black ${selectedFilter === button.key ? "bg-black text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}
            >
              {button.label}
            </button>
          ))}
        </div>

        {selectedFilter === "custom" && (
          <div className="mt-4 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-stone-600 mb-1">From Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(event) => setCustomStartDate(event.target.value)}
                className="px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-stone-600 mb-1">To Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(event) => setCustomEndDate(event.target.value)}
                className="px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <button
              type="button"
              onClick={applyCustomRange}
              className="rounded-full bg-black px-5 py-3 text-sm font-black text-white hover:bg-stone-800"
            >
              Apply
            </button>
            {customError && <p className="w-full text-sm text-rose-600">{customError}</p>}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.5rem] bg-stone-50 p-6">
            <p className="text-sm font-semibold text-stone-500">Total Sales</p>
            <p className="mt-4 text-4xl font-black text-stone-900">{rupees(totalSales || 0)}</p>
          </div>

          <div className="rounded-[1.5rem] bg-orange-50 p-6">
            <p className="text-sm font-semibold text-orange-600">Inventory Cost Used</p>
            <p className="mt-4 text-4xl font-black text-orange-700">{rupees(inventoryCostUsed || 0)}</p>
          </div>

          <div className={`rounded-[1.5rem] p-6 shadow-sm ${totalProfit >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
            <p className={`text-sm font-semibold ${totalProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>Total Profit</p>
            <p className={`mt-4 text-4xl font-black ${totalProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{rupees(totalProfit || 0)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-stone-50 p-5">
          <p className="text-sm font-bold text-stone-700">Formula</p>
          <p className="mt-3 font-mono text-sm text-stone-600">
            <span className="font-bold text-stone-900">Profit</span> = <span className="font-bold text-stone-900">Total Sales</span> - <span className="font-bold text-stone-900">Inventory Cost Used</span>
          </p>
          <p className="mt-2 font-mono text-sm text-stone-600">
            {rupees(totalSales || 0)} - {rupees(inventoryCostUsed || 0)} = <span className={`font-bold ${totalProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{rupees(totalProfit || 0)}</span>
          </p>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-blue-50 p-5">
          <p className="text-sm font-bold text-blue-700">ℹ️ How Profit is Calculated</p>
          <ul className="mt-3 space-y-2 text-sm text-blue-900">
            <li>✓ Includes completed QR (Online Payment) and COC (Cash-On-Counter) orders in the selected date range</li>
            <li>✓ Inventory cost is calculated using recipe mappings (how much raw material each item uses)</li>
            <li>✓ Raw material costs are based on their unit cost stored in inventory</li>
            <li>✓ Missing recipe mappings are treated as 0 cost (not included)</li>
            <li>✗ Cancelled, payment-rejected, or unpaid orders are excluded</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function OrderHistory({ orders }) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const normalizedSearch = search.trim().toLowerCase();

  // Helper: Check if date is today
  function isToday(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  }

  function getOrderHistoryDate(order) {
    const value = order?.createdAt || order?.orderDate || order?.date || order?.updatedAt;
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function isCustomDateMatch(order) {
    const orderDate = getOrderHistoryDate(order);
    if (!orderDate) return false;
    const start = customStartDate ? startOfDay(customStartDate) : null;
    const end = customEndDate ? endOfDay(customEndDate) : null;
    if (start && orderDate < start) return false;
    if (end && orderDate > end) return false;
    return Boolean(start || end);
  }

  // Filter map: key is filter name, value is predicate function
  const FILTER_MAP = {
    all: () => true,
    completed: (order) => {
      const status = normalizeStatus(order.status);
      return status === "completed";
    },
    today: (order) => isToday(order.createdAt),
    pending: (order) => {
      const status = normalizeStatus(order.status);
      return status === "pending";
    },
    cancelled: (order) => {
      const status = normalizeStatus(order.status);
      return status === "cancelled";
    },
    paymentRejected: (order) => {
      const status = normalizeStatus(order.status);
      const paymentStatus = normalizeStatus(order.paymentStatus);
      return ["payment rejected", "payment issue", "rejected"].includes(status) || ["payment rejected", "payment issue", "rejected"].includes(paymentStatus);
    },
    customDate: isCustomDateMatch
  };
  const quickFilters = ["all", "pending", "cancelled", "paymentRejected", "completed"];

  const visibleOrders = useMemo(() => {
    let allOrders = orders || [];

    // Apply filter
    const filterFn = FILTER_MAP[activeFilter];
    if (filterFn) {
      allOrders = allOrders.filter(filterFn);
    }

    // Apply search
    if (!normalizedSearch) return allOrders;

    return allOrders.filter((order) => {
      const orderId = String(order.orderId || order.id || "").toLowerCase();
      const customerName = String(order.customerName || order.name || "").toLowerCase();
      const phone = String(order.phone || order.customerPhone || "").toLowerCase();
      const table = String(order.tableNumber ?? order.tableNo ?? order.table ?? "").toLowerCase();
      const orderType = String(order.orderType || order.type || "").toLowerCase();
      const itemMatch = (order.items || []).some((line) => {
        const itemName = String(line.name || line.itemName || line.productName || "").toLowerCase();
        return itemName.includes(normalizedSearch);
      });

      return (
        orderId.includes(normalizedSearch) ||
        customerName.includes(normalizedSearch) ||
        phone.includes(normalizedSearch) ||
        table.includes(normalizedSearch) ||
        orderType.includes(normalizedSearch) ||
        itemMatch
      );
    });
  }, [orders, normalizedSearch, activeFilter, customStartDate, customEndDate]);

  return (
    <section className="space-y-4">
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Order history</h2>
              <p className="mt-2 text-sm text-stone-600">Review completed and pending order records.</p>
            </div>
            <div className="hidden rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-700 sm:block">
              Total Orders: {visibleOrders.length}
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-full bg-stone-100 px-4 py-3">
            <Search size={18} className="text-stone-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Order ID, customer, phone, table, item..."
              className="w-full bg-transparent text-sm font-bold outline-none"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1 scroll-smooth sm:w-auto sm:flex-wrap sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {quickFilters.map((filterKey) => {
              const filterLabel = filterKey === "all" ? "All"
                : filterKey === "completed" ? "Completed"
                : filterKey === "today" ? "Today"
                : filterKey === "pending" ? "Pending"
                : filterKey === "cancelled" ? "Cancelled"
                : filterKey === "paymentRejected" ? "Payment Rejected"
                : filterKey;
              return (
                <button
                  key={filterKey}
                  onClick={() => setActiveFilter(filterKey)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-black transition-colors ${
                    activeFilter === filterKey
                      ? "bg-black text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {filterLabel}
                </button>
              );
            })}
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex w-full flex-nowrap items-center justify-between gap-1 sm:w-auto sm:flex-wrap sm:justify-end sm:gap-2">
                <button
                  onClick={() => setActiveFilter("today")}
                  className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-black transition-colors sm:px-4 sm:text-sm ${
                    activeFilter === "today"
                      ? "bg-black text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setActiveFilter("customDate")}
                  className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-black transition-colors sm:px-4 sm:text-sm ${
                    activeFilter === "customDate"
                      ? "bg-black text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  Customize Date
                </button>
                <div className="shrink-0 whitespace-nowrap rounded-full bg-stone-100 px-2.5 py-2 text-[11px] font-black text-stone-700 sm:hidden">
                  Total Orders: {visibleOrders.length}
                </div>
              </div>
              {activeFilter === "customDate" && (
                <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(event) => setCustomStartDate(event.target.value)}
                    className="rounded-full bg-stone-100 px-3 py-2 text-sm font-bold text-stone-700 outline-none"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(event) => setCustomEndDate(event.target.value)}
                    className="rounded-full bg-stone-100 px-3 py-2 text-sm font-bold text-stone-700 outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {visibleOrders.length > 0 ? (
        visibleOrders.map((order) => {
          const statusLabel = getOrderStatusLabel(order);
          const statusClass = statusLabel === "Pending"
            ? "text-rose-600"
            : statusLabel === "Confirmed"
            ? "text-sky-600"
            : statusLabel === "Preparing"
            ? "text-orange-600"
            : statusLabel === "Ready"
            ? "text-violet-600"
            : statusLabel === "Completed"
            ? "text-emerald-600"
            : statusLabel === "Cancelled"
            ? "text-stone-700"
            : statusLabel === "Payment Rejected"
            ? "text-rose-600"
            : "text-stone-700";
          const sourceLabel = getOrderSourceLabel(order);

          return (
            <article key={order._id || order.id} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
              <div className="flex flex-nowrap items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="text-lg font-black sm:text-xl">{order.customerName}</h3>
                    <span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-black text-stone-700 sm:px-3 sm:text-sm">
                      {rupees(order.total ?? order.totalAmount ?? order.grandTotal ?? getOrderTotal(order))}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{order.orderId ? `Order ID: ${order.orderId}` : "Order ID unavailable"}</p>
                  <p className="text-sm text-stone-500">Table {order.tableNumber || order.tableNo || order.table || "-"} • {order.phone}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
                    <span className={`rounded-full px-1.5 py-1 text-[10px] font-black uppercase sm:px-2 sm:text-xs ${statusClass}`}>{statusLabel}</span>
                    {sourceLabel && (
                      <span className="rounded-full bg-stone-100 px-1.5 py-1 text-[10px] font-black uppercase tracking-[0.04em] text-stone-700 sm:px-2 sm:text-[11px]">
                        {sourceLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-600 sm:text-xs">{formatOrderDateTime(order.createdAt)}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm font-semibold text-stone-700">
                {(order.items || []).map((line, index) => (
                  <p key={index}>{formatOrderItemLine(line)}</p>
                ))}
              </div>
            </article>
          );
        })
      ) : (
        <div className="rounded-[1.5rem] bg-white p-6 font-bold text-stone-500">
          {normalizedSearch ? "No matching orders found." : "No orders yet."}
        </div>
      )}
    </section>
  );
}

function PosBilling({ items, categories, onSaved }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [detail, setDetail] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [waterBottleModalOpen, setWaterBottleModalOpen] = useState(false);
  const [cigarettesModalOpen, setCigarettesModalOpen] = useState(false);

  const visibleItems = items.filter((item) => (!query || item.name.toLowerCase().includes(query.toLowerCase())) && (activeCategory === "all" || item.categoryId === activeCategory));
  const liveWaterBottleItem = useMemo(() => findBillerQuickAccessMenuItem(items, "Water Bottle", "water-bottles"), [items]);
  const liveCigaretteItems = useMemo(() => getBillerQuickAccessCigaretteItems(items), [items]);
  const cartTotals = useMemo(() => calculateTotals(cart), [cart]);

  function handleAddToCart(item, sizeId, quantity = 1, serveType = "", options = {}) {
    setCart((current) => addCartItem(current, item, sizeId, quantity, serveType, { ...options, serveTypeFallback: "" }));
  }

  function handleAddQuickAccessWaterBottle(quantity = 1) {
    const waterBottleItem = findBillerQuickAccessMenuItem(items, "Water Bottle", "water-bottles");
    if (!waterBottleItem) {
      setWaterBottleModalOpen(false);
      return;
    }

    setCart((current) => addCartItem(current, waterBottleItem, "default", quantity, "", { serveTypeFallback: "default" }));
    setWaterBottleModalOpen(false);
  }

  function handleAddQuickAccessCigarettes(items = []) {
    if (!Array.isArray(items) || items.length === 0) {
      setCigarettesModalOpen(false);
      return;
    }

    const cigaretteItems = items.filter((item) => Number(item.quantity || 0) > 0);
    if (cigaretteItems.length === 0) {
      setCigarettesModalOpen(false);
      return;
    }

    setCart((current) => {
      let nextCart = current;
      cigaretteItems.forEach((item) => {
        const quantity = Number(item.quantity || 0);
        if (!quantity) return;

        const realItem = (Array.isArray(items) ? items : []).find((candidate) => candidate.id === item.id) || item;
        nextCart = addCartItem(nextCart, realItem, "default", quantity, "", { serveTypeFallback: "default" });
      });
      return nextCart;
    });

    setCigarettesModalOpen(false);
  }

  function handleUpdateQty(key, delta) {
    setCart((current) => updateCartQuantity(current, key, delta));
  }

  const total = cartTotals.total;

  async function handleCheckout(details) {
    const paymentMethod = details.paymentMethod || "cash";

    if (paymentMethod === "online") {
      setPendingPaymentData({
        customerName: details.customerName || "OOC Customer",
        phone: details.phone || "0000000000",
        tableNumber: details.tableNumber || "OOC",
        orderId: generateOrderId(),
        items: cart.map((line) => ({ itemId: line.itemId, sizeId: line.sizeId, quantity: line.quantity, serveType: line.serveType, unitPrice: line.unitPrice, basePrice: line.basePrice, lineTotal: line.lineTotal, name: line.name, addons: line.addons })),
        subtotal: total,
        total
      });
      setPaymentModalOpen(true);
      return;
    }

    const payload = {
      customerName: details.customerName || "OOC Customer",
      phone: details.phone || "0000000000",
      tableNumber: details.tableNumber || "OOC",
      paymentMethod: paymentMethod,
      orderType: "OOC",
      source: "ooc",
      items: cart.map((line) => ({ itemId: line.itemId, sizeId: line.sizeId, quantity: line.quantity, serveType: line.serveType, unitPrice: line.unitPrice, basePrice: line.basePrice, lineTotal: line.lineTotal, name: line.name, addons: line.addons })),
      notes: details.notes || "OOC (Order On Counter)"
    };
    const order = preparePrintableOrder(await orderService.createOrder(payload));
    setOrderResult(order);
    setCart([]);
    setCartOpen(false);
    onSaved();
  }

  async function handleIHavePaid() {
    if (!pendingPaymentData) return;

    try {
      const orderKey = pendingPaymentData.orderId;
      let existing = null;
      try {
        existing = await orderService.getPublicOrder(orderKey);
      } catch (error) {
        existing = null;
      }

      const isRetry = existing && ["rejected", "payment_rejected", "payment_issue"].includes(String(existing.paymentStatus || "").toLowerCase());
      if (existing && (existing._id || existing.id || existing.orderId)) {
        const publicId = existing.orderId || existing.id || existing._id;
        await orderService.retryPublicOrder(publicId);
      } else {
        await orderService.createOrder({
          customerName: pendingPaymentData.customerName,
          phone: pendingPaymentData.phone,
          orderId: pendingPaymentData.orderId,
          tableNumber: pendingPaymentData.tableNumber,
          items: pendingPaymentData.items,
          paymentMethod: "UPI_INTENT_OR_STATIC_QR",
          paymentStatus: "pending_verification",
          status: "pending",
          orderType: "OOC",
          source: "ooc",
          notes: "OOC (Order On Counter)"
        });
      }

      setPaymentModalOpen(false);
      setPendingPaymentData(null);
      setCart([]);
      setCartOpen(false);
      showToast(isRetry ? "Payment resubmitted. Waiting for verification." : "Payment submitted. Waiting for verification.");
      onSaved();
    } catch (error) {
      console.error("Failed to submit OOC online payment order:", error);
      showToast(error.message || "Failed to submit order. Please try again.");
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">OOC (Order On Counter)</h2>
            <p className="mt-1 text-sm text-stone-600">Take quick counter orders (Order On Counter) and manage them from the owner dashboard.</p>
          </div>
          <button onClick={() => setCartOpen(true)} className="rounded-full bg-black px-4 py-3 text-sm font-black text-white">Open OOC cart ({cart.length})</button>
        </div>
      </div>
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search menu" className="field w-full max-w-lg bg-stone-50" />
          <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)} className="field bg-stone-50">
            <option value="all">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setWaterBottleModalOpen(true)} className="rounded-full bg-sky-50 px-3 py-2 text-sm font-black text-sky-700 ring-1 ring-sky-200">💧 Water Bottle</button>
            <button type="button" onClick={() => setCigarettesModalOpen(true)} className="rounded-full bg-rose-50 px-3 py-2 text-sm font-black text-rose-700 ring-1 ring-rose-200">🚬 Cigarettes</button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            <MenuItemCard key={item.id} item={item} onDetail={() => setDetail(item)} onAdd={handleAddToCart} />
          ))}
        </div>
      </div>
      <div className="rounded-[1.5rem] bg-stone-50 p-5 shadow-sm">
        <h3 className="text-lg font-black">OOC summary</h3>
        <p className="mt-2 text-sm text-stone-600">Total items in cart: {cart.length}</p>
        <p className="mt-1 text-3xl font-black">{rupees(total)}</p>
      </div>
      {detail && <DetailModal item={detail} onClose={() => setDetail(null)} onAdd={handleAddToCart} />}
      {cartOpen && (
        <CartDrawer cart={cart} total={total} onClose={() => setCartOpen(false)} onQty={handleUpdateQty} onCheckout={handleCheckout} orderOnCounter={false} />
      )}
      {paymentModalOpen && pendingPaymentData && (
        <PaymentModal
          data={pendingPaymentData}
          onClose={() => { setPaymentModalOpen(false); setPendingPaymentData(null); }}
          onIHavePaid={handleIHavePaid}
        />
      )}
      {waterBottleModalOpen && <WaterBottleModal item={liveWaterBottleItem} onClose={() => setWaterBottleModalOpen(false)} onAdd={handleAddQuickAccessWaterBottle} />}
      {cigarettesModalOpen && <CigarettesModal items={liveCigaretteItems} onClose={() => setCigarettesModalOpen(false)} onAdd={handleAddQuickAccessCigarettes} />}
      {orderResult && <OrderSuccess order={orderResult} onClose={() => setOrderResult(null)} />}
    </section>
  );
}

function QrOrders({ orders, onSaved }) {
  const qrOrders = useMemo(() => {
    return (orders || []).filter((order) => getOrderSourceLabel(order) === "QR");
  }, [orders]);

  return (
    <section>
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">QR orders</h2>
        <p className="mt-2 text-sm text-stone-600">Orders placed by customers through the digital menu.</p>
      </div>
      <OrderAdmin orders={qrOrders} onSaved={onSaved} hideWarnings={true} />
    </section>
  );
}

export default App;
