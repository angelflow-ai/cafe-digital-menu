import { rawMaterials } from './server/src/seed.js';
const required = [
  'Pizza base','Pizza sauce','Mozzarella cheese','Pizza seasoning','Oregano','Chilli flakes','Paneer tikka topping','Mixed pizza vegetables',
  'Sandwich bread','Burger bun','Veg burger patty','Aloo patty','Lettuce','Tomato','Onion','Cucumber','Capsicum','Mayonnaise','Cheese slice',
  'Pasta','Red sauce','White sauce','Pink sauce','Hakka noodles','Schezwan sauce','Soy sauce','Vinegar',
  'Frozen french fries','Potato','Peri peri masala','Honey chilli sauce','Garlic bread','Garlic butter','Jalapeno','Corn','Momos','Momos chutney',
  'Coffee powder','Tea leaves','Green tea leaves','Tulsi tea leaves','Milk','Sugar','Ice cubes','Lemon','Mint leaves','Soda',
  'Blue Curacao syrup','Green Apple syrup','Cranberry syrup','Watermelon syrup','Peach syrup','Mango syrup','Strawberry syrup','Chocolate syrup','Caramel syrup','Hazelnut syrup','Butterscotch syrup',
  'Storia Coconut Water','Redbull 250ml','Monster Ultra White','Monster Original','Monster Pink','Coolberg Strawberry','Coolberg Peach','Coolberg Cranberry','Coolberg Jugaaro'
];
const norm = (n) => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const set = new Set(rawMaterials.map((item) => norm(item.name)));
const missing = required.filter((name) => !set.has(norm(name)));
console.log('TOTAL_REQUIRED', required.length);
console.log('TOTAL_RAW', rawMaterials.length);
console.log('MISSING_COUNT', missing.length);
console.log(missing.join('\n'));
