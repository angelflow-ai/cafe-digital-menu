function rupees(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

export function getItemQuantity(item) {
  return Number(item.quantity ?? item.qty ?? 1);
}

export function getBaseUnitPrice(item) {
  const addonPrice = Number(item.addons?.extraCheesePrice || 0);
  const rawUnit = Number(item.basePrice ?? item.originalPrice ?? item.unitPrice ?? item.price ?? 0);

  if (addonPrice && item.addons?.extraCheese && item.basePrice === undefined) {
    return Math.max(0, rawUnit - addonPrice);
  }

  return Number(item.basePrice ?? item.originalPrice ?? rawUnit);
}

export function getAddonLines(item) {
  const quantity = getItemQuantity(item);
  const extraCheesePrice = Number(item.addons?.extraCheesePrice || 0);
  const selected = !!item.addons?.extraCheese && extraCheesePrice > 0;
  if (!selected) return [];

  return [
    {
      description: "Extra Cheese",
      quantity,
      unitPrice: extraCheesePrice,
      total: extraCheesePrice * quantity,
      label: `Extra Cheese - ${quantity} x ${rupees(extraCheesePrice)} = ${rupees(extraCheesePrice * quantity)}`
    }
  ];
}

export function getItemLineTotal(item) {
  const quantity = getItemQuantity(item);
  const baseUnitPrice = getBaseUnitPrice(item);
  const addonsTotal = getAddonLines(item).reduce((sum, line) => sum + line.total, 0);
  return baseUnitPrice * quantity + addonsTotal;
}

function normalizeVisibleSizeLabel(item) {
  const rawLabel = item?.sizeName || item?.size || item?.variant || "";
  return String(rawLabel).trim().toLowerCase() === "regular" ? "" : rawLabel;
}

export function getItemDisplayLines(item) {
  const quantity = getItemQuantity(item);
  const baseUnitPrice = getBaseUnitPrice(item);
  const sizeLabel = normalizeVisibleSizeLabel(item);
  const serveText = item.serveType ? ` • ${item.serveType}` : "";
  const sizePart = sizeLabel ? `${sizeLabel}${serveText}` : serveText;
  const separator = sizePart ? " - " : "";
  const baseLine = {
    description: `${item.name || item.itemId || "Item"}${separator}${sizePart} - ${quantity} x ${rupees(baseUnitPrice)} = ${rupees(baseUnitPrice * quantity)}`,
    isAddon: false
  };
  return [baseLine, ...getAddonLines(item)];
}

export function getItemLineSummary(item) {
  return `${item.quantity} x ${rupees(item.unitPrice)} = ${rupees(item.lineTotal ?? (Number(item.unitPrice || 0) * getItemQuantity(item)))}`;
}
