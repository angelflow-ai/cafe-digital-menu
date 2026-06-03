import { startOfDay, endOfDay, getOrderDate, isCompletedSale } from "./orderHelpers";

export function calculateTodayTotalProfit(orders = [], inventoryItems = [], recipeMappings = []) {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());

  const todays = Array.isArray(orders) ? orders.filter((o) => {
    const od = getOrderDate(o);
    return od !== null && od >= start && od <= end && isCompletedSale(o);
  }) : [];

  const totalSales = todays.reduce((sum, o) => sum + Number(o?.total ?? o?.totalAmount ?? o?.grandTotal ?? 0), 0);

  function getUnitCost(material) {
    if (!material || typeof material !== "object") return 0;
    return Number(material.costPerUnit ?? material.purchasePrice ?? material.purchase_price ?? material.unitCost ?? material.price ?? material.unitPrice ?? 0) || 0;
  }

  let inventoryCostUsed = 0;

  todays.forEach((order) => {
    if (!Array.isArray(order.items)) return;
    order.items.forEach((line) => {
      const qty = Number(line.quantity ?? line.qty ?? 1) || 0;
      const itemId = line.itemId || line.id || line.productId || line.menuItemId || "";
      const recipe = Array.isArray(recipeMappings) ? recipeMappings.find((r) => (r.itemId === itemId || r.id === itemId)) : null;
      if (!recipe || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) return;
      let costPerMenuItem = 0;
      recipe.ingredients.forEach((ing) => {
        const raw = Array.isArray(inventoryItems) ? inventoryItems.find((m) => m.id === ing.rawMaterialId) : null;
        const unitCost = getUnitCost(raw);
        const amt = Number(ing.amount ?? 0) || 0;
        costPerMenuItem += amt * unitCost;
      });
      inventoryCostUsed += costPerMenuItem * qty;
    });
  });

  const totalProfit = totalSales - inventoryCostUsed;
  return { totalSales, inventoryCostUsed, totalProfit };
}

export default calculateTodayTotalProfit;
