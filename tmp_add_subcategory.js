const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'server', 'src', 'seed.js');
const text = fs.readFileSync(filePath, 'utf8');
const mapping = {
  'Personal Blend Chai': 'Chai',
  'Black Tea': 'Chai',
  'Green Tea': 'Chai',
  'Tulsi Tea': 'Chai',
  'Lemon Tea': 'Chai',
  'Honey Lemon Tea': 'Chai',
  'Signature Infusion Chai': 'Chai',
  'Infusion Heritage Hot Coffee': 'Coffee',
  'Hot Chocolate': 'Coffee',
  'Core Coffee': 'Coffee',
  'Black Coffee': 'Coffee',
  'Infusion Signature Ice Tea': 'Ice Tea',
  'Watermelon Ice Tea': 'Ice Tea',
  'Peach Ice Tea': 'Ice Tea',
  'Lemon Ice Tea': 'Ice Tea',
  'Infusion Heritage Cold Coffee': 'Cold Coffee',
  'Hazelnut Coffee': 'Cold Coffee',
  'Caramel Coffee': 'Cold Coffee',
  'Mocha Coffee': 'Cold Coffee',
  'Chocolate Coffee': 'Cold Coffee',
  'Signature Coffee': 'Cold Coffee',
  'Guava Chilli Mojito': 'Mojito',
  'Masala Lemonade Mojito': 'Mojito',
  'Spicy Mango Mojito': 'Mojito',
  'Green Apple Mojito': 'Mojito',
  'Watermelon Mojito': 'Mojito',
  'Cranberry Mojito': 'Mojito',
  'Blue Curacao Mojito': 'Mojito',
  'Lime & Mint Mojito': 'Mojito',
  'Watermelon Slush': 'Ice Slush',
  'Green Apple Slush': 'Ice Slush',
  'Cranberry Slush': 'Ice Slush',
  'Kala Khatta Slush': 'Ice Slush',
  'Strawberry Slush': 'Ice Slush',
  'Kunafa Shake': 'Milk Shakes',
  'Brownie Shake': 'Milk Shakes',
  'Dark Chocolate Shake': 'Milk Shakes',
  'Kit-Kat Shake': 'Milk Shakes',
  'Oreo Shake': 'Milk Shakes',
  'Butterscotch Shake': 'Milk Shakes',
  'Mango Shake': 'Milk Shakes',
  'Strawberry Shake': 'Milk Shakes',
  'Infusion Heritage Melt': 'Sandwich',
  'Paneer Tikka Melt': 'Sandwich',
  'Trio Delight Sandwich': 'Sandwich',
  'Garden Fresh Sandwich': 'Sandwich',
  'Blush Bowl Pasta (Pink Sauce Pasta)': 'Pasta',
  'Tomato Basil Pasta (Red Sauce Pasta)': 'Pasta',
  'Herbed Béchamel Pasta (White Sauce Pasta)': 'Pasta',
  'Jalapeño Corn Stuffed Garlic Bread': 'Garlic Bread',
  'Cheesy Melt Garlic Bread': 'Garlic Bread',
  'Pure Garlic Bread': 'Garlic Bread',
  'Infusion Velvet Cheese Fries': 'French Fries',
  'Honey Chilli Glazed Potato': 'French Fries',
  'Chilli Blaze Potato': 'French Fries',
  'Fiery Peri-Peri Fries': 'French Fries',
  'Golden Crisp Fries': 'French Fries',
  'Infusion Loaded Stack': 'Burger',
  'Paneer Bliss Burger': 'Burger',
  'Cheese Indulgence Burger': 'Burger',
  'Veg Essence Burger': 'Burger',
  'Spiced Aloo Burger': 'Burger',
  'Infusion Wok Hakka': 'Noodles',
  'Schezwan Blaze Noodles': 'Noodles',
  'Garlic Essence Noodles': 'Noodles',
  'Harvest Veg Noodles': 'Noodles',
  'Infusion Maxxed Maggi': 'Maggi',
  'Cheese Luxe Maggi': 'Maggi',
  'Tandoori Twist Maggi': 'Maggi',
  'Veggie Comfort Maggi': 'Maggi',
  'Just Maggi': 'Maggi',
  'Paneer Tikka Supreme': 'Pizza',
  'Garden Harvest Pizza': 'Pizza',
  'Margherita Delight': 'Pizza',
  'Kurkure Delight Momos': 'Dumplings',
  'Fusion Gravy Momos': 'Dumplings',
  'Golden Crunch Momos': 'Dumplings',
};
const lines = text.split(/\r?\n/);
let changed = 0;
const pattern = /name: "([^"]+)", categoryId: "([^"]+)"/;
const output = lines.map((line) => {
  if (line.includes('subcategory:')) return line;
  const match = line.match(pattern);
  if (match) {
    const name = match[1];
    const category = match[2];
    if (Object.prototype.hasOwnProperty.call(mapping, name)) {
      const sub = mapping[name];
      changed += 1;
      return line.replace(
        `categoryId: "${category}",`,
        `categoryId: "${category}", subcategory: "${sub}",`
      );
    }
  }
  return line;
});
fs.writeFileSync(filePath, output.join('\n'), 'utf8');
console.log('Updated', changed, 'items');
