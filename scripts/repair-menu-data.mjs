import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { repairMenuData } from "../server/src/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

for (const envPath of [path.join(rootDir, ".env"), path.join(rootDir, "server", ".env")]) {
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: false });
}

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is required. Set it in your environment, .env, or server/.env.");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const summary = await repairMenuData();
  console.log("Menu data repair complete.");
  console.log(`duplicates removed: ${summary.duplicatesRemoved}`);
  console.log(`items repaired: ${summary.itemsRepaired}`);
  console.log(`items created: ${summary.itemsCreated}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
