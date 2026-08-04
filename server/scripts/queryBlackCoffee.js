import 'dotenv/config';
import mongoose from 'mongoose';
import { MenuItem, connectDatabase } from '../src/db.js';

async function main() {
  console.log('Connecting to database...');
  await connectDatabase();

  const doc = await MenuItem.findOne({ name: { $regex: /^\s*black coffee\s*$/i } }).lean();
  if (!doc) {
    console.log('Black Coffee document not found');
  } else {
    console.log(JSON.stringify({
      _id: String(doc._id),
      name: doc.name,
      outletId: String(doc.outletId),
      image: doc.image,
      active: doc.active,
      isDeleted: doc.isDeleted,
      deletedAt: doc.deletedAt || null,
      source: doc.source || null,
      sizes: doc.sizes || null,
      category: doc.category || doc.categoryId || null
    }, null, 2));
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
