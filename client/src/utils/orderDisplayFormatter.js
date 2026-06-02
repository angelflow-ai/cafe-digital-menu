function safePrice(value) {
  return Math.round(Number(value || 0));
}

export function rupees(value) {
  return `Rs. ${safePrice(value).toLocaleString("en-IN")}`;
}

export function getItemQuantity(item) {
  return Number(item.quantity ?? item.qty ?? 1);
}

function getAddonTotal(item) {
  const selectedAddons = Array.isArray(item.addons?.selectedAddons) ? item.addons.selectedAddons : [];
  const genericTotal = selectedAddons.reduce((sum, addon) => sum + safePrice(addon.price), 0);
  const legacyExtra = item.addons?.extraCheese ? safePrice(item.addons?.extraCheesePrice || 0) : 0;
  return genericTotal + legacyExtra;
}

export function getBasePrice(item) {
  const addonPrice = safePrice(item.addons?.extraCheesePrice || 0);
  const rawUnit = safePrice(item.basePrice ?? item.originalPrice ?? item.unitPrice ?? item.baseUnitPrice ?? item.price ?? 0);

  if (addonPrice && item.addons?.extraCheese && item.basePrice === undefined) {
    return Math.max(0, rawUnit - addonPrice);
  }

  return safePrice(item.basePrice ?? item.originalPrice ?? rawUnit);
}

export function getAddonDisplay(item) {
  const quantity = getItemQuantity(item);
  const selectedAddons = Array.isArray(item.addons?.selectedAddons) ? item.addons.selectedAddons : [];
  const genericTotal = selectedAddons.reduce((sum, addon) => sum + safePrice(addon.price), 0);
  const legacyExtraCheesePrice = safePrice(item.addons?.extraCheesePrice || 0);
  const hasLegacy = !!item.addons?.extraCheese && legacyExtraCheesePrice > 0;

  if (selectedAddons.length > 0) {
    const addonNames = selectedAddons.map((addon) => addon.name).join(", ");
    if (quantity === 1) {
      return ` + ${addonNames} (${rupees(genericTotal)})`;
    }
    return ` + ${addonNames} (${quantity} x ${rupees(genericTotal)})`;
  }

  if (hasLegacy) {
    if (quantity === 1) {
      return ` + Extra Cheese (${rupees(legacyExtraCheesePrice)})`;
    }
    return ` + Extra Cheese (${quantity} x ${rupees(legacyExtraCheesePrice)})`;
  }

  return "";
}

export function getAddonEachText(item) {
  const quantity = getItemQuantity(item);
  const selectedAddons = Array.isArray(item.addons?.selectedAddons) ? item.addons.selectedAddons : [];
  const genericTotal = selectedAddons.reduce((sum, addon) => sum + safePrice(addon.price), 0);
  const legacyExtraCheesePrice = safePrice(item.addons?.extraCheesePrice || 0);
  const hasLegacy = !!item.addons?.extraCheese && legacyExtraCheesePrice > 0;

  if (selectedAddons.length > 0) {
    const addonNames = selectedAddons.map((addon) => addon.name).join(", ");
    if (quantity === 1) {
      return `${addonNames} (+${rupees(genericTotal)})`;
    }
    return `${addonNames} (+${rupees(genericTotal)} each)`;
  }

  if (!hasLegacy) return "";
  if (quantity === 1) {
    return `Extra Cheese (+${rupees(legacyExtraCheesePrice)})`;
  }

  return `Extra Cheese (+${rupees(legacyExtraCheesePrice)} each)`;
}

export function getFinalItemTotal(item) {
  const quantity = getItemQuantity(item);
  const basePrice = getBasePrice(item);
  const addonTotal = getAddonTotal(item);
  return basePrice * quantity + addonTotal * quantity;
}

export function getOrderTotal(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.reduce((sum, item) => {
    const quantity = getItemQuantity(item);
    const basePrice = getBasePrice(item);
    const addonTotal = getAddonTotal(item);
    return sum + (basePrice + addonTotal) * quantity;
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
