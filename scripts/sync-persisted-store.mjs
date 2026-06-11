import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories as seedCategories, menuItems as seedItems, rawMaterials as seedRawMaterials } from '../server/src/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, '..', 'server', 'src', 'persisted-store.json');

const normalize = (value) => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ');

const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const existingCategories = new Set((raw.categories || []).map((item) => normalize(item.id || item.name)));
const categories = [...(raw.categories || [])];
for (const item of seedCategories) {
  const key = normalize(item.id || item.name);
  if (!existingCategories.has(key)) {
    categories.push({ ...item });
    existingCategories.add(key);
  }
}

const existingMenuItems = new Set((raw.menuItems || []).map((item) => normalize(item.id || item.name)));
const menuItems = [...(raw.menuItems || [])];
for (const item of seedItems) {
  const key = normalize(item.id || item.name);
  if (!existingMenuItems.has(key)) {
    menuItems.push({ ...item });
    existingMenuItems.add(key);
  }
}

const existingRawMaterials = new Set((raw.rawMaterials || []).map((item) => normalize(item.id || item.name)));
const rawMaterials = [...(raw.rawMaterials || [])];
for (const item of seedRawMaterials) {
  const key = normalize(item.id || item.name);
  if (!existingRawMaterials.has(key)) {
    rawMaterials.push({ ...item });
    existingRawMaterials.add(key);
  }
}

fs.writeFileSync(filePath, JSON.stringify({ ...raw, categories, menuItems, rawMaterials }, null, 2), 'utf8');
console.log(JSON.stringify({ categories: categories.length, menuItems: menuItems.length, rawMaterials: rawMaterials.length }, null, 2));
