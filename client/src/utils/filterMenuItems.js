// Menu filtering logic

export function normalizeMenuItem(item) {
  if (!item) return item;
  const subcategoryName = item.subCategoryName || item.subcategoryName || item.subcategory || item.subCategory || null;
  const image = item.image || item.photoUrl || item.imageUrl || item.photo || item.img || "";
  const serveOptions = Array.isArray(item.serveOptions)
    ? item.serveOptions
    : Array.isArray(item.servingOptions)
    ? item.servingOptions
    : Array.isArray(item.itemServeOptions)
    ? item.itemServeOptions
    : [];
  return {
    ...item,
    subCategoryId: item.subCategoryId || item.subcategoryId || null,
    subCategoryName: subcategoryName,
    subcategoryName,
    subcategory: subcategoryName,
    image,
    serveOptions,
    addons: Array.isArray(item.addons) ? item.addons : item.addons || [],
    isDeleted: item.isDeleted === true,
    deletedAt: item.deletedAt || null
  };
}

export function filterMenuItems(normalizedItems, activeCategory, selectedSubcategory, query) {
  return normalizedItems.filter((item) => {
      if (item?.isDeleted === true) return false;
      if (item?.category?.isDeleted === true) return false;
    const matchesCategory = activeCategory === "all" || item.categoryId === activeCategory;
    const matchesSubcategory = !selectedSubcategory || item.subcategory === selectedSubcategory;
    const matchesQuery = !query || `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesSubcategory && matchesQuery;
  });
}
