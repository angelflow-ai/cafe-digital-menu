import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI not set");
  process.exit(1);
}

const conn = await mongoose.connect(MONGO_URI);

try {
  const db = conn.connection.db;

  // Query for "brownie-base-pre-baked" in rawmaterials collection
  const collection = db.collection("rawmaterials");
  const doc = await collection.findOne({ id: "brownie-base-pre-baked" });

  if (!doc) {
    console.log("❌ NO DOCUMENT FOUND with id: brownie-base-pre-baked");
    console.log("\nSearching all raw materials to confirm...");
    const allDocs = await collection.find({}).limit(5).toArray();
    console.log("Sample raw materials:", JSON.stringify(allDocs, null, 2));
  } else {
    console.log("✅ DOCUMENT FOUND:");
    console.log(JSON.stringify(doc, null, 2));
    console.log("\n━━ ANALYSIS ━━");
    console.log(`ID: ${doc.id}`);
    console.log(`Name: ${doc.name}`);
    console.log(`isDeleted: ${doc.isDeleted} (type: ${typeof doc.isDeleted})`);
    console.log(`outletId: ${doc.outletId} (type: ${doc.outletId ? typeof doc.outletId : "null"})`);
    console.log(`outletId BSON type: ${doc.outletId ? doc.outletId.constructor.name : "N/A"}`);
    console.log(`_id: ${doc._id}`);
    console.log(`_id BSON type: ${doc._id.constructor.name}`);
  }
} catch (error) {
  console.error("Error:", error.message);
} finally {
  await conn.disconnect();
}
