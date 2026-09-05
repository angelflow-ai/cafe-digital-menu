import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not set.');
}

await mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000
});

console.log('Fetching Milk and Sugar raw materials for Near-SKIT outlet...\n');

const nearSkitOutletId = '6a5cadad7aed56a342c4ea44';

const documents = await mongoose.connection.db
  .collection('rawmaterials')
  .find({ 
    name: { $in: ['Milk', 'Sugar'] },
    outletId: nearSkitOutletId
  })
  .project({
    name: 1,
    unit: 1,
    displayUnit: 1,
    stock: 1,
    costPerUnit: 1,
    outletId: 1
  })
  .toArray();

console.log(JSON.stringify(documents, null, 2));
await mongoose.disconnect();
