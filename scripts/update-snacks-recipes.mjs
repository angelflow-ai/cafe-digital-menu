import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { defaultRecipes, rawMaterials } from "../server/src/seed.js";
import { RawMaterial, Recipe } from "../server/src/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const persistedStorePath = path.resolve(__dirname, "../server/src/persisted-store.json");
const serverEnvPath = path.resolve(__dirname, "../server/.env");
const serverRequire = createRequire(path.resolve(__dirname, "../server/package.json"));
const mongoose = serverRequire("mongoose");

function loadServerEnv() {
  if (!fs.existsSync(serverEnvPath)) return;
  const lines = fs.readFileSync(serverEnvPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadServerEnv();

const TARGET_RECIPE_IDS = [
  "infusion-heritage-melt",
  "paneer-tikka-melt",
  "trio-delight-sandwich",
  "garden-fresh-sandwich",
  "blush-bowl-pasta",
  "tomato-basil-pasta",
  "herbed-bechamel-pasta",
  "jalapeno-corn-stuffed-garlic-bread",
  "cheesy-melt-garlic-bread",
  "pure-garlic-bread",
  "infusion-velvet-cheese-fries",
  "honey-chilli-glazed-potato",
  "chilli-blaze-potato",
  "fiery-peri-peri-fries",
  "golden-crisp-fries",
  "infusion-loaded-stack",
  "paneer-bliss-burger",
  "cheese-indulgence-burger",
  "veg-essence-burger",
  "spiced-aloo-burger",
  "infusion-wok-hakka",
  "schezwan-blaze-noodles",
  "garlic-essence-noodles",
  "harvest-veg-noodles",
  "infusion-maxxed-maggi",
  "cheese-luxe-maggi",
  "tandoori-twist-maggi",
  "veggie-comfort-maggi",
  "just-maggi",
  "paneer-tikka-supreme",
  "garden-harvest-pizza",
  "margherita-delight",
  "kurkure-delight-momos",
  "fusion-gravy-momos",
  "golden-crunch-momos"
];

const targetRecipes = TARGET_RECIPE_IDS.map((id) => defaultRecipes.find((recipe) => recipe.itemId === id || recipe.id === id));
const missingRecipes = TARGET_RECIPE_IDS.filter((id, index) => !targetRecipes[index]);
if (missingRecipes.length) {
  throw new Error(`Missing recipe seed entries: ${missingRecipes.join(", ")}`);
}

const targetRawMaterialIds = new Set(targetRecipes.flatMap((recipe) => recipe.ingredients.map((ingredient) => ingredient.rawMaterialId)));
const targetRawMaterials = rawMaterials.filter((item) => targetRawMaterialIds.has(item.id));

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function loadPersistedStore() {
  if (!fs.existsSync(persistedStorePath)) {
    return { categories: [], menuItems: [], orders: [], rawMaterials: [], recipes: [], inventoryHistory: [] };
  }
  return JSON.parse(fs.readFileSync(persistedStorePath, "utf8"));
}

function updateMemoryStore() {
  const store = loadPersistedStore();
  if (!Array.isArray(store.rawMaterials)) store.rawMaterials = [];
  if (!Array.isArray(store.recipes)) store.recipes = [];

  let materialsCreated = 0;
  let recipesUpserted = 0;
  const rawMaterialKeys = new Set(store.rawMaterials.flatMap((item) => [normalizeKey(item.id), normalizeKey(item.name)]));

  for (const material of targetRawMaterials) {
    if (rawMaterialKeys.has(normalizeKey(material.id)) || rawMaterialKeys.has(normalizeKey(material.name))) continue;
    store.rawMaterials.push({ ...material });
    rawMaterialKeys.add(normalizeKey(material.id));
    rawMaterialKeys.add(normalizeKey(material.name));
    materialsCreated++;
  }

  for (const recipe of targetRecipes) {
    const cleanRecipe = {
      id: recipe.id,
      itemId: recipe.itemId,
      ingredients: recipe.ingredients.map((ingredient) => ({ ...ingredient }))
    };
    const index = store.recipes.findIndex((item) => normalizeKey(item.id) === normalizeKey(cleanRecipe.id) || normalizeKey(item.itemId) === normalizeKey(cleanRecipe.itemId));
    if (index >= 0) store.recipes[index] = cleanRecipe;
    else store.recipes.push(cleanRecipe);
    recipesUpserted++;
  }

  fs.writeFileSync(persistedStorePath, JSON.stringify(store, null, 2), "utf8");
  return { mode: "memory", materialsCreated, recipesUpserted };
}

async function updateMongoStore() {
  await mongoose.connect(process.env.MONGODB_URI);
  let materialsCreated = 0;
  let recipesUpserted = 0;

  for (const material of targetRawMaterials) {
    const existing = await RawMaterial.findOne({
      $or: [
        { id: material.id },
        { name: new RegExp(`^${material.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
      ]
    }).lean();
    if (existing) continue;
    await RawMaterial.create({ ...material });
    materialsCreated++;
  }

  for (const recipe of targetRecipes) {
    await Recipe.findOneAndUpdate(
      { id: recipe.id },
      {
        $set: {
          id: recipe.id,
          itemId: recipe.itemId,
          ingredients: recipe.ingredients.map((ingredient) => ({ ...ingredient }))
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    recipesUpserted++;
  }

  await mongoose.disconnect();
  return { mode: "mongo", materialsCreated, recipesUpserted };
}

async function verifyMongoStore() {
  await mongoose.connect(process.env.MONGODB_URI);
  const recipes = await Recipe.find({ itemId: { $in: TARGET_RECIPE_IDS } }).lean();
  const materials = await RawMaterial.find({}, { id: 1, name: 1, stock: 1 }).lean();
  await mongoose.disconnect();

  const materialIds = new Set(materials.map((item) => item.id));
  const recipeMap = new Map(recipes.map((recipe) => [recipe.itemId, recipe]));
  const missingRecipes = TARGET_RECIPE_IDS.filter((id) => !recipeMap.has(id));
  const unresolvedIngredients = recipes.flatMap((recipe) =>
    (recipe.ingredients || [])
      .filter((ingredient) => !materialIds.has(ingredient.rawMaterialId))
      .map((ingredient) => ({ itemId: recipe.itemId, rawMaterialId: ingredient.rawMaterialId }))
  );

  return {
    mode: "mongo",
    recipeCount: recipes.length,
    missingRecipes,
    unresolvedIngredients,
    deductionDryRun: missingRecipes.length === 0 && unresolvedIngredients.length === 0
  };
}

function verifyMemoryStore() {
  const store = loadPersistedStore();
  const recipes = (Array.isArray(store.recipes) ? store.recipes : []).filter((recipe) => TARGET_RECIPE_IDS.includes(recipe.itemId));
  const materials = Array.isArray(store.rawMaterials) ? store.rawMaterials : [];
  const materialIds = new Set(materials.map((item) => item.id));
  const recipeMap = new Map(recipes.map((recipe) => [recipe.itemId, recipe]));
  const missingRecipes = TARGET_RECIPE_IDS.filter((id) => !recipeMap.has(id));
  const unresolvedIngredients = recipes.flatMap((recipe) =>
    (recipe.ingredients || [])
      .filter((ingredient) => !materialIds.has(ingredient.rawMaterialId))
      .map((ingredient) => ({ itemId: recipe.itemId, rawMaterialId: ingredient.rawMaterialId }))
  );

  return {
    mode: "memory",
    recipeCount: recipes.length,
    missingRecipes,
    unresolvedIngredients,
    deductionDryRun: missingRecipes.length === 0 && unresolvedIngredients.length === 0
  };
}

const verifyOnly = process.argv.includes("--verify");
const result = verifyOnly
  ? process.env.MONGODB_URI
    ? await verifyMongoStore()
    : verifyMemoryStore()
  : process.env.MONGODB_URI
    ? await updateMongoStore()
    : updateMemoryStore();

console.log(JSON.stringify(result, null, 2));
