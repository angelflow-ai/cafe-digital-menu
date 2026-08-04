import mongoose from "mongoose";
import { connectDatabase, Outlet, MenuItem } from "../src/db.js";

const PRICE_MAP = {
  "Personal Blend Chai": 73,
  "Black Tea": 63,
  "Green Tea": 63,
  "Tulsi Tea": 63,
  "Lemon Tea": 63,
  "Honey Lemon Tea": 63,
  "Signature Infusion Chai": 43,
  "Infusion Heritage Coffee": 138,
  "Hot Chocolate": 118,
  "Core Coffee": 68,
  "Black Coffee": 88,
  "Infusion Signature Ice Tea": 148,
  "Watermelon Ice Tea": 138,
  "Peach Ice Tea": 138,
  "Lemon Ice Tea": 118,
  "Hazelnut Coffee": 168,
  "Caramel Coffee": 168,
  "Mocha Coffee": 148,
  "Chocolate Coffee": 128,
  "Signature Coffee": 118,
  "Guava Chilli Mojito": 148,
  "Masala Lemonade Mojito": 148,
  "Spicy Mango Mojito": 148,
  "Green Apple Mojito": 128,
  "Watermelon Mojito": 128,
  "Cranberry Mojito": 128,
  "Blue Curacao Mojito": 128,
  "Lime & Mint Mojito": 118,
  "Add Virgin Mojito": 118,
  "Watermelon Slush": 138,
  "Green Apple Slush": 128,
  "Cranberry Slush": 128,
  "Kala Khatta Slush": 108,
  "Strawberry Slush": 108,
  "Kunafa Shake": 208,
  "Brownie Shake": 188,
  "Dark Chocolate Shake": 168,
  "Kit-Kat Shake": 168,
  "Oreo Shake": 168,
  "Butterscotch Shake": 148,
  "Mango Shake": 148,
  "Strawberry Shake": 148,
  "Infusion Heritage Melt": 183,
  "Paneer Tikka Melt": 143,
  "Trio Delight Sandwich": 123,
  "Garden Fresh Sandwich": 103,
  "Blush Bowl Pasta (Pink Sauce Pasta)": 218,
  "Tomato Basil Pasta (Red Sauce Pasta)": 198,
  "Herbed Béchamel Pasta (White Sauce Pasta)": 178,
  "Jalapeño Corn Stuffed Garlic Bread": 228,
  "Cheesy Melt Garlic Bread": 198,
  "Pure Garlic Bread": 168,
  "Infusion Velvet Cheese Fries": 208,
  "Honey Chilli Glazed Potato": 188,
  "Chilli Blaze Potato": 148,
  "Fiery Peri-Peri Fries": 128,
  "Golden Crisp Fries": 118,
  "Infusion Loaded Stack": 198,
  "Paneer Bliss Burger": 168,
  "Cheese Indulgence Burger": 138,
  "Veg Essence Burger": 108,
  "Spiced Aloo Burger": 88,
  "Infusion Wok Hakka": 198,
  "Schezwan Blaze Noodles": 168,
  "Garlic Essence Noodles": 148,
  "Harvest Veg Noodles": 128,
  "Infusion Maxxed Maggi": 173,
  "Cheese Luxe Maggi": 143,
  "Tandoori Twist Maggi": 123,
  "Veggie Comfort Maggi": 103,
  "Just Maggi": 83,
  "Paneer Tikka Supreme": 338,
  "Garden Harvest Pizza": 298,
  "Margherita Delight": 268,
  "Kurkure Delight Momos": 248,
  "Fusion Gravy Momos": 208,
  "Golden Crunch Momos": 178,
  "Choco Lava Cake": 138,
  "Sizzling Brownie with Ice Cream": 128,
  "Hot Brownie": 118
};

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function isRegularSize(size = {}) {
  const name = String(size.name || size.label || "").trim().toLowerCase();
  return name === "regular";
}

async function main() {
  console.log("Connecting to database...");
  await connectDatabase();

  const outlet = await Outlet.findOne({ slug: "near-high-street" }).lean();
  if (!outlet) {
    throw new Error('Outlet "near-high-street" not found.');
  }

  console.log(`Resolved outlet near-high-street -> ${outlet._id}`);

  const items = await MenuItem.find({ outletId: outlet._id }).lean();
  const itemMap = new Map();

  for (const item of items) {
    const key = normalizeName(item.name);
    const list = itemMap.get(key) || [];
    list.push(item);
    itemMap.set(key, list);
  }

  const updated = [];
  const notFound = [];

  for (const [rawName, newPrice] of Object.entries(PRICE_MAP)) {
    const key = normalizeName(rawName);
    const records = itemMap.get(key) || [];

    if (!records.length) {
      notFound.push(rawName);
      continue;
    }

    for (const item of records) {
      let updatePayload = null;
      let oldPrice = null;
      const sizes = Array.isArray(item.sizes) ? item.sizes.map((size) => ({ ...size })) : [];

      if (sizes.length > 0) {
        const regularIndex = sizes.findIndex(isRegularSize);
        if (regularIndex >= 0) {
          oldPrice = sizes[regularIndex].price;
          sizes[regularIndex].price = newPrice;
          updatePayload = { sizes };
        } else if (sizes.length === 1) {
          oldPrice = sizes[0].price;
          sizes[0].price = newPrice;
          updatePayload = { sizes };
        } else {
          notFound.push(`${rawName} (matched item ${item._id} has multiple sizes but no Regular variant)`);
          continue;
        }
      } else if (Object.prototype.hasOwnProperty.call(item, "price")) {
        oldPrice = item.price;
        updatePayload = { price: newPrice };
      } else {
        notFound.push(`${rawName} (matched item ${item._id} has no updatable price field)`);
        continue;
      }

      if (!updatePayload) {
        notFound.push(`${rawName} (matched item ${item._id} could not be updated)`);
        continue;
      }

      await MenuItem.updateOne({ _id: item._id, outletId: outlet._id }, { $set: updatePayload });
      updated.push({
        name: rawName,
        itemId: String(item._id),
        oldPrice,
        newPrice,
        matchedName: item.name
      });
    }
  }

  console.log("\nUpdated successfully:");
  for (const result of updated) {
    console.log(`- ${result.name} (stored name: ${result.matchedName}) ${result.oldPrice} -> ${result.newPrice}`);
  }

  if (notFound.length) {
    console.log("\nNOT FOUND — please check manually:");
    for (const missing of notFound) {
      console.log(`- ${missing}`);
    }
  } else {
    console.log("\nNOT FOUND — none");
  }
}

main()
  .catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
      console.log("Disconnected from database.");
    } catch (error) {
      console.warn("Failed to disconnect cleanly:", error);
    }
  });
