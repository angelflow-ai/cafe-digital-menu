export const categories = [
  { id: "hot-drinks", name: "Hot Drinks", icon: "Coffee", sortOrder: 1 },
  { id: "cold-drinks", name: "Cold Drinks", icon: "CupSoda", sortOrder: 10 },
  { id: "coconut-water", name: "Coconut Water", icon: "Droplet", sortOrder: 15 },
  { id: "snacks", name: "Snacks", icon: "Sandwich", sortOrder: 20 },
  { id: "dessert", name: "Dessert", icon: "CakeSlice", sortOrder: 30 },
  { id: "water-bottles", name: "Water Bottles", icon: "Droplet", sortOrder: 32 },
  { id: "cigarettes", name: "Cigarettes", icon: "Smoking", sortOrder: 35 }
];

function s(id, label, price) {
  return { id, name: label, label, price };
}

export const menuItems = [
  // Chai
  { id: "personal-blend-chai", name: "Personal Blend Chai", categoryId: "hot-drinks", subcategory: "Chai", description: "", image: "/assets/images/Hot Drinks/Chai/Personal Blend Chai.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 48 }], active: true },
  { id: "black-tea", name: "Black Tea", categoryId: "hot-drinks", subcategory: "Chai", description: "", image: "/assets/images/Hot Drinks/Chai/Black Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 48 }], active: true },
  { id: "green-tea", name: "Green Tea", categoryId: "hot-drinks", subcategory: "Chai", description: "", image: "/assets/images/Hot Drinks/Chai/Green Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 48 }], active: true },
  { id: "tulsi-tea", name: "Tulsi Tea", categoryId: "hot-drinks", subcategory: "Chai", description: "", image: "/assets/images/Hot Drinks/Chai/Tulsi Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 48 }], active: true },
  { id: "lemon-tea", name: "Lemon Tea", categoryId: "hot-drinks", subcategory: "Chai", description: "", image: "/assets/images/Hot Drinks/Chai/Lemon Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 48 }], active: true },
  { id: "honey-lemon-tea", name: "Honey Lemon Tea", categoryId: "hot-drinks", subcategory: "Chai", description: "", image: "/assets/images/Hot Drinks/Chai/Honey Lemon Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 48 }], active: true },
  { id: "signature-infusion-chai", name: "Signature Infusion Chai", categoryId: "hot-drinks", subcategory: "Chai", description: "", image: "/assets/images/Hot Drinks/Chai/Signature Infusion Chai.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 28 }], active: true },

  // Hot Coffee
  { id: "infusion-heritage-coffee", name: "Infusion Heritage Hot Coffee", categoryId: "hot-drinks", subcategory: "Coffee", description: "", image: "/assets/images/Hot Drinks/Hot Coffee/Infusion Heritage Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "hot-chocolate", name: "Hot Chocolate", categoryId: "hot-drinks", subcategory: "Coffee", description: "", image: "/assets/images/Hot Drinks/Hot Coffee/Hot Chocolate.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },
  { id: "core-coffee", name: "Core Coffee", categoryId: "hot-drinks", subcategory: "Coffee", description: "", image: "/assets/images/Hot Drinks/Hot Coffee/Core Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 68 }], active: true },
  { id: "black-coffee", name: "Black Coffee", categoryId: "hot-drinks", subcategory: "Coffee", description: "", image: "/assets/images/Hot Drinks/Hot Coffee/Black Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 58 }], active: true },

  // Ice Tea
  { id: "infusion-signature-ice-tea", name: "Infusion Signature Ice Tea", categoryId: "cold-drinks", subcategory: "Ice Tea", description: "", image: "/assets/images/Cold Drinks/Ice Tea/Infusion Signature Ice Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 128 }], active: true },
  { id: "watermelon-ice-tea", name: "Watermelon Ice Tea", categoryId: "cold-drinks", subcategory: "Ice Tea", description: "", image: "/assets/images/Cold Drinks/Ice Tea/Watermelon Ice Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },
  { id: "peach-ice-tea", name: "Peach Ice Tea", categoryId: "cold-drinks", subcategory: "Ice Tea", description: "", image: "/assets/images/Cold Drinks/Ice Tea/Peach Ice Tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },
  { id: "lemon-ice-tea", name: "Lemon Ice Tea", categoryId: "cold-drinks", subcategory: "Ice Tea", description: "", image: "/assets/images/Cold Drinks/Ice Tea/Lemon ice tea.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 88 }], active: true },

  // Cold Coffee
  { id: "infusion-heritage-cold-coffee", name: "Infusion Heritage Cold Coffee", categoryId: "cold-drinks", subcategory: "Cold Coffee", description: "", image: "/assets/images/Cold Drinks/Cold Coffee/Infusion Heritage Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true },
  { id: "hazelnut-cold-coffee", name: "Hazelnut Coffee", categoryId: "cold-drinks", subcategory: "Cold Coffee", description: "", image: "/assets/images/Cold Drinks/Cold Coffee/Hazelnut Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 148 }], active: true },
  { id: "caramel-cold-coffee", name: "Caramel Coffee", categoryId: "cold-drinks", subcategory: "Cold Coffee", description: "", image: "/assets/images/Cold Drinks/Cold Coffee/Caramel Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 128 }], active: true },
  { id: "mocha-cold-coffee", name: "Mocha Coffee", categoryId: "cold-drinks", subcategory: "Cold Coffee", description: "", image: "/assets/images/Cold Drinks/Cold Coffee/Mocha Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 128 }], active: true },
  { id: "chocolate-cold-coffee", name: "Chocolate Coffee", categoryId: "cold-drinks", subcategory: "Cold Coffee", description: "", image: "/assets/images/Cold Drinks/Cold Coffee/Chocolate Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "signature-coffee", name: "Signature Coffee", categoryId: "cold-drinks", subcategory: "Cold Coffee", description: "", image: "/assets/images/Cold Drinks/Cold Coffee/Signature Coffee.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },

  // Mojito
  { id: "guava-chilli-mojito", name: "Guava Chilli Mojito", categoryId: "cold-drinks", subcategory: "Mojito", description: "", image: "/assets/images/Cold Drinks/Mojito/Guava Chilli Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },
  { id: "masala-lemonade-mojito", name: "Masala Lemonade Mojito", categoryId: "cold-drinks", subcategory: "Mojito", description: "", image: "/assets/images/Cold Drinks/Mojito/Masala Lemonade Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },
  { id: "spicy-mango-mojito", name: "Spicy Mango Mojito", categoryId: "cold-drinks", subcategory: "Mojito", description: "", image: "/assets/images/Cold Drinks/Mojito/Spicy Mango Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },
  { id: "green-apple-mojito", name: "Green Apple Mojito", categoryId: "cold-drinks", subcategory: "Mojito", description: "", image: "/assets/images/Cold Drinks/Mojito/Green Apple Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "watermelon-mojito", name: "Watermelon Mojito", categoryId: "cold-drinks", subcategory: "Mojito", description: "", image: "/assets/images/Cold Drinks/Mojito/Watermelon Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "cranberry-mojito", name: "Cranberry Mojito", categoryId: "cold-drinks", subcategory: "Mojito", description: "", image: "/assets/images/Cold Drinks/Mojito/Cranberry Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "blue-curacao-mojito", name: "Blue Curacao Mojito", categoryId: "cold-drinks", subcategory: "Mojito", description: "", image: "/assets/images/Cold Drinks/Mojito/Blue Curacao Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 108 }], active: true },
  { id: "lime-mint-mojito", name: "Lime & Mint Mojito", categoryId: "cold-drinks", subcategory: "Mojito", description: "", image: "/assets/images/Cold Drinks/Mojito/Lime & Mint Mojito.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },

  // Ice Slush
  { id: "watermelon-slush", name: "Watermelon Slush", categoryId: "cold-drinks", subcategory: "Ice Slush", description: "", image: "/assets/images/Cold Drinks/Ice Slush/Watermelon Slush.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "green-apple-slush", name: "Green Apple Slush", categoryId: "cold-drinks", subcategory: "Ice Slush", description: "", image: "/assets/images/Cold Drinks/Ice Slush/Green Apple Slush.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 108 }], active: true },
  { id: "cranberry-slush", name: "Cranberry Slush", categoryId: "cold-drinks", subcategory: "Ice Slush", description: "", image: "/assets/images/Cold Drinks/Ice Slush/Cranberry Slush.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 108 }], active: true },
  { id: "kala-khatta-slush", name: "Kala Khatta Slush", categoryId: "cold-drinks", subcategory: "Ice Slush", description: "", image: "/assets/images/Cold Drinks/Ice Slush/Kala Khatta Slush.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },
  { id: "strawberry-slush", name: "Strawberry Slush", categoryId: "cold-drinks", subcategory: "Ice Slush", description: "", image: "/assets/images/Cold Drinks/Ice Slush/Strawberry Slush.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },

  // Milk Shakes
  { id: "kunafa-shake", name: "Kunafa Shake", categoryId: "cold-drinks", subcategory: "Milk Shakes", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Kunafa Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 198 }], active: true },
  { id: "brownie-shake", name: "Brownie Shake", categoryId: "cold-drinks", subcategory: "Milk Shakes", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Brownie Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true },
  { id: "dark-chocolate-shake", name: "Dark Chocolate Shake", categoryId: "cold-drinks", subcategory: "Milk Shakes", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Dark Chocolate Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true },
  { id: "kit-kat-shake", name: "Kit-Kat Shake", categoryId: "cold-drinks", subcategory: "Milk Shakes", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Kit-Kat Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 158 }], active: true },
  { id: "oreo-shake", name: "Oreo Shake", categoryId: "cold-drinks", subcategory: "Milk Shakes", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Oreo Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 158 }], active: true },
  { id: "butterscotch-shake", name: "Butterscotch Shake", categoryId: "cold-drinks", subcategory: "Milk Shakes", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Butterscotch Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },
  { id: "mango-shake", name: "Mango Shake", categoryId: "cold-drinks", subcategory: "Milk Shakes", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Mango Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },
  { id: "strawberry-shake", name: "Strawberry Shake", categoryId: "cold-drinks", subcategory: "Milk Shakes", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Strawberry Shake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },
  { id: "prab-protein-milk-shake-double-chocolate", name: "Prab Protein Milk-shake (Double Chocolate)", categoryId: "cold-drinks", subcategory: "Milk Shakes", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Prab Protein Milk-shake (Double Chocolate).jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 85 }], active: true },
  { id: "prab-protein-milk-shake-coffee", name: "Prab Protein Milk-shake (Coffee)", categoryId: "cold-drinks", subcategory: "Milk Shakes", description: "", image: "/assets/images/Cold Drinks/Milk Shakes/Prab Protein Milk-shake (Coffee).webp", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 125 }], active: true },

  // Coolberg
  { id: "strawberry-coolberg", name: "Strawberry Coolberg", categoryId: "cold-drinks", subcategory: "Coolberg", description: "", image: "/assets/images/Cold Drinks/Coolberg/Strawberry Coolberg.png", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 109 }], active: true, isDeleted: false, deletedAt: null },
  { id: "peach-coolberg", name: "Peach Coolberg", categoryId: "cold-drinks", subcategory: "Coolberg", description: "", image: "/assets/images/Cold Drinks/Coolberg/Peach Coolberg.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 109 }], active: true, isDeleted: false, deletedAt: null },
  { id: "cranberry-coolberg", name: "Cranberry Coolberg", categoryId: "cold-drinks", subcategory: "Coolberg", description: "", image: "/assets/images/Cold Drinks/Coolberg/Cranberry Coolberg.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 109 }], active: true, isDeleted: false, deletedAt: null },
  { id: "jugaaro-coolberg", name: "Jugaaro Coolberg", categoryId: "cold-drinks", subcategory: "Coolberg", description: "", image: "/assets/images/Cold Drinks/Coolberg/Jugaaro Coolberg.webp", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 109 }], active: true, isDeleted: false, deletedAt: null },

  // Energy Drinks
  { id: "ultra-white-monster", name: "Ultra White Monster", categoryId: "cold-drinks", subcategory: "Energy Drinks", description: "", image: "/assets/images/Cold Drinks/Energy Drinks/Ultra White Monster.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 350 }], active: true, isDeleted: false, deletedAt: null },
  { id: "ultra-original-monster", name: "Ultra Original Monster", categoryId: "cold-drinks", subcategory: "Energy Drinks", description: "", image: "/assets/images/Cold Drinks/Energy Drinks/Ultra Original Monster.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 300 }], active: true, isDeleted: false, deletedAt: null },
  { id: "ultra-pink-monster", name: "Ultra Pink Monster", categoryId: "cold-drinks", subcategory: "Energy Drinks", description: "", image: "/assets/images/Cold Drinks/Energy Drinks/Ultra Pink Monster.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 300 }], active: true, isDeleted: false, deletedAt: null },
  { id: "bad-apple-monster", name: "Bad Apple Monster", categoryId: "cold-drinks", subcategory: "Energy Drinks", description: "", image: "/assets/images/Cold Drinks/Energy Drinks/Bad Apple Monster.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 300 }], active: true, isDeleted: false, deletedAt: null },
  { id: "rio-punch-monster", name: "Rio Punch Monster", categoryId: "cold-drinks", subcategory: "Energy Drinks", description: "", image: "/assets/images/Cold Drinks/Energy Drinks/Rio Punch Monster.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 300 }], active: true, isDeleted: false, deletedAt: null },
  { id: "white-pineapple-monster", name: "White Pineapple Monster", categoryId: "cold-drinks", subcategory: "Energy Drinks", description: "", image: "/assets/images/Cold Drinks/Energy Drinks/White Pineapple Monster.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 300 }], active: true, isDeleted: false, deletedAt: null },
  { id: "redbull-250ml-", name: "Redbull (250ml)", categoryId: "cold-drinks", subcategory: "Energy Drinks", description: "", image: "/assets/images/Cold Drinks/Energy Drinks/Red Bull.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 125 }], active: true, isDeleted: false, deletedAt: null },

  // Coconut Water
  { id: "storia-coconut-water", name: "Storia Coconut Water", categoryId: "coconut-water", description: "", image: "/assets/images/Coconut Water/Storia Coconut Water.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 60 }], active: true },

  // Sandwich
  { id: "infusion-heritage-melt", name: "Infusion Heritage Melt", categoryId: "snacks", subcategory: "Sandwich", description: "", image: "/assets/images/Snacks/Sandwich/Infusion Heritage Melt.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 173 }], active: true },
  { id: "paneer-tikka-melt", name: "Paneer Tikka Melt", categoryId: "snacks", subcategory: "Sandwich", description: "", image: "/assets/images/Snacks/Sandwich/Paneer Tikka Melt.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 143 }], active: true },
  { id: "trio-delight-sandwich", name: "Trio Delight Sandwich", categoryId: "snacks", subcategory: "Sandwich", description: "", image: "/assets/images/Snacks/Sandwich/Trio Delight Sandwich.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 113 }], active: true },
  { id: "garden-fresh-sandwich", name: "Garden Fresh Sandwich", categoryId: "snacks", subcategory: "Sandwich", description: "", image: "/assets/images/Snacks/Sandwich/Garden Fresh Sandwich.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 93 }], active: true },

  // Pasta
  { id: "blush-bowl-pasta", name: "Blush Bowl Pasta (Pink Sauce Pasta)", categoryId: "snacks", subcategory: "Pasta", description: "", image: "/assets/images/Snacks/Pasta/Blush Bowl Pasta (Pink Sauce Pasta).jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true },
  { id: "tomato-basil-pasta", name: "Tomato Basil Pasta (Red Sauce Pasta)", categoryId: "snacks", subcategory: "Pasta", description: "", image: "/assets/images/Snacks/Pasta/Tomato Basil Pasta (Red Sauce Pasta).jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 148 }], active: true },
  { id: "herbed-bechamel-pasta", name: "Herbed Béchamel Pasta (White Sauce Pasta)", categoryId: "snacks", subcategory: "Pasta", description: "", image: "/assets/images/Snacks/Pasta/Herbed Béchamel Pasta (White Sauce Pasta).jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },

  // Garlic Bread
  { id: "jalapeno-corn-stuffed-garlic-bread", name: "Jalapeno Corn Stuffed Garlic Bread", categoryId: "snacks", description: "", image: "/assets/images/Snacks/Garlic Bread/Jalapeño Corn Stuffed Garlic Bread.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 188 }], active: true },
  { id: "cheesy-melt-garlic-bread", name: "Cheesy Melt Garlic Bread", categoryId: "snacks", subcategory: "Garlic Bread", description: "", image: "/assets/images/Snacks/Garlic Bread/Cheesy Melt Garlic Bread.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true },
  { id: "pure-garlic-bread", name: "Pure Garlic Bread", categoryId: "snacks", subcategory: "Garlic Bread", description: "", image: "/assets/images/Snacks/Garlic Bread/Pure Garlic Bread.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },

  // French Fries
  { id: "infusion-velvet-cheese-fries", name: "Infusion Velvet Cheese Fries", categoryId: "snacks", subcategory: "French Fries", description: "", image: "/assets/images/Snacks/French-Fries/Infusion Velvet Cheese Fries.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 188 }], active: true },
  { id: "honey-chilli-glazed-potato", name: "Honey Chilli Glazed Potato", categoryId: "snacks", subcategory: "French Fries", description: "", image: "/assets/images/Snacks/French-Fries/Honey Chilli Glazed Potato.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true },
  { id: "chilli-blaze-potato", name: "Chilli Blaze Potato", categoryId: "snacks", subcategory: "French Fries", description: "", image: "/assets/images/Snacks/French-Fries/Chilli Blaze Potato.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 148 }], active: true },
  { id: "fiery-peri-peri-fries", name: "Fiery Peri-Peri Fries", categoryId: "snacks", subcategory: "French Fries", description: "", image: "/assets/images/Snacks/French-Fries/Fiery Peri-Peri Fries.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "golden-crisp-fries", name: "Golden Crisp Fries", categoryId: "snacks", subcategory: "French Fries", description: "", image: "/assets/images/Snacks/French-Fries/Golden Crisp Fries.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },

  // Burger
  { id: "infusion-loaded-stack", name: "Infusion Loaded Stack", categoryId: "snacks", subcategory: "Burger", description: "", image: "/assets/images/Snacks/Burger/Infusion Loaded Stack.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 188 }], active: true },
  { id: "paneer-bliss-burger", name: "Paneer Bliss Burger", categoryId: "snacks", subcategory: "Burger", description: "", image: "/assets/images/Snacks/Burger/Paneer Bliss Burger.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 158 }], active: true },
  { id: "cheese-indulgence-burger", name: "Cheese Indulgence Burger", categoryId: "snacks", subcategory: "Burger", description: "", image: "/assets/images/Snacks/Burger/Cheese Indulgence Burger.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 128 }], active: true },
  { id: "veg-essence-burger", name: "Veg Essence Burger", categoryId: "snacks", subcategory: "Burger", description: "", image: "/assets/images/Snacks/Burger/Veg Essence Burger.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 98 }], active: true },
  { id: "spiced-aloo-burger", name: "Spiced Aloo Burger", categoryId: "snacks", subcategory: "Burger", description: "", image: "/assets/images/Snacks/Burger/Spiced Aloo Burger.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 78 }], active: true },

  // Noodles
  { id: "infusion-wok-hakka", name: "Infusion Wok Hakka", categoryId: "snacks", subcategory: "Noodles", description: "", image: "/assets/images/Snacks/Noodles/Infusion Wok Hakka.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 178 }], active: true },
  { id: "schezwan-blaze-noodles", name: "Schezwan Blaze Noodles", categoryId: "snacks", subcategory: "Noodles", description: "", image: "/assets/images/Snacks/Noodles/Schezwan Blaze Noodles.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 158 }], active: true },
  { id: "garlic-essence-noodles", name: "Garlic Essence Noodles", categoryId: "snacks", subcategory: "Noodles", description: "", image: "/assets/images/Snacks/Noodles/Garlic Essence Noodles.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 138 }], active: true },
  { id: "harvest-veg-noodles", name: "Harvest Veg Noodles", categoryId: "snacks", subcategory: "Noodles", description: "", image: "/assets/images/Snacks/Noodles/Harvest Veg Noodles.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 108 }], active: true },

  // Maggi
  { id: "infusion-maxxed-maggi", name: "Infusion Maxxed Maggi", categoryId: "snacks", subcategory: "Maggi", description: "", image: "/assets/images/Snacks/Maggi/Infusion Maxxed Maggi.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 163 }], active: true },
  { id: "cheese-luxe-maggi", name: "Cheese Luxe Maggi", categoryId: "snacks", subcategory: "Maggi", description: "", image: "/assets/images/Snacks/Maggi/Cheese Luxe Maggi.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 133 }], active: true },
  { id: "tandoori-twist-maggi", name: "Tandoori Twist Maggi", categoryId: "snacks", subcategory: "Maggi", description: "", image: "/assets/images/Snacks/Maggi/Tandoori Twist Maggi.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 123 }], active: true },
  { id: "veggie-comfort-maggi", name: "Veggie Comfort Maggi", categoryId: "snacks", subcategory: "Maggi", description: "", image: "/assets/images/Snacks/Maggi/Veggie Comfort Maggi.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 93 }], active: true },
  { id: "just-maggi", name: "Just Maggi", categoryId: "snacks", subcategory: "Maggi", description: "", image: "/assets/images/Snacks/Maggi/Just Maggi.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 63 }], active: true },

  // Pizza
  { id: "paneer-tikka-supreme", name: "Paneer Tikka Supreme", categoryId: "snacks", subcategory: "Pizza", description: "", image: "/assets/images/Snacks/Pizza/Paneer Tikka Supreme.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 318 }], active: true },
  { id: "garden-harvest-pizza", name: "Garden Harvest Pizza", categoryId: "snacks", subcategory: "Pizza", description: "", image: "/assets/images/Snacks/Pizza/Garden Harvest Pizza.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 278 }], active: true },
  { id: "margherita-delight", name: "Margherita Delight", categoryId: "snacks", subcategory: "Pizza", description: "", image: "/assets/images/Snacks/Pizza/Margherita Delight.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 248 }], active: true },

  // Dumplings
  { id: "kurkure-delight-momos", name: "Kurkure Delight Momos", categoryId: "snacks", subcategory: "Dumplings", description: "", image: "/assets/images/Snacks/Dumplings/Kurkure Delight Momos.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 228 }], active: true },
  { id: "fusion-gravy-momos", name: "Fusion Gravy Momos", categoryId: "snacks", subcategory: "Dumplings", description: "", image: "/assets/images/Snacks/Dumplings/Fusion Gravy Momos.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 198 }], active: true },
  { id: "golden-crunch-momos", name: "Golden Crunch Momos", categoryId: "snacks", subcategory: "Dumplings", description: "", image: "/assets/images/Snacks/Dumplings/Golden Crunch Momos.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 168 }], active: true },

  // Dessert
  { id: "red-velvet-lava-cake", name: "Red Velvet Lava Cake", categoryId: "dessert", description: "", image: "/assets/images/Dessert/Red Velvet Lava Cake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 148 }], active: true },
  { id: "choco-lava-cake", name: "Choco Lava Cake", categoryId: "dessert", description: "", image: "/assets/images/Dessert/Choco Lava Cake.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 128 }], active: true },
  { id: "sizzling-brownie-with-ice-cream", name: "Sizzling Brownie with Ice Cream", categoryId: "dessert", description: "", image: "/assets/images/Dessert/Sizzling Brownie with Ice Cream.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 118 }], active: true },
  { id: "hot-brownie", name: "Hot Brownie", categoryId: "dessert", description: "", image: "/assets/images/Dessert/Hot Brownie.jpg", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 108 }], active: true },

  // Water Bottles
  { id: "water-bottle", name: "Water Bottle", categoryId: "water-bottles", description: "", image: "", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 30 }], active: true },

  // Cigarettes
  { id: "big-advance", name: "Big Advance", categoryId: "cigarettes", description: "", image: "", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 28 }], active: true },
  { id: "big-gold-flake", name: "Big Gold Flake", categoryId: "cigarettes", description: "", image: "", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 28 }], active: true },
  { id: "connect", name: "Connect", categoryId: "cigarettes", description: "", image: "", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 25 }], active: true },
  { id: "ultra-mild", name: "Ultra Mild", categoryId: "cigarettes", description: "", image: "", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 28 }], active: true },
  { id: "mild-classic", name: "Mild Classic", categoryId: "cigarettes", description: "", image: "", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 28 }], active: true },
  { id: "fine-touch", name: "Fine Touch", categoryId: "cigarettes", description: "", image: "", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 25 }], active: true },
  { id: "marlboro-red", name: "Marlboro Red", categoryId: "cigarettes", description: "", image: "", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 28 }], active: true },
  { id: "double-brust", name: "Double Brust", categoryId: "cigarettes", description: "", image: "", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 28 }], active: true },
  { id: "ice-brust", name: "Ice Brust", categoryId: "cigarettes", description: "", image: "", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 28 }], active: true },
  { id: "classic-regular", name: "Classic Regular", categoryId: "cigarettes", description: "", image: "", sizes: [{ id: "one", name: "Regular", label: "Regular", price: 28 }], active: true }
];

const existingRawMaterials = [
  { id: "tea-leaves", name: "Tea Leaves", category: "Beverages", unit: "g", stock: 10000, minStock: 2500, costPerUnit: 0.8, active: true },
  { id: "coffee-powder", name: "Coffee Powder", category: "Beverages", unit: "g", stock: 8000, minStock: 2000, costPerUnit: 1.5, active: true },
  { id: "milk", name: "Milk", category: "Dairy", unit: "ml", stock: 30000, minStock: 8000, costPerUnit: 0.04, active: true },
  { id: "sugar", name: "Sugar", category: "Pantry", unit: "g", stock: 20000, minStock: 5000, costPerUnit: 0.02, active: true },
  { id: "water", name: "Water", category: "Pantry", unit: "ml", stock: 50000, minStock: 15000, costPerUnit: 0.001, active: true },
  { id: "ice-cubes", name: "Ice Cubes", category: "Cold Prep", unit: "g", stock: 20000, minStock: 5000, costPerUnit: 0.005, active: true },
  { id: "kulhad-cup", name: "Kulhad Cup", category: "Packaging", unit: "pcs", stock: 500, minStock: 100, costPerUnit: 3, active: true },
  { id: "paper-cup", name: "Paper Cup", category: "Packaging", unit: "pcs", stock: 1000, minStock: 200, costPerUnit: 2, active: false },
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

const baseInventoryItems = [
  { name: "Milk", category: "Dairy", unit: "ml" },
  { name: "Water (drinking water for beverages)", category: "Beverages", unit: "ml" },
  { name: "Sugar", category: "Pantry", unit: "g" },
  { name: "Black tea leaves", category: "Beverages", unit: "g" },
  { name: "Green tea leaves", category: "Beverages", unit: "g" },
  { name: "Tulsi tea leaves", category: "Beverages", unit: "g" },
  { name: "Lemon tea blend / powder", category: "Beverages", unit: "g" },
  { name: "Honey", category: "Pantry", unit: "g" },
  { name: "Ginger", category: "Spices", unit: "g" },
  { name: "Cardamom", category: "Spices", unit: "g" },
  { name: "Cinnamon", category: "Spices", unit: "g" },
  { name: "Cloves", category: "Spices", unit: "g" },
  { name: "Salt", category: "Spices", unit: "g" },
  { name: "Black Pepper", category: "Spices", unit: "g" },
  { name: "Chaat Masala", category: "Spices", unit: "g" },
  { name: "Tea Concentrate", category: "Beverages", unit: "ml" },
  { name: "Sugar Syrup", category: "Beverages", unit: "ml" },
  { name: "Lemon Juice", category: "Beverages", unit: "ml" },
  { name: "Chilled Milk", category: "Dairy", unit: "ml" },
  { name: "Instant coffee / coffee powder", category: "Beverages", unit: "g" },
  { name: "Cocoa powder", category: "Beverages", unit: "g" },
  { name: "Chocolate syrup", category: "Beverages", unit: "ml" },
  { name: "Caramel syrup", category: "Beverages", unit: "ml" },
  { name: "Hazelnut syrup", category: "Beverages", unit: "ml" },
  { name: "Mocha syrup", category: "Beverages", unit: "ml" },
  { name: "Vanilla syrup", category: "Beverages", unit: "ml" },
  { name: "Blue Curacao syrup", category: "Beverages", unit: "ml" },
  { name: "Green apple syrup", category: "Beverages", unit: "ml" },
  { name: "Cranberry syrup", category: "Beverages", unit: "ml" },
  { name: "Watermelon syrup", category: "Beverages", unit: "ml" },
  { name: "Kala Khatta Syrup", category: "Beverages", unit: "ml" },
  { name: "Peach syrup", category: "Beverages", unit: "ml" },
  { name: "Mango pulp / mango syrup", category: "Beverages", unit: "ml" },
  { name: "Mango syrup", category: "Beverages", unit: "ml" },
  { name: "Honey‑lemon concentrate", category: "Beverages", unit: "ml" },
  { name: "Mint leaves", category: "Vegetables", unit: "g" },
  { name: "Lime / lemon juice", category: "Beverages", unit: "ml" },
  { name: "Lemon", category: "Beverages", unit: "ml" },
  { name: "Soda water / club soda", category: "Beverages", unit: "ml" },
  { name: "Soda", category: "Beverages", unit: "ml" },
  { name: "Sparkling water / black soda", category: "Beverages", unit: "ml" },
  { name: "Ice cubes", category: "Cold Prep", unit: "g" },
  { name: "Vanilla Ice Cream", category: "Dairy", unit: "g" },
  { name: "Chocolate Ice Cream", category: "Dairy", unit: "g" },
  { name: "Butterscotch Ice Cream", category: "Dairy", unit: "g" },
  { name: "Protein powder (double chocolate)", category: "Beverages", unit: "g" },
  { name: "Protein powder (coffee)", category: "Beverages", unit: "g" },
  { name: "Kunafa mix", category: "Bakery", unit: "g" },
  { name: "Pistachio Crushed", category: "Bakery", unit: "g" },
  { name: "Brownies (pieces for shakes)", category: "Bakery", unit: "g" },
  { name: "Dark Chocolate Compound", category: "Bakery", unit: "g" },
  { name: "Oreo cookies (crumbled)", category: "Bakery", unit: "g" },
  { name: "KitKat Crushed", category: "Bakery", unit: "g" },
  { name: "KitKat bars (mini)", category: "Bakery", unit: "pcs" },
  { name: "Butterscotch syrup", category: "Beverages", unit: "ml" },
  { name: "Coolberg Strawberry", category: "Packaged", unit: "ml" },
  { name: "Coolberg Peach", category: "Packaged", unit: "ml" },
  { name: "Coolberg Cranberry", category: "Packaged", unit: "ml" },
  { name: "Coolberg Jugaaro", category: "Packaged", unit: "ml" },
  { name: "Strawberry syrup", category: "Beverages", unit: "ml" },
  { name: "Vanilla ice cream (for milkshakes)", category: "Dairy", unit: "g" },
  { name: "Storia Coconut Water (packaged bottle)", category: "Packaged", unit: "ml" },
  { name: "Storia Coconut Water", category: "Packaged", unit: "ml" },
  { name: "Guava Syrup", category: "Beverages", unit: "ml" },
  { name: "Guava juice / guava pulp", category: "Beverages", unit: "ml" },
  { name: "Chilli Powder", category: "Spices", unit: "g" },
  { name: "Red chilli powder", category: "Spices", unit: "g" },
  { name: "Black salt", category: "Spices", unit: "g" },
  { name: "Masala Mix", category: "Beverages", unit: "g" },
  { name: "Jal‑jeera / masala lemonade mix", category: "Beverages", unit: "g" },
  { name: "Mango puree", category: "Beverages", unit: "ml" },
  { name: "Mango Pulp", category: "Beverages", unit: "g" },
  { name: "Spicy mango mix (mango + chilli)", category: "Beverages", unit: "ml" },
  { name: "Cranberry juice", category: "Beverages", unit: "ml" },
  { name: "Watermelon juice", category: "Beverages", unit: "ml" },
  { name: "Green apple juice", category: "Beverages", unit: "ml" },
  { name: "Lemon ice tea mix", category: "Beverages", unit: "g" },
  { name: "Peach ice tea mix", category: "Beverages", unit: "g" },
  { name: "Watermelon ice tea mix", category: "Beverages", unit: "g" },
  { name: "Mojito mint syrup", category: "Beverages", unit: "ml" },
  { name: "Masala lemonade syrup", category: "Beverages", unit: "ml" },
  { name: "Monster Ultra White can", category: "Packaged", unit: "pcs" },
  { name: "Monster Ultra White", category: "Packaged", unit: "pcs" },
  { name: "Monster Ultra Original can", category: "Packaged", unit: "pcs" },
  { name: "Monster Original", category: "Packaged", unit: "pcs" },
  { name: "Monster Ultra Pink can", category: "Packaged", unit: "pcs" },
  { name: "Monster Pink", category: "Packaged", unit: "pcs" },
  { name: "Monster Bad Apple can", category: "Packaged", unit: "pcs" },
  { name: "Monster Rio Punch can", category: "Packaged", unit: "pcs" },
  { name: "Monster White Pineapple can", category: "Packaged", unit: "pcs" },
  { name: "Redbull 250 ml can", category: "Packaged", unit: "pcs" },
  { name: "Redbull 250ml", category: "Packaged", unit: "ml" },
  { name: "Sandwich bread loaf", category: "Bakery", unit: "pcs" },
  { name: "Sandwich bread", category: "Bakery", unit: "pcs" },
  { name: "Burger buns", category: "Bakery", unit: "pcs" },
  { name: "Burger bun", category: "Bakery", unit: "pcs" },
  { name: "Paneer blocks", category: "Dairy", unit: "g" },
  { name: "Cheese slices (processed cheese)", category: "Dairy", unit: "pcs" },
  { name: "Mozzarella cheese", category: "Dairy", unit: "g" },
  { name: "Cheddar cheese", category: "Dairy", unit: "g" },
  { name: "Bread rolls / sub roll (for melts)", category: "Bakery", unit: "pcs" },
  { name: "Lettuce", category: "Vegetables", unit: "g" },
  { name: "Tomato", category: "Vegetables", unit: "g" },
  { name: "Cucumber", category: "Vegetables", unit: "g" },
  { name: "Onion", category: "Vegetables", unit: "g" },
  { name: "Onions", category: "Vegetables", unit: "g" },
  { name: "Capsicum", category: "Vegetables", unit: "g" },
  { name: "Bell peppers (capsicum)", category: "Vegetables", unit: "g" },
  { name: "Cabbage", category: "Vegetables", unit: "g" },
  { name: "Carrot", category: "Vegetables", unit: "g" },
  { name: "Corn kernels", category: "Vegetables", unit: "g" },
  { name: "Olives", category: "Vegetables", unit: "g" },
  { name: "Jalapeños", category: "Vegetables", unit: "g" },
  { name: "Mushrooms", category: "Vegetables", unit: "g" },
  { name: "Vegetable patties (veg burger patty)", category: "Vegetables", unit: "pcs" },
  { name: "Veg burger patty", category: "Vegetables", unit: "pcs" },
  { name: "Paneer Patty", category: "Dairy", unit: "pcs" },
  { name: "Aloo patty", category: "Vegetables", unit: "pcs" },
  { name: "Burger Sauce", category: "Sauces", unit: "g" },
  { name: "Paneer tikka cubes/marination", category: "Dairy", unit: "g" },
  { name: "Cheese slices", category: "Dairy", unit: "pcs" },
  { name: "Sweet Corn", category: "Vegetables", unit: "g" },
  { name: "Sandwich Sauce", category: "Sauces", unit: "g" },
  { name: "Tikka Sauce", category: "Sauces", unit: "g" },
  { name: "Green Chutney", category: "Sauces", unit: "g" },
  { name: "Seasoning Mix", category: "Spices", unit: "g" },
  { name: "Mayonnaise", category: "Sauces", unit: "ml" },
  { name: "Tomato ketchup", category: "Sauces", unit: "ml" },
  { name: "Mustard sauce", category: "Sauces", unit: "ml" },
  { name: "BBQ sauce", category: "Sauces", unit: "ml" },
  { name: "Peri Peri Seasoning", category: "Spices", unit: "g" },
  { name: "Spiced aloo patty", category: "Vegetables", unit: "pcs" },
  { name: "Penne / pasta shells", category: "Grains", unit: "g" },
  { name: "Red sauce (tomato basil sauce)", category: "Sauces", unit: "ml" },
  { name: "Red sauce", category: "Sauces", unit: "ml" },
  { name: "White sauce (béchamel mix)", category: "Sauces", unit: "ml" },
  { name: "White sauce", category: "Sauces", unit: "ml" },
  { name: "Pink sauce mix (tomato + cream)", category: "Sauces", unit: "ml" },
  { name: "Pink sauce", category: "Sauces", unit: "ml" },
  { name: "Cooking Oil", category: "Pantry", unit: "ml" },
  { name: "Olive oil", category: "Pantry", unit: "ml" },
  { name: "Butter", category: "Dairy", unit: "g" },
  { name: "Garlic cloves", category: "Vegetables", unit: "g" },
  { name: "Wheat flour (for sauces)", category: "Grains", unit: "g" },
  { name: "Fresh Cream", category: "Dairy", unit: "ml" },
  { name: "Milk cream", category: "Dairy", unit: "ml" },
  { name: "Cheese (Parmesan, mozzarella)", category: "Dairy", unit: "g" },
  { name: "Hakka noodles", category: "Grains", unit: "g" },
  { name: "Schezwan sauce", category: "Sauces", unit: "ml" },
  { name: "Soy sauce", category: "Sauces", unit: "ml" },
  { name: "Vinegar", category: "Sauces", unit: "ml" },
  { name: "Maggi noodles", category: "Grains", unit: "g" },
  { name: "Maggi masala", category: "Spices", unit: "g" },
  { name: "Extra cheese add‑on mix", category: "Dairy", unit: "g" },
  { name: "Maggi Noodles Packet", category: "Grains", unit: "pcs" },
  { name: "Maggi Masala Packet", category: "Spices", unit: "pcs" },
  { name: "Tandoori Sauce", category: "Sauces", unit: "g" },
  { name: "Tandoori masala mix", category: "Spices", unit: "g" },
  { name: "Potatoes (for fries)", category: "Vegetables", unit: "g" },
  { name: "Frozen french fries", category: "Frozen", unit: "g" },
  { name: "Potato Bites", category: "Frozen", unit: "g" },
  { name: "Vegetable oil (for frying)", category: "Pantry", unit: "ml" },
  { name: "Peri‑peri seasoning", category: "Spices", unit: "g" },
  { name: "Peri peri masala", category: "Spices", unit: "g" },
  { name: "French fries seasoning (peri‑peri / chilli)", category: "Spices", unit: "g" },
  { name: "Honey chilli glaze", category: "Sauces", unit: "ml" },
  { name: "Honey chilli sauce", category: "Sauces", unit: "ml" },
  { name: "Chilli Sauce", category: "Sauces", unit: "ml" },
  { name: "Sesame Seeds", category: "Spices", unit: "g" },
  { name: "Garlic bread loaf", category: "Bakery", unit: "pcs" },
  { name: "Garlic bread", category: "Bakery", unit: "pcs" },
  { name: "Garlic Bread Base", category: "Bakery", unit: "pcs" },
  { name: "Garlic butter", category: "Dairy", unit: "g" },
  { name: "Corn kernels (for stuffed garlic bread)", category: "Vegetables", unit: "g" },
  { name: "Corn", category: "Vegetables", unit: "g" },
  { name: "Jalapeños", category: "Vegetables", unit: "g" },
  { name: "Jalapeno", category: "Vegetables", unit: "g" },
  { name: "Cheese Sauce", category: "Dairy", unit: "ml" },
  { name: "Cheese Spread", category: "Dairy", unit: "ml" },
  { name: "Bread crumbs", category: "Bakery", unit: "g" },
  { name: "Frozen momos wrappers", category: "Frozen", unit: "pcs" },
  { name: "Momos", category: "Frozen", unit: "pcs" },
  { name: "Veg momo filling (veg & spices mix)", category: "Vegetables", unit: "g" },
  { name: "Kurkure crumbs / panko crumbs (for crispy momos)", category: "Bakery", unit: "g" },
  { name: "Momos chutney", category: "Sauces", unit: "ml" },
  { name: "Gravy sauce for momos", category: "Sauces", unit: "ml" },
  { name: "Pizza dough / base", category: "Bakery", unit: "g" },
  { name: "Pizza base", category: "Bakery", unit: "g" },
  { name: "Pizza Base Piece", category: "Bakery", unit: "pcs" },
  { name: "Pizza sauce", category: "Sauces", unit: "ml" },
  { name: "Mozzarella cheese", category: "Dairy", unit: "g" },
  { name: "Pizza seasoning", category: "Spices", unit: "g" },
  { name: "Oregano", category: "Spices", unit: "g" },
  { name: "Chilli flakes", category: "Spices", unit: "g" },
  { name: "Paneer tikka topping", category: "Dairy", unit: "g" },
  { name: "Mixed pizza vegetables", category: "Vegetables", unit: "g" },
  { name: "Mixed veggies (bell pepper, onion, tomato, corn)", category: "Vegetables", unit: "g" },
  { name: "Red Velvet Lava Cake", category: "Dessert", unit: "pcs" },
  { name: "Choco Lava Cake", category: "Dessert", unit: "pcs" },
  { name: "Chocolate Sauce", category: "Sauces", unit: "ml" },
  { name: "Red velvet cake mix", category: "Bakery", unit: "g" },
  { name: "Chocolate cake mix", category: "Bakery", unit: "g" },
  { name: "Chocolate chips / chunks", category: "Bakery", unit: "g" },
  { name: "Vanilla ice cream (for sizzling brownie)", category: "Dairy", unit: "g" },
  { name: "Brownie base (pre‑baked)", category: "Bakery", unit: "g" },
  { name: "Ice cream cups", category: "Frozen", unit: "pcs" },
  { name: "Water Bottle", category: "Packaged", unit: "pcs" },
  { name: "Big Advance", category: "Packaged", unit: "pcs" },
  { name: "Big Gold Flake", category: "Packaged", unit: "pcs" },
  { name: "Connect", category: "Packaged", unit: "pcs" },
  { name: "Ultra Mild", category: "Packaged", unit: "pcs" },
  { name: "Mild Classic", category: "Packaged", unit: "pcs" },
  { name: "Fine Touch", category: "Packaged", unit: "pcs" },
  { name: "Marlboro Red", category: "Packaged", unit: "pcs" },
  { name: "Double Brust", category: "Packaged", unit: "pcs" },
  { name: "Ice Brust", category: "Packaged", unit: "pcs" },
  { name: "Classic Regular", category: "Packaged", unit: "pcs" }
];

function normalizeInventoryName(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const existingInventoryNames = new Set(existingRawMaterials.map((item) => normalizeInventoryName(item.name)));
const seenNewInventoryNames = new Set();
const newInventoryItems = baseInventoryItems
  .filter((item) => {
    const normalizedName = normalizeInventoryName(item.name);
    if (existingInventoryNames.has(normalizedName) || seenNewInventoryNames.has(normalizedName)) {
      return false;
    }
    seenNewInventoryNames.add(normalizedName);
    return true;
  })
  .map((item, index) => ({
    id: `${String(item.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `inventory-${index + 1}`}`,
    name: item.name,
    category: item.category,
    unit: item.unit,
    stock: 0,
    minStock: 0,
    costPerUnit: 0,
    active: true
  }));

export const rawMaterials = [...existingRawMaterials, ...newInventoryItems];

function normalizeRecipeName(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findRawMaterial(name) {
  return rawMaterials.find((item) => {
    const normalizedItemId = normalizeRecipeName(item.id);
    const normalizedItemName = normalizeRecipeName(item.name);
    const normalizedCandidate = normalizeRecipeName(name);
    return normalizedItemId === normalizedCandidate || normalizedItemName === normalizedCandidate;
  });
}

function createRecipe(itemId, ingredients) {
  return {
    id: itemId,
    itemId,
    ingredients: ingredients
      .map((ingredient) => {
        const material = findRawMaterial(ingredient.name);
        if (!material) return null;
        return {
          rawMaterialId: material.id,
          amount: Number(ingredient.amount || 0),
          unit: String(material.unit || ingredient.unit || "pcs").trim()
        };
      })
      .filter(Boolean)
  };
}

const recipeSeedEntries = [
  createRecipe("infusion-signature-ice-tea", [
    { name: "Tea Concentrate", amount: 120, unit: "ml" },
    { name: "Sugar Syrup", amount: 20, unit: "ml" },
    { name: "Lemon Juice", amount: 10, unit: "ml" },
    { name: "Ice Cubes", amount: 120, unit: "g" },
    { name: "Mint Leaves", amount: 2, unit: "g" }
  ]),
  createRecipe("watermelon-ice-tea", [
    { name: "Tea Concentrate", amount: 100, unit: "ml" },
    { name: "Watermelon Syrup", amount: 30, unit: "ml" },
    { name: "Lemon Juice", amount: 8, unit: "ml" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Ice Cubes", amount: 120, unit: "g" },
    { name: "Mint Leaves", amount: 2, unit: "g" }
  ]),
  createRecipe("peach-ice-tea", [
    { name: "Tea Concentrate", amount: 100, unit: "ml" },
    { name: "Peach Syrup", amount: 30, unit: "ml" },
    { name: "Lemon Juice", amount: 8, unit: "ml" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Ice Cubes", amount: 120, unit: "g" },
    { name: "Mint Leaves", amount: 2, unit: "g" }
  ]),
  createRecipe("lemon-ice-tea", [
    { name: "Tea Concentrate", amount: 110, unit: "ml" },
    { name: "Lemon Juice", amount: 15, unit: "ml" },
    { name: "Sugar Syrup", amount: 20, unit: "ml" },
    { name: "Ice Cubes", amount: 120, unit: "g" },
    { name: "Mint Leaves", amount: 2, unit: "g" }
  ]),
  createRecipe("infusion-heritage-cold-coffee", [
    { name: "Chilled Milk", amount: 220, unit: "ml" },
    { name: "Coffee Powder", amount: 5, unit: "g" },
    { name: "Sugar Syrup", amount: 20, unit: "ml" },
    { name: "Vanilla Ice Cream", amount: 60, unit: "g" },
    { name: "Chocolate Syrup", amount: 15, unit: "ml" },
    { name: "Ice Cubes", amount: 80, unit: "g" }
  ]),
  createRecipe("hazelnut-cold-coffee", [
    { name: "Chilled Milk", amount: 220, unit: "ml" },
    { name: "Coffee Powder", amount: 5, unit: "g" },
    { name: "Sugar Syrup", amount: 15, unit: "ml" },
    { name: "Hazelnut Syrup", amount: 25, unit: "ml" },
    { name: "Vanilla Ice Cream", amount: 40, unit: "g" },
    { name: "Ice Cubes", amount: 80, unit: "g" }
  ]),
  createRecipe("caramel-cold-coffee", [
    { name: "Chilled Milk", amount: 220, unit: "ml" },
    { name: "Coffee Powder", amount: 5, unit: "g" },
    { name: "Sugar Syrup", amount: 15, unit: "ml" },
    { name: "Caramel Syrup", amount: 25, unit: "ml" },
    { name: "Vanilla Ice Cream", amount: 30, unit: "g" },
    { name: "Ice Cubes", amount: 80, unit: "g" }
  ]),
  createRecipe("mocha-cold-coffee", [
    { name: "Chilled Milk", amount: 220, unit: "ml" },
    { name: "Coffee Powder", amount: 5, unit: "g" },
    { name: "Sugar Syrup", amount: 15, unit: "ml" },
    { name: "Chocolate Syrup", amount: 25, unit: "ml" },
    { name: "Cocoa Powder", amount: 5, unit: "g" },
    { name: "Vanilla Ice Cream", amount: 30, unit: "g" },
    { name: "Ice Cubes", amount: 80, unit: "g" }
  ]),
  createRecipe("chocolate-cold-coffee", [
    { name: "Chilled Milk", amount: 220, unit: "ml" },
    { name: "Coffee Powder", amount: 4, unit: "g" },
    { name: "Sugar Syrup", amount: 15, unit: "ml" },
    { name: "Chocolate Syrup", amount: 30, unit: "ml" },
    { name: "Ice Cubes", amount: 80, unit: "g" }
  ]),
  createRecipe("signature-coffee", [
    { name: "Chilled Milk", amount: 220, unit: "ml" },
    { name: "Coffee Powder", amount: 4, unit: "g" },
    { name: "Sugar Syrup", amount: 20, unit: "ml" },
    { name: "Ice Cubes", amount: 80, unit: "g" }
  ]),
  createRecipe("guava-chilli-mojito", [
    { name: "Guava Syrup", amount: 35, unit: "ml" },
    { name: "Lemon Juice", amount: 15, unit: "ml" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Soda", amount: 180, unit: "ml" },
    { name: "Ice Cubes", amount: 120, unit: "g" },
    { name: "Mint Leaves", amount: 3, unit: "g" },
    { name: "Chilli Powder", amount: 1, unit: "g" },
    { name: "Black Salt", amount: 1, unit: "g" }
  ]),
  createRecipe("masala-lemonade-mojito", [
    { name: "Lemon Juice", amount: 25, unit: "ml" },
    { name: "Sugar Syrup", amount: 20, unit: "ml" },
    { name: "Soda", amount: 180, unit: "ml" },
    { name: "Ice Cubes", amount: 120, unit: "g" },
    { name: "Mint Leaves", amount: 3, unit: "g" },
    { name: "Masala Mix", amount: 2, unit: "g" },
    { name: "Black Salt", amount: 1, unit: "g" }
  ]),
  createRecipe("spicy-mango-mojito", [
    { name: "Mango Syrup", amount: 35, unit: "ml" },
    { name: "Lemon Juice", amount: 15, unit: "ml" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Soda", amount: 180, unit: "ml" },
    { name: "Ice Cubes", amount: 120, unit: "g" },
    { name: "Mint Leaves", amount: 3, unit: "g" },
    { name: "Chilli Powder", amount: 1, unit: "g" },
    { name: "Black Salt", amount: 1, unit: "g" }
  ]),
  createRecipe("green-apple-mojito", [
    { name: "Green Apple Syrup", amount: 35, unit: "ml" },
    { name: "Lemon Juice", amount: 15, unit: "ml" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Soda", amount: 180, unit: "ml" },
    { name: "Ice Cubes", amount: 120, unit: "g" },
    { name: "Mint Leaves", amount: 3, unit: "g" }
  ]),
  createRecipe("watermelon-mojito", [
    { name: "Watermelon Syrup", amount: 35, unit: "ml" },
    { name: "Lemon Juice", amount: 15, unit: "ml" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Soda", amount: 180, unit: "ml" },
    { name: "Ice Cubes", amount: 120, unit: "g" },
    { name: "Mint Leaves", amount: 3, unit: "g" }
  ]),
  createRecipe("cranberry-mojito", [
    { name: "Cranberry Syrup", amount: 35, unit: "ml" },
    { name: "Lemon Juice", amount: 15, unit: "ml" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Soda", amount: 180, unit: "ml" },
    { name: "Ice Cubes", amount: 120, unit: "g" },
    { name: "Mint Leaves", amount: 3, unit: "g" }
  ]),
  createRecipe("blue-curacao-mojito", [
    { name: "Blue Curacao Syrup", amount: 30, unit: "ml" },
    { name: "Lemon Juice", amount: 15, unit: "ml" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Soda", amount: 180, unit: "ml" },
    { name: "Ice Cubes", amount: 120, unit: "g" },
    { name: "Mint Leaves", amount: 3, unit: "g" }
  ]),
  createRecipe("lime-mint-mojito", [
    { name: "Lemon Juice", amount: 25, unit: "ml" },
    { name: "Sugar Syrup", amount: 20, unit: "ml" },
    { name: "Soda", amount: 180, unit: "ml" },
    { name: "Ice Cubes", amount: 120, unit: "g" },
    { name: "Mint Leaves", amount: 5, unit: "g" }
  ]),
  createRecipe("watermelon-slush", [
    { name: "Watermelon Syrup", amount: 40, unit: "ml" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Ice Cubes", amount: 220, unit: "g" },
    { name: "Water", amount: 80, unit: "ml" }
  ]),
  createRecipe("green-apple-slush", [
    { name: "Green Apple Syrup", amount: 40, unit: "ml" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Ice Cubes", amount: 220, unit: "g" },
    { name: "Water", amount: 80, unit: "ml" }
  ]),
  createRecipe("cranberry-slush", [
    { name: "Cranberry Syrup", amount: 40, unit: "ml" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Ice Cubes", amount: 220, unit: "g" },
    { name: "Water", amount: 80, unit: "ml" }
  ]),
  createRecipe("kala-khatta-slush", [
    { name: "Kala Khatta Syrup", amount: 40, unit: "ml" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Ice Cubes", amount: 220, unit: "g" },
    { name: "Water", amount: 80, unit: "ml" }
  ]),
  createRecipe("strawberry-slush", [
    { name: "Strawberry Syrup", amount: 40, unit: "ml" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Ice Cubes", amount: 220, unit: "g" },
    { name: "Water", amount: 80, unit: "ml" }
  ]),
  createRecipe("kunafa-shake", [
    { name: "Chilled Milk", amount: 220, unit: "ml" },
    { name: "Vanilla Ice Cream", amount: 80, unit: "g" },
    { name: "Kunafa mix", amount: 40, unit: "g" },
    { name: "Pistachio Crushed", amount: 10, unit: "g" },
    { name: "Sugar Syrup", amount: 15, unit: "ml" },
    { name: "Ice Cubes", amount: 50, unit: "g" }
  ]),
  createRecipe("brownie-shake", [
    { name: "Chilled Milk", amount: 220, unit: "ml" },
    { name: "Vanilla Ice Cream", amount: 70, unit: "g" },
    { name: "Brownies (pieces for shakes)", amount: 50, unit: "g" },
    { name: "Chocolate Syrup", amount: 25, unit: "ml" },
    { name: "Ice Cubes", amount: 50, unit: "g" }
  ]),
  createRecipe("dark-chocolate-shake", [
    { name: "Chilled Milk", amount: 220, unit: "ml" },
    { name: "Chocolate Ice Cream", amount: 70, unit: "g" },
    { name: "Dark Chocolate Compound", amount: 35, unit: "g" },
    { name: "Chocolate Syrup", amount: 20, unit: "ml" },
    { name: "Ice Cubes", amount: 50, unit: "g" }
  ]),
  createRecipe("kit-kat-shake", [
    { name: "Chilled Milk", amount: 220, unit: "ml" },
    { name: "Vanilla Ice Cream", amount: 70, unit: "g" },
    { name: "KitKat Crushed", amount: 35, unit: "g" },
    { name: "Chocolate Syrup", amount: 20, unit: "ml" },
    { name: "Ice Cubes", amount: 50, unit: "g" }
  ]),
  createRecipe("oreo-shake", [
    { name: "Chilled Milk", amount: 220, unit: "ml" },
    { name: "Vanilla Ice Cream", amount: 70, unit: "g" },
    { name: "Oreo cookies (crumbled)", amount: 35, unit: "g" },
    { name: "Chocolate Syrup", amount: 15, unit: "ml" },
    { name: "Ice Cubes", amount: 50, unit: "g" }
  ]),
  createRecipe("butterscotch-shake", [
    { name: "Chilled Milk", amount: 220, unit: "ml" },
    { name: "Butterscotch Ice Cream", amount: 70, unit: "g" },
    { name: "Butterscotch Syrup", amount: 25, unit: "ml" },
    { name: "Ice Cubes", amount: 50, unit: "g" }
  ]),
  createRecipe("mango-shake", [
    { name: "Chilled Milk", amount: 220, unit: "ml" },
    { name: "Vanilla Ice Cream", amount: 60, unit: "g" },
    { name: "Mango Pulp", amount: 50, unit: "g" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Ice Cubes", amount: 50, unit: "g" }
  ]),
  createRecipe("strawberry-shake", [
    { name: "Chilled Milk", amount: 220, unit: "ml" },
    { name: "Vanilla Ice Cream", amount: 60, unit: "g" },
    { name: "Strawberry Syrup", amount: 30, unit: "ml" },
    { name: "Sugar Syrup", amount: 10, unit: "ml" },
    { name: "Ice Cubes", amount: 50, unit: "g" }
  ]),
  createRecipe("infusion-heritage-melt", [
    { name: "Bread Slice", amount: 2, unit: "pcs" },
    { name: "Cheese slices", amount: 1, unit: "pcs" },
    { name: "Mozzarella cheese", amount: 35, unit: "g" },
    { name: "Capsicum", amount: 20, unit: "g" },
    { name: "Onion", amount: 20, unit: "g" },
    { name: "Sweet Corn", amount: 20, unit: "g" },
    { name: "Sandwich Sauce", amount: 25, unit: "g" },
    { name: "Butter", amount: 10, unit: "g" }
  ]),
  createRecipe("paneer-tikka-melt", [
    { name: "Bread Slice", amount: 2, unit: "pcs" },
    { name: "Paneer blocks", amount: 60, unit: "g" },
    { name: "Tikka Sauce", amount: 25, unit: "g" },
    { name: "Onion", amount: 20, unit: "g" },
    { name: "Capsicum", amount: 20, unit: "g" },
    { name: "Mozzarella cheese", amount: 25, unit: "g" },
    { name: "Butter", amount: 10, unit: "g" }
  ]),
  createRecipe("trio-delight-sandwich", [
    { name: "Bread Slice", amount: 2, unit: "pcs" },
    { name: "Tomato", amount: 25, unit: "g" },
    { name: "Cucumber", amount: 25, unit: "g" },
    { name: "Onion", amount: 20, unit: "g" },
    { name: "Cheese slices", amount: 1, unit: "pcs" },
    { name: "Sandwich Sauce", amount: 20, unit: "g" },
    { name: "Butter", amount: 8, unit: "g" }
  ]),
  createRecipe("garden-fresh-sandwich", [
    { name: "Bread Slice", amount: 2, unit: "pcs" },
    { name: "Tomato", amount: 30, unit: "g" },
    { name: "Cucumber", amount: 30, unit: "g" },
    { name: "Onion", amount: 20, unit: "g" },
    { name: "Capsicum", amount: 20, unit: "g" },
    { name: "Green Chutney", amount: 20, unit: "g" },
    { name: "Butter", amount: 8, unit: "g" }
  ]),
  createRecipe("blush-bowl-pasta", [
    { name: "Pasta", amount: 120, unit: "g" },
    { name: "White sauce", amount: 70, unit: "g" },
    { name: "Red sauce", amount: 60, unit: "g" },
    { name: "Mozzarella cheese", amount: 30, unit: "g" },
    { name: "Capsicum", amount: 25, unit: "g" },
    { name: "Onion", amount: 20, unit: "g" },
    { name: "Sweet Corn", amount: 20, unit: "g" },
    { name: "Cooking Oil", amount: 10, unit: "ml" },
    { name: "Seasoning Mix", amount: 3, unit: "g" }
  ]),
  createRecipe("tomato-basil-pasta", [
    { name: "Pasta", amount: 120, unit: "g" },
    { name: "Red sauce", amount: 100, unit: "g" },
    { name: "Mozzarella cheese", amount: 25, unit: "g" },
    { name: "Capsicum", amount: 25, unit: "g" },
    { name: "Onion", amount: 20, unit: "g" },
    { name: "Tomato", amount: 30, unit: "g" },
    { name: "Cooking Oil", amount: 10, unit: "ml" },
    { name: "Seasoning Mix", amount: 3, unit: "g" }
  ]),
  createRecipe("herbed-bechamel-pasta", [
    { name: "Pasta", amount: 120, unit: "g" },
    { name: "White sauce", amount: 110, unit: "g" },
    { name: "Mozzarella cheese", amount: 25, unit: "g" },
    { name: "Capsicum", amount: 25, unit: "g" },
    { name: "Onion", amount: 20, unit: "g" },
    { name: "Sweet Corn", amount: 20, unit: "g" },
    { name: "Cooking Oil", amount: 10, unit: "ml" },
    { name: "Seasoning Mix", amount: 3, unit: "g" }
  ]),
  createRecipe("jalapeno-corn-stuffed-garlic-bread", [
    { name: "Garlic Bread Base", amount: 1, unit: "pcs" },
    { name: "Mozzarella cheese", amount: 60, unit: "g" },
    { name: "Sweet Corn", amount: 35, unit: "g" },
    { name: "Jalapeno", amount: 20, unit: "g" },
    { name: "Garlic butter", amount: 25, unit: "g" },
    { name: "Seasoning Mix", amount: 3, unit: "g" }
  ]),
  createRecipe("cheesy-melt-garlic-bread", [
    { name: "Garlic Bread Base", amount: 1, unit: "pcs" },
    { name: "Mozzarella cheese", amount: 70, unit: "g" },
    { name: "Garlic butter", amount: 25, unit: "g" },
    { name: "Cheese Sauce", amount: 25, unit: "g" },
    { name: "Seasoning Mix", amount: 3, unit: "g" }
  ]),
  createRecipe("pure-garlic-bread", [
    { name: "Garlic Bread Base", amount: 1, unit: "pcs" },
    { name: "Garlic butter", amount: 35, unit: "g" },
    { name: "Seasoning Mix", amount: 3, unit: "g" }
  ]),
  createRecipe("infusion-velvet-cheese-fries", [
    { name: "Frozen french fries", amount: 180, unit: "g" },
    { name: "Cheese Sauce", amount: 60, unit: "g" },
    { name: "Mozzarella cheese", amount: 35, unit: "g" },
    { name: "Seasoning Mix", amount: 3, unit: "g" },
    { name: "Cooking Oil", amount: 15, unit: "ml" }
  ]),
  createRecipe("honey-chilli-glazed-potato", [
    { name: "Potato Bites", amount: 180, unit: "g" },
    { name: "Honey chilli sauce", amount: 60, unit: "g" },
    { name: "Capsicum", amount: 25, unit: "g" },
    { name: "Onion", amount: 25, unit: "g" },
    { name: "Sesame Seeds", amount: 3, unit: "g" },
    { name: "Cooking Oil", amount: 15, unit: "ml" }
  ]),
  createRecipe("chilli-blaze-potato", [
    { name: "Potato Bites", amount: 180, unit: "g" },
    { name: "Chilli Sauce", amount: 55, unit: "g" },
    { name: "Capsicum", amount: 25, unit: "g" },
    { name: "Onion", amount: 25, unit: "g" },
    { name: "Cooking Oil", amount: 15, unit: "ml" }
  ]),
  createRecipe("fiery-peri-peri-fries", [
    { name: "Frozen french fries", amount: 180, unit: "g" },
    { name: "Peri peri masala", amount: 8, unit: "g" },
    { name: "Cooking Oil", amount: 15, unit: "ml" }
  ]),
  createRecipe("golden-crisp-fries", [
    { name: "Frozen french fries", amount: 180, unit: "g" },
    { name: "Salt", amount: 2, unit: "g" },
    { name: "Cooking Oil", amount: 15, unit: "ml" }
  ]),
  createRecipe("infusion-loaded-stack", [
    { name: "Burger bun", amount: 1, unit: "pcs" },
    { name: "Veg burger patty", amount: 1, unit: "pcs" },
    { name: "Cheese slices", amount: 1, unit: "pcs" },
    { name: "Mozzarella cheese", amount: 30, unit: "g" },
    { name: "Lettuce", amount: 15, unit: "g" },
    { name: "Onion", amount: 20, unit: "g" },
    { name: "Tomato", amount: 25, unit: "g" },
    { name: "Burger Sauce", amount: 30, unit: "g" },
    { name: "Butter", amount: 8, unit: "g" }
  ]),
  createRecipe("paneer-bliss-burger", [
    { name: "Burger bun", amount: 1, unit: "pcs" },
    { name: "Paneer Patty", amount: 1, unit: "pcs" },
    { name: "Cheese slices", amount: 1, unit: "pcs" },
    { name: "Lettuce", amount: 15, unit: "g" },
    { name: "Onion", amount: 20, unit: "g" },
    { name: "Tomato", amount: 25, unit: "g" },
    { name: "Burger Sauce", amount: 25, unit: "g" },
    { name: "Butter", amount: 8, unit: "g" }
  ]),
  createRecipe("cheese-indulgence-burger", [
    { name: "Burger bun", amount: 1, unit: "pcs" },
    { name: "Veg burger patty", amount: 1, unit: "pcs" },
    { name: "Cheese slices", amount: 2, unit: "pcs" },
    { name: "Cheese Sauce", amount: 30, unit: "g" },
    { name: "Burger Sauce", amount: 20, unit: "g" },
    { name: "Butter", amount: 8, unit: "g" }
  ]),
  createRecipe("veg-essence-burger", [
    { name: "Burger bun", amount: 1, unit: "pcs" },
    { name: "Veg burger patty", amount: 1, unit: "pcs" },
    { name: "Lettuce", amount: 15, unit: "g" },
    { name: "Onion", amount: 20, unit: "g" },
    { name: "Tomato", amount: 25, unit: "g" },
    { name: "Burger Sauce", amount: 20, unit: "g" },
    { name: "Butter", amount: 8, unit: "g" }
  ]),
  createRecipe("spiced-aloo-burger", [
    { name: "Aloo patty", amount: 1, unit: "pcs" },
    { name: "Burger bun", amount: 1, unit: "pcs" },
    { name: "Onion", amount: 20, unit: "g" },
    { name: "Tomato", amount: 20, unit: "g" },
    { name: "Burger Sauce", amount: 18, unit: "g" },
    { name: "Butter", amount: 8, unit: "g" }
  ]),
  createRecipe("infusion-wok-hakka", [
    { name: "Noodles", amount: 130, unit: "g" },
    { name: "Cabbage", amount: 35, unit: "g" },
    { name: "Capsicum", amount: 25, unit: "g" },
    { name: "Carrot", amount: 25, unit: "g" },
    { name: "Onion", amount: 25, unit: "g" },
    { name: "Soy sauce", amount: 15, unit: "ml" },
    { name: "Chilli Sauce", amount: 15, unit: "ml" },
    { name: "Vinegar", amount: 8, unit: "ml" },
    { name: "Cooking Oil", amount: 15, unit: "ml" },
    { name: "Seasoning Mix", amount: 3, unit: "g" }
  ]),
  createRecipe("schezwan-blaze-noodles", [
    { name: "Noodles", amount: 130, unit: "g" },
    { name: "Cabbage", amount: 35, unit: "g" },
    { name: "Capsicum", amount: 25, unit: "g" },
    { name: "Carrot", amount: 25, unit: "g" },
    { name: "Onion", amount: 25, unit: "g" },
    { name: "Schezwan sauce", amount: 35, unit: "g" },
    { name: "Soy sauce", amount: 10, unit: "ml" },
    { name: "Cooking Oil", amount: 15, unit: "ml" }
  ]),
  createRecipe("garlic-essence-noodles", [
    { name: "Noodles", amount: 130, unit: "g" },
    { name: "Garlic", amount: 12, unit: "g" },
    { name: "Cabbage", amount: 35, unit: "g" },
    { name: "Capsicum", amount: 25, unit: "g" },
    { name: "Onion", amount: 25, unit: "g" },
    { name: "Soy sauce", amount: 12, unit: "ml" },
    { name: "Cooking Oil", amount: 15, unit: "ml" },
    { name: "Seasoning Mix", amount: 3, unit: "g" }
  ]),
  createRecipe("harvest-veg-noodles", [
    { name: "Noodles", amount: 120, unit: "g" },
    { name: "Cabbage", amount: 40, unit: "g" },
    { name: "Capsicum", amount: 25, unit: "g" },
    { name: "Carrot", amount: 25, unit: "g" },
    { name: "Onion", amount: 25, unit: "g" },
    { name: "Soy sauce", amount: 10, unit: "ml" },
    { name: "Chilli Sauce", amount: 10, unit: "ml" },
    { name: "Cooking Oil", amount: 12, unit: "ml" }
  ]),
  createRecipe("infusion-maxxed-maggi", [
    { name: "Maggi Noodles Packet", amount: 1, unit: "pcs" },
    { name: "Maggi Masala Packet", amount: 1, unit: "pcs" },
    { name: "Mozzarella cheese", amount: 35, unit: "g" },
    { name: "Sweet Corn", amount: 25, unit: "g" },
    { name: "Capsicum", amount: 25, unit: "g" },
    { name: "Onion", amount: 25, unit: "g" },
    { name: "Butter", amount: 10, unit: "g" }
  ]),
  createRecipe("cheese-luxe-maggi", [
    { name: "Maggi Noodles Packet", amount: 1, unit: "pcs" },
    { name: "Maggi Masala Packet", amount: 1, unit: "pcs" },
    { name: "Mozzarella cheese", amount: 45, unit: "g" },
    { name: "Cheese Sauce", amount: 25, unit: "g" },
    { name: "Butter", amount: 10, unit: "g" }
  ]),
  createRecipe("tandoori-twist-maggi", [
    { name: "Maggi Noodles Packet", amount: 1, unit: "pcs" },
    { name: "Maggi Masala Packet", amount: 1, unit: "pcs" },
    { name: "Tandoori Sauce", amount: 30, unit: "g" },
    { name: "Onion", amount: 25, unit: "g" },
    { name: "Capsicum", amount: 25, unit: "g" },
    { name: "Butter", amount: 10, unit: "g" }
  ]),
  createRecipe("veggie-comfort-maggi", [
    { name: "Maggi Noodles Packet", amount: 1, unit: "pcs" },
    { name: "Maggi Masala Packet", amount: 1, unit: "pcs" },
    { name: "Onion", amount: 25, unit: "g" },
    { name: "Capsicum", amount: 25, unit: "g" },
    { name: "Carrot", amount: 20, unit: "g" },
    { name: "Butter", amount: 8, unit: "g" }
  ]),
  createRecipe("just-maggi", [
    { name: "Maggi Noodles Packet", amount: 1, unit: "pcs" },
    { name: "Maggi Masala Packet", amount: 1, unit: "pcs" },
    { name: "Butter", amount: 5, unit: "g" }
  ]),
  createRecipe("paneer-tikka-supreme", [
    { name: "Pizza Base Piece", amount: 1, unit: "pcs" },
    { name: "Pizza sauce", amount: 60, unit: "g" },
    { name: "Mozzarella cheese", amount: 120, unit: "g" },
    { name: "Paneer blocks", amount: 90, unit: "g" },
    { name: "Tikka Sauce", amount: 35, unit: "g" },
    { name: "Onion", amount: 35, unit: "g" },
    { name: "Capsicum", amount: 35, unit: "g" },
    { name: "Sweet Corn", amount: 25, unit: "g" },
    { name: "Seasoning Mix", amount: 4, unit: "g" }
  ]),
  createRecipe("garden-harvest-pizza", [
    { name: "Pizza Base Piece", amount: 1, unit: "pcs" },
    { name: "Pizza sauce", amount: 60, unit: "g" },
    { name: "Mozzarella cheese", amount: 110, unit: "g" },
    { name: "Onion", amount: 35, unit: "g" },
    { name: "Capsicum", amount: 35, unit: "g" },
    { name: "Tomato", amount: 35, unit: "g" },
    { name: "Sweet Corn", amount: 30, unit: "g" },
    { name: "Jalapeno", amount: 15, unit: "g" },
    { name: "Seasoning Mix", amount: 4, unit: "g" }
  ]),
  createRecipe("margherita-delight", [
    { name: "Pizza Base Piece", amount: 1, unit: "pcs" },
    { name: "Pizza sauce", amount: 60, unit: "g" },
    { name: "Mozzarella cheese", amount: 130, unit: "g" },
    { name: "Seasoning Mix", amount: 4, unit: "g" }
  ]),
  createRecipe("red-velvet-lava-cake", [
    { name: "Red Velvet Lava Cake", amount: 1, unit: "pcs" },
    { name: "Chocolate Sauce", amount: 20, unit: "ml" },
    { name: "Vanilla Ice Cream", amount: 40, unit: "g" }
  ]),
  createRecipe("choco-lava-cake", [
    { name: "Choco Lava Cake", amount: 1, unit: "pcs" },
    { name: "Chocolate Sauce", amount: 20, unit: "ml" },
    { name: "Vanilla Ice Cream", amount: 30, unit: "g" }
  ]),
  createRecipe("sizzling-brownie-with-ice-cream", [
    { name: "Brownies (pieces for shakes)", amount: 80, unit: "g" },
    { name: "Vanilla Ice Cream", amount: 60, unit: "g" },
    { name: "Chocolate Sauce", amount: 35, unit: "ml" },
    { name: "Butter", amount: 5, unit: "g" },
    { name: "Chocolate chips / chunks", amount: 8, unit: "g" }
  ]),
  createRecipe("hot-brownie", [
    { name: "Brownies (pieces for shakes)", amount: 90, unit: "g" },
    { name: "Chocolate Sauce", amount: 30, unit: "ml" },
    { name: "Chocolate chips / chunks", amount: 8, unit: "g" }
  ]),
  createRecipe("kurkure-delight-momos", [
    { name: "Momos", amount: 8, unit: "pcs" },
    { name: "Kurkure crumbs / panko crumbs (for crispy momos)", amount: 40, unit: "g" },
    { name: "Mayonnaise", amount: 35, unit: "g" },
    { name: "Chilli Sauce", amount: 25, unit: "g" },
    { name: "Cooking Oil", amount: 20, unit: "ml" },
    { name: "Seasoning Mix", amount: 3, unit: "g" }
  ]),
  createRecipe("fusion-gravy-momos", [
    { name: "Momos", amount: 8, unit: "pcs" },
    { name: "Gravy sauce for momos", amount: 120, unit: "g" },
    { name: "Onion", amount: 30, unit: "g" },
    { name: "Capsicum", amount: 30, unit: "g" },
    { name: "Chilli Sauce", amount: 25, unit: "g" },
    { name: "Cooking Oil", amount: 15, unit: "ml" },
    { name: "Seasoning Mix", amount: 3, unit: "g" }
  ]),
  createRecipe("golden-crunch-momos", [
    { name: "Momos", amount: 8, unit: "pcs" },
    { name: "Bread crumbs", amount: 40, unit: "g" },
    { name: "Mayonnaise", amount: 30, unit: "g" },
    { name: "Chilli Sauce", amount: 20, unit: "g" },
    { name: "Cooking Oil", amount: 20, unit: "ml" }
  ]),
  createRecipe("storia-coconut-water", [
    { name: "Storia Coconut Water", amount: 1, unit: "pcs" }
  ]),
  createRecipe("strawberry-coolberg", [
    { name: "Coolberg Strawberry", amount: 1, unit: "pcs" }
  ]),
  createRecipe("peach-coolberg", [
    { name: "Coolberg Peach", amount: 1, unit: "pcs" }
  ]),
  createRecipe("cranberry-coolberg", [
    { name: "Coolberg Cranberry", amount: 1, unit: "pcs" }
  ]),
  createRecipe("jugaaro-coolberg", [
    { name: "Coolberg Jugaaro", amount: 1, unit: "pcs" }
  ]),
  createRecipe("ultra-white-monster", [
    { name: "Monster Ultra White", amount: 1, unit: "can" }
  ]),
  createRecipe("ultra-original-monster", [
    { name: "Monster Original", amount: 1, unit: "can" }
  ]),
  createRecipe("ultra-pink-monster", [
    { name: "Monster Pink", amount: 1, unit: "can" }
  ]),
  createRecipe("bad-apple-monster", [
    { name: "Monster Bad Apple can", amount: 1, unit: "can" }
  ]),
  createRecipe("rio-punch-monster", [
    { name: "Monster Rio Punch can", amount: 1, unit: "can" }
  ]),
  createRecipe("white-pineapple-monster", [
    { name: "Monster White Pineapple can", amount: 1, unit: "can" }
  ]),
  createRecipe("redbull-250ml-", [
    { name: "Redbull 250 ml can", amount: 1, unit: "pcs" }
  ]),
  createRecipe("green-tea", [
    { name: "Green tea leaves", amount: 2, unit: "g" },
    { name: "Water", amount: 180, unit: "ml" }
  ]),
  createRecipe("tulsi-tea", [
    { name: "Tulsi tea leaves", amount: 2, unit: "g" },
    { name: "Water", amount: 180, unit: "ml" }
  ]),
  createRecipe("lemon-tea", [
    { name: "Lemon tea blend / powder", amount: 2, unit: "g" },
    { name: "Lemon", amount: 10, unit: "ml" },
    { name: "Water", amount: 180, unit: "ml" },
    { name: "Sugar", amount: 6, unit: "g" }
  ]),
  createRecipe("honey-lemon-tea", [
    { name: "Honey", amount: 12, unit: "g" },
    { name: "Lemon", amount: 10, unit: "ml" },
    { name: "Water", amount: 180, unit: "ml" }
  ])
].filter(Boolean);

const defaultRecipesBase = [
  {
    id: "personal-blend-chai",
    itemId: "personal-blend-chai",
    ingredients: [
      { rawMaterialId: "tea-leaves", amount: 4, unit: "g" },
      { rawMaterialId: "milk", amount: 120, unit: "ml" },
      { rawMaterialId: "water", amount: 60, unit: "ml" },
      { rawMaterialId: "sugar", amount: 8, unit: "g" }
    ]
  },
  {
    id: "black-tea",
    itemId: "black-tea",
    ingredients: [
      { rawMaterialId: "tea-leaves", amount: 3, unit: "g" },
      { rawMaterialId: "water", amount: 180, unit: "ml" },
      { rawMaterialId: "sugar", amount: 6, unit: "g" }
    ]
  },
  {
    id: "signature-infusion-chai",
    itemId: "signature-infusion-chai",
    ingredients: [
      { rawMaterialId: "tea-leaves", amount: 3, unit: "g" },
      { rawMaterialId: "milk", amount: 100, unit: "ml" },
      { rawMaterialId: "water", amount: 60, unit: "ml" },
      { rawMaterialId: "sugar", amount: 7, unit: "g" }
    ]
  },
  {
    id: "infusion-heritage-coffee",
    itemId: "infusion-heritage-coffee",
    ingredients: [
      { rawMaterialId: "coffee-powder", amount: 6, unit: "g" },
      { rawMaterialId: "milk", amount: 150, unit: "ml" },
      { rawMaterialId: "sugar", amount: 8, unit: "g" }
    ]
  },
  {
    id: "hot-chocolate",
    itemId: "hot-chocolate",
    ingredients: [
      { rawMaterialId: "milk", amount: 160, unit: "ml" },
      { rawMaterialId: "cocoa-powder", amount: 18, unit: "g" },
      { rawMaterialId: "sugar", amount: 6, unit: "g" }
    ]
  },
  {
    id: "core-coffee",
    itemId: "core-coffee",
    ingredients: [
      { rawMaterialId: "coffee-powder", amount: 5, unit: "g" },
      { rawMaterialId: "milk", amount: 140, unit: "ml" },
      { rawMaterialId: "sugar", amount: 7, unit: "g" }
    ]
  },
  {
    id: "black-coffee",
    itemId: "black-coffee",
    ingredients: [
      { rawMaterialId: "coffee-powder", amount: 4, unit: "g" },
      { rawMaterialId: "water", amount: 180, unit: "ml" },
      { rawMaterialId: "sugar", amount: 5, unit: "g" }
    ]
  }
];

const existingRecipeIds = new Set(defaultRecipesBase.map((recipe) => recipe.itemId));
const missingRecipeEntries = recipeSeedEntries.filter((recipe) => !existingRecipeIds.has(recipe.itemId));

export const defaultRecipes = [...defaultRecipesBase, ...missingRecipeEntries];
