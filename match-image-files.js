const fs = require('fs');
const path = require('path');
const cwd = process.cwd();
const seedPath = path.join(cwd, 'server', 'src', 'seed.js');
const content = fs.readFileSync(seedPath, 'utf8');
const itemRegex = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",[\s\S]*?image:\s*"([^"]+)"/g;
const items = [];
let match;
while ((match = itemRegex.exec(content))) {
  items.push({id: match[1], name: match[2], image: match[3]});
}
const publicRoot = path.join(cwd, 'client', 'public', 'assets', 'images');
const actual = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else actual.push(full);
  }
}
walk(publicRoot);
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}
const actualNorm = new Map();
for (const file of actual) {
  const base = normalize(path.basename(file, path.extname(file)));
  if (!actualNorm.has(base)) actualNorm.set(base, []);
  actualNorm.get(base).push(file);
}
const missing = [];
const mapping = [];
for (const item of items) {
  const itemNorm = normalize(item.name);
  const found = actualNorm.get(itemNorm);
  const expected = item.image;
  if (!found || found.length === 0) {
    missing.push({id:item.id,name:item.name,expected});
    continue;
  }
  if (found.length > 1) {
    mapping.push({id:item.id,name:item.name,expected,actual:found, note:'multiple'});
  } else {
    mapping.push({id:item.id,name:item.name,expected,actual:found[0]});
  }
}
console.log('items', items.length);
console.log('matches', mapping.filter(m=>!m.note).length);
console.log('ambiguous', mapping.filter(m=>m.note).length);
console.log('missing', missing.length);
for (const m of mapping.slice(0, 50)) {
  console.log(m.id, '->', m.expected, '=>', m.actual, m.note ? m.note : '');
}
if (missing.length) {
  console.log('=== missing ===');
  missing.forEach((item)=> console.log(item.id, item.name, item.expected));
}
