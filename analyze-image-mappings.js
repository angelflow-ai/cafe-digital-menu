const fs = require('fs');
const path = require('path');
const cwd = process.cwd();
const seedPath = path.join(cwd, 'server', 'src', 'seed.js');
const content = fs.readFileSync(seedPath, 'utf8');
const regex = /{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",[\s\S]*?image:\s*"([^"]+)"/g;
const items = [];
let match;
while ((match = regex.exec(content))) {
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
const actualByBase = new Map();
for (const file of actual) {
  const base = path.basename(file).toLowerCase();
  if (!actualByBase.has(base)) actualByBase.set(base, []);
  actualByBase.get(base).push(file);
}
const missing = [];
const mapping = [];
for (const item of items) {
  const expected = path.join(publicRoot, item.image.replace(/^\//, 'assets/').replace(/\//g, path.sep));
  const expectedName = path.basename(item.image).toLowerCase();
  const actualByName = actualByBase.get(expectedName);
  let found = null;
  if (actualByName && actualByName.length === 1) {
    found = actualByName[0];
  } else {
    const altName = item.name.toLowerCase() + path.extname(item.image).toLowerCase();
    const best = actualByBase.get(altName);
    if (best && best.length === 1) found = best[0];
  }
  if (!found) {
    missing.push(item);
    continue;
  }
  mapping.push({ id: item.id, name: item.name, expected: item.image, actual: path.relative(cwd, found) });
}
console.log('total items:', items.length);
console.log('found mappings:', mapping.length);
console.log('missing items:', missing.length);
if (missing.length) {
  missing.forEach((item) => console.log('MISSING', item.id, item.name, item.image));
}
console.log('sample mappings:');
mapping.slice(0, 40).forEach((m) => console.log(m.id, '->', m.expected, 'from', m.actual));
