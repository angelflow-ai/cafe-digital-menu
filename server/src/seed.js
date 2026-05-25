export const categories = [
  { id: "hot-drinks", name: "Hot Drinks", icon: "Coffee", sortOrder: 1 },
  { id: "cold-drinks", name: "Cold Drinks", icon: "CupSoda", sortOrder: 10 },
  { id: "snacks", name: "Snacks", icon: "Sandwich", sortOrder: 20 },
  { id: "dessert", name: "Dessert", icon: "CakeSlice", sortOrder: 30 }
];

function s(id, label, price) {
  return { id, name: label, label, price };
}

export const menuItems = [
  // Chai
  { id: "personal-blend-chai", name: "Personal Blend Chai", categoryId: "hot-drinks", description: "", image: "/assets/images/Hot Drinks/Chai/Personal Blend Chai.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 48 }], active: true },
  { id: "black-tea", name: "Black Tea", categoryId: "hot-drinks", description: "", image: "/assets/images/Hot Drinks/Chai/Black Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 48 }], active: true },
  { id: "green-tea", name: "Green Tea", categoryId: "hot-drinks", description: "", image: "/assets/images/Hot Drinks/Chai/Green Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 48 }], active: true },
  { id: "tulsi-tea", name: "Tulsi Tea", categoryId: "hot-drinks", description: "", image: "/assets/images/Hot Drinks/Chai/Tulsi Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 48 }], active: true },
  { id: "lemon-tea", name: "Lemon Tea", categoryId: "hot-drinks", description: "", image: "/assets/images/Hot Drinks/Chai/Lemon Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 48 }], active: true },
  { id: "honey-lemon-tea", name: "Honey Lemon Tea", categoryId: "hot-drinks", description: "", image: "/assets/images/Hot Drinks/Chai/Honey Lemon Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 48 }], active: true },
  { id: "signature-infusion-chai", name: "Signature Infusion Chai", categoryId: "hot-drinks", description: "", image: "/assets/images/Hot Drinks/Chai/Signature Infusion Chai.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 28 }], active: true },

  // Hot Coffee
  { id: "infusion-heritage-coffee", name: "Infusion Heritage Hot Coffee", categoryId: "hot-drinks", description: "", image: "/assets/images/Hot Drinks/Hot Coffee/Infusion Heritage Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "hot-chocolate", name: "Hot Chocolate", categoryId: "hot-drinks", description: "", image: "/assets/images/Hot Drinks/Hot Coffee/Hot Chocolate.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },
  { id: "core-coffee", name: "Core Coffee", categoryId: "hot-drinks", description: "", image: "/assets/images/Hot Drinks/Hot Coffee/Core Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 68 }], active: true },
  { id: "black-coffee", name: "Black Coffee", categoryId: "hot-drinks", description: "", image: "/assets/images/Hot Drinks/Hot Coffee/Black Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 58 }], active: true },

  // Ice Tea
  { id: "infusion-signature-ice-tea", name: "Infusion Signature Ice Tea", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Ice Tea/Infusion Signature Ice Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 128 }], active: true },
  { id: "watermelon-ice-tea", name: "Watermelon Ice Tea", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Ice Tea/Watermelon Ice Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },
  { id: "peach-ice-tea", name: "Peach Ice Tea", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Ice Tea/Peach Ice Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },
  { id: "lemon-ice-tea", name: "Lemon Ice Tea", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Ice Tea/Lemon ice tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 88 }], active: true },

  // Cold Coffee
  { id: "infusion-heritage-cold-coffee", name: "Infusion Heritage Cold Coffee", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Cold Coffee/Infusion Heritage Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true },
  { id: "hazelnut-cold-coffee", name: "Hazelnut Coffee", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Cold Coffee/Hazelnut Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 148 }], active: true },
  { id: "caramel-cold-coffee", name: "Caramel Coffee", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Cold Coffee/Caramel Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 128 }], active: true },
  { id: "mocha-cold-coffee", name: "Mocha Coffee", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Cold Coffee/Mocha Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 128 }], active: true },
  { id: "chocolate-cold-coffee", name: "Chocolate Coffee", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Cold Coffee/Chocolate Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "signature-coffee", name: "Signature Coffee", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Cold Coffee/Signature Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },

  // Mojito
  { id: "guava-chilli-mojito", name: "Guava Chilli Mojito", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Mojito/Guava Chilli Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },
  { id: "masala-lemonade-mojito", name: "Masala Lemonade Mojito", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Mojito/Masala Lemonade Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },
  { id: "spicy-mango-mojito", name: "Spicy Mango Mojito", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Mojito/Spicy Mango Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },
  { id: "green-apple-mojito", name: "Green Apple Mojito", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Mojito/Green Apple Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "watermelon-mojito", name: "Watermelon Mojito", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Mojito/Watermelon Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "cranberry-mojito", name: "Cranberry Mojito", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Mojito/Cranberry Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "blue-curacao-mojito", name: "Blue Curacao Mojito", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Mojito/Blue Curacao Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 108 }], active: true },
  { id: "lime-mint-mojito", name: "Lime & Mint Mojito", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Mojito/Lime & Mint Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },

  // Ice Slush
  { id: "watermelon-slush", name: "Watermelon Slush", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Ice Slush/Watermelon Slush.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "green-apple-slush", name: "Green Apple Slush", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Ice Slush/Green Apple Slush.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 108 }], active: true },
  { id: "cranberry-slush", name: "Cranberry Slush", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Ice Slush/Cranberry Slush.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 108 }], active: true },
  { id: "kala-khatta-slush", name: "Kala Khatta Slush", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Ice Slush/Kala Khatta Slush.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },
  { id: "strawberry-slush", name: "Strawberry Slush", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Ice Slush/Strawberry Slush.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },

  // Milk Shakes
  { id: "kunafa-shake", name: "Kunafa Shake", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Kunafa Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 198 }], active: true },
  { id: "brownie-shake", name: "Brownie Shake", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Brownie Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true },
  { id: "dark-chocolate-shake", name: "Dark Chocolate Shake", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Dark Chocolate Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true },
  { id: "kit-kat-shake", name: "Kit-Kat Shake", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Kit-Kat Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 158 }], active: true },
  { id: "oreo-shake", name: "Oreo Shake", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Oreo Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 158 }], active: true },
  { id: "butterscotch-shake", name: "Butterscotch Shake", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Butterscotch Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },
  { id: "mango-shake", name: "Mango Shake", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Mango Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },
  { id: "strawberry-shake", name: "Strawberry Shake", categoryId: "cold-drinks", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Strawberry Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },

  // Sandwich
  { id: "infusion-heritage-melt", name: "Infusion Heritage Melt", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Sandwich/Infusion Heritage Melt.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 173 }], active: true },
  { id: "paneer-tikka-melt", name: "Paneer Tikka Melt", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Sandwich/Paneer Tikka Melt.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 143 }], active: true },
  { id: "trio-delight-sandwich", name: "Trio Delight Sandwich", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Sandwich/Trio Delight Sandwich.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 113 }], active: true },
  { id: "garden-fresh-sandwich", name: "Garden Fresh Sandwich", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Sandwich/Garden Fresh Sandwich.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 93 }], active: true },

  // Pasta
  { id: "blush-bowl-pasta", name: "Blush Bowl Pasta (Pink Sauce Pasta)", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Pasta/Blush Bowl Pasta (Pink Sauce Pasta).jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true },
  { id: "tomato-basil-pasta", name: "Tomato Basil Pasta (Red Sauce Pasta)", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Pasta/Tomato Basil Pasta (Red Sauce Pasta).jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 148 }], active: true },
  { id: "herbed-bechamel-pasta", name: "Herbed Bechamel Pasta (White Sauce Pasta)", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Pasta/Herbed Béchamel Pasta (White Sauce Pasta).jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },

  // Garlic Bread
  { id: "jalapeno-corn-stuffed-garlic-bread", name: "Jalapeno Corn Stuffed Garlic Bread", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Garlic Bread/Jalapeño Corn Stuffed Garlic Bread.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 188 }], active: true },
  { id: "cheesy-melt-garlic-bread", name: "Cheesy Melt Garlic Bread", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Garlic Bread/Cheesy Melt Garlic Bread.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true },
  { id: "pure-garlic-bread", name: "Pure Garlic Bread", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Garlic Bread/Pure Garlic Bread.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },

  // French Fries
  { id: "infusion-velvet-cheese-fries", name: "Infusion Velvet Cheese Fries", categoryId: "snacks", description: "", image: "/assets/images/Snacks/French-Fries/Infusion Velvet Cheese Fries.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 188 }], active: true },
  { id: "honey-chilli-glazed-potato", name: "Honey Chilli Glazed Potato", categoryId: "snacks", description: "", image: "/assets/images/Snacks/French-Fries/Honey Chilli Glazed Potato.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true },
  { id: "chilli-blaze-potato", name: "Chilli Blaze Potato", categoryId: "snacks", description: "", image: "/assets/images/Snacks/French-Fries/Chilli Blaze Potato.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 148 }], active: true },
  { id: "fiery-peri-peri-fries", name: "Fiery Peri-Peri Fries", categoryId: "snacks", description: "", image: "/assets/images/Snacks/French-Fries/Fiery Peri-Peri Fries.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "golden-crisp-fries", name: "Golden Crisp Fries", categoryId: "snacks", description: "", image: "/assets/images/Snacks/French-Fries/Golden Crisp Fries.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },

  // Burger
  { id: "infusion-loaded-stack", name: "Infusion Loaded Stack", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Burger/Infusion Loaded Stack.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 188 }], active: true },
  { id: "paneer-bliss-burger", name: "Paneer Bliss Burger", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Burger/Paneer Bliss Burger.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 158 }], active: true },
  { id: "cheese-indulgence-burger", name: "Cheese Indulgence Burger", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Burger/Cheese Indulgence Burger.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 128 }], active: true },
  { id: "veg-essence-burger", name: "Veg Essence Burger", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Burger/Veg Essence Burger.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },
  { id: "spiced-aloo-burger", name: "Spiced Aloo Burger", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Burger/Spiced Aloo Burger.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 78 }], active: true },

  // Noodles
  { id: "infusion-wok-hakka", name: "Infusion Wok Hakka", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Noodles/Infusion Wok Hakka.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 178 }], active: true },
  { id: "schezwan-blaze-noodles", name: "Schezwan Blaze Noodles", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Noodles/Schezwan Blaze Noodles.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 158 }], active: true },
  { id: "garlic-essence-noodles", name: "Garlic Essence Noodles", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Noodles/Garlic Essence Noodles.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },
  { id: "harvest-veg-noodles", name: "Harvest Veg Noodles", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Noodles/Harvest Veg Noodles.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 108 }], active: true },

  // Maggi
  { id: "infusion-maxxed-maggi", name: "Infusion Maxxed Maggi", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Maggi/Infusion Maxxed Maggi.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 163 }], active: true },
  { id: "cheese-luxe-maggi", name: "Cheese Luxe Maggi", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Maggi/Cheese Luxe Maggi.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 133 }], active: true },
  { id: "tandoori-twist-maggi", name: "Tandoori Twist Maggi", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Maggi/Tandoori Twist Maggi.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 123 }], active: true },
  { id: "veggie-comfort-maggi", name: "Veggie Comfort Maggi", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Maggi/Veggie Comfort Maggi.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 93 }], active: true },
  { id: "just-maggi", name: "Just Maggi", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Maggi/Just Maggi.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 63 }], active: true },

  // Pizza
  { id: "paneer-tikka-supreme", name: "Paneer Tikka Supreme", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Pizza/Paneer Tikka Supreme.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 318 }], active: true },
  { id: "garden-harvest-pizza", name: "Garden Harvest Pizza", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Pizza/Garden Harvest Pizza.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 278 }], active: true },
  { id: "margherita-delight", name: "Margherita Delight", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Pizza/Margherita Delight.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 248 }], active: true },

  // Dumplings
  { id: "kurkure-delight-momos", name: "Kurkure Delight Momos", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Dumplings/Kurkure Delight Momos.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 228 }], active: true },
  { id: "fusion-gravy-momos", name: "Fusion Gravy Momos", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Dumplings/Fusion Gravy Momos.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 198 }], active: true },
  { id: "golden-crunch-momos", name: "Golden Crunch Momos", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Dumplings/Golden Crunch Momos.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true },

  // Dessert
  { id: "red-velvet-lava-cake", name: "Red Velvet Lava Cake", categoryId: "dessert", description: "", image: "/assets/images/Dessert/Red Velvet Lava Cake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 148 }], active: true },
  { id: "choco-lava-cake", name: "Choco Lava Cake", categoryId: "dessert", description: "", image: "/assets/images/Dessert/Choco Lava Cake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 128 }], active: true },
  { id: "sizzling-brownie-with-ice-cream", name: "Sizzling Brownie with Ice Cream", categoryId: "dessert", description: "", image: "/assets/images/Dessert/Sizzling Brownie with Ice Cream.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "hot-brownie", name: "Hot Brownie", categoryId: "dessert", description: "", image: "/assets/images/Dessert/Hot Brownie.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 108 }], active: true }
];

export const rawMaterials = [
  { id: "tea-leaves", name: "Tea Leaves", category: "Beverages", unit: "g", stock: 10000, minStock: 2500, costPerUnit: 0.8, active: true },
  { id: "coffee-powder", name: "Coffee Powder", category: "Beverages", unit: "g", stock: 8000, minStock: 2000, costPerUnit: 1.5, active: true },
  { id: "milk", name: "Milk", category: "Dairy", unit: "ml", stock: 30000, minStock: 8000, costPerUnit: 0.04, active: true },
  { id: "sugar", name: "Sugar", category: "Pantry", unit: "g", stock: 20000, minStock: 5000, costPerUnit: 0.02, active: true },
  { id: "water", name: "Water", category: "Pantry", unit: "ml", stock: 50000, minStock: 15000, costPerUnit: 0.001, active: true },
  { id: "ice-cubes", name: "Ice Cubes", category: "Cold Prep", unit: "g", stock: 20000, minStock: 5000, costPerUnit: 0.005, active: true },
  { id: "kulhad-cup", name: "Kulhad Cup", category: "Packaging", unit: "pcs", stock: 500, minStock: 100, costPerUnit: 3, active: true },
  { id: "paper-cup", name: "Paper Cup", category: "Packaging", unit: "pcs", stock: 1000, minStock: 200, costPerUnit: 2, active: true },
  { id: "glass", name: "Glass", category: "Packaging", unit: "pcs", stock: 300, minStock: 50, costPerUnit: 10, active: true },
  { id: "bread-slice", name: "Bread Slice", category: "Bakery", unit: "pcs", stock: 500, minStock: 120, costPerUnit: 5, active: true },
  { id: "cheese-slice", name: "Cheese Slice", category: "Dairy", unit: "pcs", stock: 300, minStock: 80, costPerUnit: 8, active: true },
  { id: "pasta", name: "Pasta", category: "Grains", unit: "g", stock: 10000, minStock: 3000, costPerUnit: 0.12, active: true },
  { id: "noodles", name: "Noodles", category: "Grains", unit: "g", stock: 10000, minStock: 3000, costPerUnit: 0.1, active: true },
  { id: "garlic", name: "Garlic", category: "Vegetables", unit: "g", stock: 3000, minStock: 800, costPerUnit: 0.3, active: true },
  { id: "potato", name: "Potato", category: "Vegetables", unit: "g", stock: 15000, minStock: 4000, costPerUnit: 0.05, active: true },
  { id: "tomato-sauce", name: "Tomato Sauce", category: "Condiments", unit: "ml", stock: 8000, minStock: 2000, costPerUnit: 0.15, active: true },
  { id: "chili-sauce", name: "Chili Sauce", category: "Condiments", unit: "ml", stock: 6000, minStock: 1500, costPerUnit: 0.18, active: true },
  { id: "veg-mix", name: "Vegetable Mix", category: "Vegetables", unit: "g", stock: 12000, minStock: 3000, costPerUnit: 0.12, active: true }
];

export const defaultRecipes = [
  {
    id: "personal-blend-chai",
    itemId: "personal-blend-chai",
    ingredients: [
      { rawMaterialId: "tea-leaves", amount: 5, unit: "g" },
      { rawMaterialId: "milk", amount: 150, unit: "ml" },
      { rawMaterialId: "water", amount: 100, unit: "ml" },
      { rawMaterialId: "sugar", amount: 10, unit: "g" },
      { rawMaterialId: "kulhad-cup", amount: 1, unit: "pcs", serveType: "Kulhad" }
    ]
  },
  {
    id: "infusion-heritage-coffee",
    itemId: "infusion-heritage-coffee",
    ingredients: [
      { rawMaterialId: "coffee-powder", amount: 15, unit: "g" },
      { rawMaterialId: "milk", amount: 180, unit: "ml" },
      { rawMaterialId: "sugar", amount: 10, unit: "g" },
      { rawMaterialId: "paper-cup", amount: 1, unit: "pcs", serveType: "Cup" }
    ]
  },
  {
    id: "margherita-delight",
    itemId: "margherita-delight",
    ingredients: [
      { rawMaterialId: "bread-slice", amount: 2, unit: "pcs" },
      { rawMaterialId: "cheese-slice", amount: 1, unit: "pcs" },
      { rawMaterialId: "tomato-sauce", amount: 30, unit: "ml" },
      { rawMaterialId: "veg-mix", amount: 50, unit: "g" }
    ]
  }
];
