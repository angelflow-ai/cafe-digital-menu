import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase, MenuItem } from '../src/db.js';

async function main() {
  console.log('Connecting to database...');
  await connectDatabase();

  const regex = /^\s*test chai\s*$/i;
  const docs = await MenuItem.find({ name: { $regex: regex } }).lean();

  console.log(`FOUND ${docs.length} DOCUMENT(S)`);
  for (const doc of docs) {
    console.log(JSON.stringify({
      _id: String(doc._id),
      name: doc.name,
      outletId: String(doc.outletId),
      active: doc.active,
      isActive: doc.isActive,
      isDeleted: doc.isDeleted,
      deletedAt: doc.deletedAt || null,
      price: doc.price ?? null,
      sizes: doc.sizes ?? null,
      createdAt: doc.createdAt || null,
      updatedAt: doc.updatedAt || null
    }, null, 2));
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
