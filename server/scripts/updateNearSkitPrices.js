import mongoose from "mongoose";
import { connectDatabase, Outlet, MenuItem } from "../src/db.js";

const PRICE_MAP = {
  "Storia Coconut Water": 60,
  "Personal Blend Chai": 48,
  "Black Tea": 48,
  "Green Tea": 48,
  "Tulsi Tea": 48,
  "Lemon Tea": 48,
  "Honey Lemon Tea": 48,
  "Signature Infusion Chai": 28,
  "Infusion Heritage Coffee": 118,
  "Hot Chocolate": 98,
  "Core Coffee": 68,
  "Black Coffee": 58,
  "Infusion Signature Ice Tea": 128,
  "Watermelon Ice Tea": 98,
  "Peach Ice Tea": 98,
  "Lemon Ice Tea": 88,
  "Hazelnut Coffee": 148,
  "Caramel Coffee": 128,
  "Mocha Coffee": 128,
  "Chocolate Coffee": 118,
  "Signature Coffee": 98,
  "Guava Chilli Mojito": 138,
  "Masala Lemonade Mojito": 138,
  "Spicy Mango Mojito": 138,
  "Green Apple Mojito": 118,
  "Watermelon Mojito": 118,
  "Cranberry Mojito": 118,
  "Blue Curacao Mojito": 108,
  "Lime & Mint Mojito": 98,
  "Watermelon Slush": 118,
  "Green Apple Slush": 108,
  "Cranberry Slush": 108,
  "Kala Khatta Slush": 98,
  "Strawberry Slush": 98,
  "Kunafa Shake": 198,
  "Brownie Shake": 168,
  "Dark Chocolate Shake": 168,
  "Kit-Kat Shake": 158,
  "Oreo Shake": 158,
  "Butterscotch Shake": 138,
  "Mango Shake": 138,
  "Strawberry Shake": 138,
  "Prab Protein Milk-shake (Double Chocolate)": 85,
  "Prab Protein Milk-shake (Coffee)": 125,
  "Strawberry Coolberg": 109,
  "Peach Coolberg": 109,
  "Cranberry Coolberg": 109,
  "Jugaaro Coolberg": 109,
  "Ultra White Monster": 350,
  "Ultra Original Monster": 300,
  "Ultra Pink Monster": 300,
  "Bad Apple Monster": 300,
  "Rio Punch Monster": 300,
  "White Pineapple Monster": 300,
  "Redbull (250ml)": 125,
  "Infusion Heritage Melt": 173,
  "Paneer Tikka Melt": 143,
  "Trio Delight Sandwich": 113,
  "Garden Fresh Sandwich": 93,
  "Blush Bowl Pasta (Pink Sauce Pasta)": 168,
  "Tomato Basil Pasta (Red Sauce Pasta)": 148,
  "Herbed Béchamel Pasta (White Sauce Pasta)": 138,
  "Jalapeño Corn Stuffed Garlic Bread": 188,
  "Cheesy Melt Garlic Bread": 168,
  "Pure Garlic Bread": 138,
  "Infusion Velvet Cheese Fries": 188,
  "Honey Chilli Glazed Potato": 168,
  "Chilli Blaze Potato": 148,
  "Fiery Peri-Peri Fries": 118,
  "Golden Crisp Fries": 98,
  "Infusion Loaded Stack": 188,
  "Paneer Bliss Burger": 158,
  "Cheese Indulgence Burger": 128,
  "Veg Essence Burger": 98,
  "Spiced Aloo Burger": 78,
  "Infusion Wok Hakka": 178,
  "Schezwan Blaze Noodles": 158,
  "Garlic Essence Noodles": 138,
  "Harvest Veg Noodles": 108,
  "Infusion Maxxed Maggi": 163,
  "Cheese Luxe Maggi": 133,
  "Tandoori Twist Maggi": 123,
  "Veggie Comfort Maggi": 93,
  "Just Maggi": 63,
  "Paneer Tikka Supreme": 318,
  "Garden Harvest Pizza": 278,
  "Margherita Delight": 248,
  "Kurkure Delight Momos": 228,
  "Fusion Gravy Momos": 198,
  "Golden Crunch Momos": 168,
  "Red Velvet Lava Cake": 148,
  "Choco Lava Cake": 128,
  "Sizzling Brownie with Ice Cream": 118,
  "Hot Brownie": 108
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

  const outlet = await Outlet.findOne({ slug: "near-skit" }).lean();
  if (!outlet) {
    throw new Error('Outlet "near-skit" not found.');
  }

  console.log(`Resolved outlet near-skit -> ${outlet._id}`);

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
