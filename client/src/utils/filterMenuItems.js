// Menu filtering logic

export function normalizeMenuItem(item) {
  if (!item) return item;
  return {
    ...item,
    subcategory: item.subcategory || null
  };
}

export function filterMenuItems(normalizedItems, activeCategory, selectedSubcategory, query) {
  return normalizedItems.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.categoryId === activeCategory;
    const matchesSubcategory = !selectedSubcategory || item.subcategory === selectedSubcategory;
    const matchesQuery = !query || `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesSubcategory && matchesQuery;
  });
}
