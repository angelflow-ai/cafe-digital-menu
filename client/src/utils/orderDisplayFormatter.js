export function rupees(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

export function getItemQuantity(item) {
  return Number(item.quantity ?? item.qty ?? 1);
}

export function getBasePrice(item) {
  const addonPrice = Number(item.addons?.extraCheesePrice || 0);
  const rawUnit = Number(item.basePrice ?? item.originalPrice ?? item.unitPrice ?? item.baseUnitPrice ?? item.price ?? 0);

  if (addonPrice && item.addons?.extraCheese && item.basePrice === undefined) {
    return Math.max(0, rawUnit - addonPrice);
  }

  return Number(item.basePrice ?? item.originalPrice ?? rawUnit);
}

export function getAddonDisplay(item) {
  const quantity = getItemQuantity(item);
  const extraCheesePrice = Number(item.addons?.extraCheesePrice || 0);
  const selected = !!item.addons?.extraCheese && extraCheesePrice > 0;

  if (!selected) return "";
  if (quantity === 1) {
    return ` + Extra Cheese (${rupees(extraCheesePrice)})`;
  }

  return ` + Extra Cheese (${quantity} x ${rupees(extraCheesePrice)})`;
}

export function getAddonEachText(item) {
  const quantity = getItemQuantity(item);
  const extraCheesePrice = Number(item.addons?.extraCheesePrice || 0);
  const selected = !!item.addons?.extraCheese && extraCheesePrice > 0;

  if (!selected) return "";
  if (quantity === 1) {
    return `Extra Cheese (+${rupees(extraCheesePrice)})`;
  }

  return `Extra Cheese (+${rupees(extraCheesePrice)} each)`;
}

export function getFinalItemTotal(item) {
  const quantity = getItemQuantity(item);
  const basePrice = getBasePrice(item);
  const extraCheesePrice = Number(item.addons?.extraCheesePrice || 0);
  return basePrice * quantity + extraCheesePrice * quantity;
}

export function getOrderTotal(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.reduce((sum, item) => {
    const quantity = getItemQuantity(item);
    const basePrice = getBasePrice(item);
    const extraCheesePrice = Number(item.addons?.extraCheesePrice || 0);
    return sum + (basePrice + extraCheesePrice) * quantity;
  }, 0);
}

export function formatOrderItemLine(item) {
  const quantity = getItemQuantity(item);
  const basePrice = getBasePrice(item);
  const addonText = getAddonDisplay(item);
  const finalTotal = getFinalItemTotal(item);
  const sizeLabel = item.sizeName || item.size || item.variant || "Regular";
  const serveText = item.serveType ? ` • ${item.serveType}` : "";

  const baseLine = `${item.name || item.title || item.itemId || "Item"} - ${sizeLabel}${serveText} - ${quantity} x ${rupees(basePrice)}`;
  return addonText ? `${baseLine}${addonText} = ${rupees(finalTotal)}` : `${baseLine} = ${rupees(finalTotal)}`;
}
