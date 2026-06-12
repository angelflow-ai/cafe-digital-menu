const DISPLAY_ITEM_PRIORITY = [
  "Personal Blend Chai",
  "Signature Infusion Chai",
  "Hot Chocolate",
  "Infusion Heritage Coffee (Hot)",
  "Black Tea",
  "Green Tea",
  "Core Coffee",
  "Black Coffee",
  "Honey Lemon Tea",
  "Lemon Tea",
  "Tulsi Tea",
  "Storia Coconut Water"
];

const CATEGORY_DISPLAY_ORDER = [
  "hot-drinks",
  "coconut-water",
  "cold-drinks",
  "snacks",
  "dessert",
  "energy-drinks"
];

const SUBCATEGORY_DISPLAY_ORDER = {
  "hot-drinks": ["Chai", "Hot Coffee"],
  "coconut-water": ["Coconut Water"],
  "cold-drinks": ["Ice Tea", "Cold Coffee", "Coolberg", "Energy Drinks", "Mojito", "Ice Slush", "Milk Shakes"],
  "snacks": ["Sandwich", "Pasta", "Garlic Bread", "French Fries", "Burger", "Noodles", "Maggi", "Pizza", "Dumplings"],
  "dessert": [],
  "energy-drinks": []
};

function normalizeLabel(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getDisplayAliases(name) {
  const normalized = normalizeLabel(name);
  const aliases = new Set([normalized]);

  if (normalized === "infusion heritage coffee (hot)") {
    aliases.add("infusion heritage hot coffee");
  }

  if (normalized === "infusion heritage hot coffee") {
    aliases.add("infusion heritage coffee (hot)");
  }

  return aliases;
}

export function getItemDisplayPriority(item) {
  const rawName = String(item?.name || "");
  const normalizedName = normalizeLabel(rawName);

  const matchIndex = DISPLAY_ITEM_PRIORITY.findIndex((entry) => {
    const normalizedEntry = normalizeLabel(entry);
    return normalizedEntry === normalizedName || getDisplayAliases(entry).has(normalizedName);
  });

  return matchIndex === -1 ? Number.MAX_SAFE_INTEGER : matchIndex;
}

export function getCategoryDisplayPriority(categoryId) {
  const index = CATEGORY_DISPLAY_ORDER.indexOf(categoryId);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function getSubcategoryDisplayPriority(categoryId, subcategory) {
  const options = SUBCATEGORY_DISPLAY_ORDER[categoryId] || [];
  const index = options.indexOf(subcategory);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function sortMenuItemsForDisplay(items, options = {}) {
  const { activeCategory = "all", selectedSubcategory = null, query = "" } = options;
  const useSpecialPriority = activeCategory === "all" && !selectedSubcategory && !query.trim();

  return items
    .map((item, index) => ({ item, index }))
    .sort((leftEntry, rightEntry) => {
      const left = leftEntry.item;
      const right = rightEntry.item;

      if (useSpecialPriority) {
        const leftPriority = getItemDisplayPriority(left);
        const rightPriority = getItemDisplayPriority(right);
        if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      }

      const leftCategoryPriority = getCategoryDisplayPriority(left.categoryId || left.category || "");
      const rightCategoryPriority = getCategoryDisplayPriority(right.categoryId || right.category || "");
      if (leftCategoryPriority !== rightCategoryPriority) return leftCategoryPriority - rightCategoryPriority;

      const leftSubcategoryPriority = getSubcategoryDisplayPriority(left.categoryId || left.category || "", left.subcategory || left.subCategoryName || left.subCategory || "");
      const rightSubcategoryPriority = getSubcategoryDisplayPriority(right.categoryId || right.category || "", right.subcategory || right.subCategoryName || right.subCategory || "");
      if (leftSubcategoryPriority !== rightSubcategoryPriority) return leftSubcategoryPriority - rightSubcategoryPriority;

      return leftEntry.index - rightEntry.index;
    })
    .map(({ item }) => item);
}
