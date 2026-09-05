import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read persisted-store.json
const storePath = join(__dirname, 'src', 'persisted-store.json');

async function checkItems() {
  try {
    console.log('Reading persisted-store.json...\n');
    const data = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    
    const rawMaterials = data.rawMaterials || [];
    
    // Fetch Sugar
    console.log('=== SUGAR ===');
    const sugar = rawMaterials.find(item => item.name === 'Sugar');
    if (sugar) {
      console.log('Raw document:');
      console.log(JSON.stringify(sugar, null, 2));
      console.log(`\nKey fields: stock=${sugar.stock}, unit=${sugar.unit}, displayUnit=${sugar.displayUnit}, costPerUnit=${sugar.costPerUnit}, minStock=${sugar.minStock}`);
      if (sugar.stock && sugar.costPerUnit) {
        const totalValue = sugar.stock * sugar.costPerUnit;
        console.log(`Calculated total value: ${sugar.stock} * ${sugar.costPerUnit} = ₹${totalValue.toFixed(2)}`);
      }
    } else {
      console.log('Sugar not found');
    }

    // Fetch Bread
    console.log('\n=== BREAD ===');
    const bread = rawMaterials.find(item => item.name === 'Bread');
    if (bread) {
      console.log('Raw document:');
      console.log(JSON.stringify(bread, null, 2));
      console.log(`\nKey fields: stock=${bread.stock}, unit=${bread.unit}, displayUnit=${bread.displayUnit}, costPerUnit=${bread.costPerUnit}, minStock=${bread.minStock}`);
      if (bread.stock && bread.costPerUnit) {
        const totalValue = bread.stock * bread.costPerUnit;
        console.log(`Calculated total value: ${bread.stock} * ${bread.costPerUnit} = ₹${totalValue.toFixed(2)}`);
      }
    } else {
      console.log('Bread not found');
    }

    // Fetch Paneer
    console.log('\n=== PANEER ===');
    const paneer = rawMaterials.find(item => item.name === 'Paneer');
    if (paneer) {
      console.log('Raw document:');
      console.log(JSON.stringify(paneer, null, 2));
      console.log(`\nKey fields: stock=${paneer.stock}, unit=${paneer.unit}, displayUnit=${paneer.displayUnit}, costPerUnit=${paneer.costPerUnit}, minStock=${paneer.minStock}`);
      if (paneer.stock && paneer.costPerUnit) {
        const totalValue = paneer.stock * paneer.costPerUnit;
        console.log(`Calculated total value: ${paneer.stock} * ${paneer.costPerUnit} = ₹${totalValue.toFixed(2)}`);
      }
    } else {
      console.log('Paneer not found');
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkItems();
