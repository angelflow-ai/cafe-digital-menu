const DEFAULT_CART_STORAGE_KEY = "infusion-cart";

export function parseCartStorageValue(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export function loadCartFromStorage(storageKey = DEFAULT_CART_STORAGE_KEY) {
  try {
    return parseCartStorageValue(localStorage.getItem(storageKey));
  } catch (error) {
    return [];
  }
}

export function saveCartToStorage(cart, storageKey = DEFAULT_CART_STORAGE_KEY) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(Array.isArray(cart) ? cart : []));
  } catch (error) {
    // Ignore persistence errors so cart interaction keeps working.
  }
}

export function createCartKey(itemId, sizeId, serveType = "", fallbackServeType = "default", addons = {}) {
  const extraFlag = addons && addons.extraCheese ? "extraCheese" : "noExtra";
  return `${itemId}:${sizeId}:${serveType || fallbackServeType}:${extraFlag}`;
}

export function addToCart(cart, item, sizeId, quantity = 1, serveType = "", options = {}) {
  const current = Array.isArray(cart) ? cart : [];
  const sizes = Array.isArray(item?.sizes) ? item.sizes : [];
  const size = sizes.find((candidate) => candidate.id === sizeId) || sizes[0];

  if (!item || !size) return current;

  const fallbackServeType = options.serveTypeFallback ?? "default";
  const addons = options.addons || {};
  const key = createCartKey(item.id, size.id, serveType, fallbackServeType, addons);
  const existing = current.find((line) => line.key === key);

  if (existing) {
    return current.map((line) => (line.key === key ? { ...line, quantity: line.quantity + quantity, lineTotal: Number(line.unitPrice || 0) * (line.quantity + quantity) } : line));
  }

  const extraPrice = Number(addons?.extraCheesePrice || 0);
  const unitPrice = Number(size.price) + (addons?.extraCheese ? extraPrice : 0);

  return [
    ...current,
    {
      key,
      itemId: item.id,
      name: item.name,
      image: item.image,
      sizeId: size.id,
      sizeName: size.name,
      serveType,
      basePrice: Number(size.price),
      unitPrice: unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      addons: addons
    }
  ];
}

export function removeFromCart(cart, key) {
  return (Array.isArray(cart) ? cart : []).filter((line) => line.key !== key);
}

export function updateQuantity(cart, key, delta) {
  return (Array.isArray(cart) ? cart : [])
    .map((line) => {
      if (line.key !== key) return line;
      const quantity = Math.max(0, line.quantity + delta);
      return {
        ...line,
        quantity,
        lineTotal: Number(line.unitPrice || 0) * quantity
      };
    })
    .filter((line) => line.quantity > 0);
}

export function calculateTotals(cart) {
  const lines = Array.isArray(cart) ? cart : [];
  const total = lines.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0);
  const itemCount = lines.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return { total, itemCount };
}