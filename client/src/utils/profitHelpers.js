import { startOfDay, endOfDay, getOrderDate, isCompletedSale } from "./orderHelpers";

const PACKAGED_CATEGORY_IDS = new Set(["water-bottles", "cigarettes", "coconut-water"]);
const PACKAGED_ITEM_IDS = new Set([
  "water-bottle",
  "prab-protein-milk-shake-coffee",
  "prab-protein-milk-shake-double-chocolate"
]);
const PACKAGED_SUBCATEGORIES = new Set(["coolberg", "energy drinks"]);
const PACKAGED_NAME_PATTERNS = [
  "water bottle",
  "coconut water",
  "prab protein milk shake coffee",
  "prab protein milk shake double chocolate",
  "coolberg",
  "monster",
  "redbull",
  "red bull",
  "sting"
];

function normalizePackagedText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getLineItemId(line = {}) {
  return String(line.itemId || line.id || line.productId || line.menuItemId || "").trim();
}

function findMenuItemForLine(line = {}, menuItems = []) {
  const itemId = getLineItemId(line);
  if (!itemId || !Array.isArray(menuItems)) return null;
  return menuItems.find((item) => item?.id === itemId) || null;
}

export function isPackagedMenuItem(itemOrLine = {}, menuItems = []) {
  const menuItem = findMenuItemForLine(itemOrLine, menuItems) || itemOrLine;
  const id = normalizePackagedText(menuItem.id || getLineItemId(itemOrLine));
  const categoryId = normalizePackagedText(menuItem.categoryId || menuItem.category);
  const subcategory = normalizePackagedText(menuItem.subcategory || menuItem.subCategoryName || menuItem.subcategoryName);
  const name = normalizePackagedText(menuItem.name || itemOrLine.name || itemOrLine.itemName || itemOrLine.productName);

  return (
    PACKAGED_ITEM_IDS.has(id) ||
    PACKAGED_CATEGORY_IDS.has(categoryId) ||
    PACKAGED_SUBCATEGORIES.has(subcategory) ||
    PACKAGED_NAME_PATTERNS.some((pattern) => name.includes(pattern))
  );
}

function getUnitCost(material) {
  if (!material || typeof material !== "object") return 0;
  return Number(material.costPerUnit ?? material.purchasePrice ?? material.purchase_price ?? material.unitCost ?? material.price ?? material.unitPrice ?? 0) || 0;
}

function normalizeInventoryText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findInventoryItem(value, inventoryItems = []) {
  const normalized = normalizeInventoryText(value);
  if (!normalized || !Array.isArray(inventoryItems)) return null;
  return inventoryItems.find((item) => {
    return normalizeInventoryText(item?.id) === normalized || normalizeInventoryText(item?.name) === normalized;
  }) || null;
}

function getAddonEntries(line = {}) {
  if (Array.isArray(line.addOns)) return line.addOns;
  if (Array.isArray(line.addons?.selectedAddons)) return line.addons.selectedAddons;
  if (Array.isArray(line.addons)) return line.addons;
  return [];
}

function getInventoryMatchScore(candidate, menuItem, line) {
  const rawName = normalizePackagedText(candidate?.name);
  const menuName = normalizePackagedText(menuItem?.name || line?.name || line?.itemName || line?.productName);
  if (!rawName || !menuName) return 0;
  if (rawName === menuName) return 100;
  if (rawName.includes(menuName) || menuName.includes(rawName)) return 90;

  const rawTokens = new Set(rawName.split(" ").filter((token) => token.length > 2 && token !== "can" && token !== "bottle" && token !== "packaged"));
  const menuTokens = menuName.split(" ").filter((token) => token.length > 2 && token !== "can" && token !== "bottle" && token !== "packaged");
  const matches = menuTokens.filter((token) => rawTokens.has(token)).length;
  return matches > 0 ? matches / Math.max(menuTokens.length, 1) : 0;
}

export function findPackagedInventoryItem(line = {}, inventoryItems = [], menuItems = []) {
  const menuItem = findMenuItemForLine(line, menuItems) || line;
  const candidates = Array.isArray(inventoryItems) ? inventoryItems : [];
  const scored = candidates
    .filter((item) => item && item?.isDeleted !== true)
    .map((item) => ({
      item,
      score: getInventoryMatchScore(item, menuItem, line) + (normalizePackagedText(item.category) === "packaged" ? 0.25 : 0)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.item || null;
}

export function calculateInventoryCostForLine(line = {}, inventoryItems = [], recipeMappings = [], menuItems = []) {
  const qty = Number(line.quantity ?? line.qty ?? 1) || 0;
  const itemId = getLineItemId(line);

  if (isPackagedMenuItem(line, menuItems)) {
    const packagedInventoryItem = findPackagedInventoryItem(line, inventoryItems, menuItems);
    return getUnitCost(packagedInventoryItem) * qty;
  }

  const recipe = Array.isArray(recipeMappings) ? recipeMappings.find((r) => (r.itemId === itemId || r.id === itemId)) : null;
  if (!recipe || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) return 0;

  let costPerMenuItem = 0;
  recipe.ingredients.forEach((ing) => {
    const raw = Array.isArray(inventoryItems)
      ? inventoryItems.find((m) =>
          m.id === ing.rawMaterialId ||
          m.id === ing.inventoryId ||
          m.id === ing.ingredientId ||
          m.name === ing.rawMaterialId ||
          m.name === ing.inventoryId ||
          m.name === ing.ingredientId ||
          m.name === ing.name
        )
      : null;
    const unitCost = getUnitCost(raw);
    const amt = Number(ing.amount ?? 0) || 0;
    costPerMenuItem += amt * unitCost;
  });

  let addonCostPerMenuItem = 0;
  getAddonEntries(line).forEach((addon) => {
    (addon?.inventoryDeduction || []).forEach((deduction) => {
      const raw = findInventoryItem(deduction.rawMaterialId || deduction.itemName || deduction.name, inventoryItems);
      addonCostPerMenuItem += (Number(deduction.quantity ?? deduction.amount ?? 0) || 0) * getUnitCost(raw);
    });
  });

  return (costPerMenuItem + addonCostPerMenuItem) * qty;
}

export function calculateTodayTotalProfit(orders = [], inventoryItems = [], recipeMappings = [], menuItems = []) {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());

  const todays = Array.isArray(orders) ? orders.filter((o) => {
    const od = getOrderDate(o);
    return od !== null && od >= start && od <= end && isCompletedSale(o);
  }) : [];

  const totalSales = todays.reduce((sum, o) => sum + Number(o?.total ?? o?.totalAmount ?? o?.grandTotal ?? 0), 0);

  let inventoryCostUsed = 0;

  todays.forEach((order) => {
    if (!Array.isArray(order.items)) return;
    order.items.forEach((line) => {
      inventoryCostUsed += calculateInventoryCostForLine(line, inventoryItems, recipeMappings, menuItems);
    });
  });

  const totalProfit = totalSales - inventoryCostUsed;
  return { totalSales, inventoryCostUsed, totalProfit };
}

export default calculateTodayTotalProfit;
