import 'dotenv/config';
import mongoose from 'mongoose';
import { MenuItem, connectDatabase } from '../src/db.js';

async function main() {
  console.log('Connecting to database...');
  await connectDatabase();

  const docId = '6a649a0ad11edf151a48d5bd';
  console.log(`Deleting MenuItem with _id=${docId}...`);
  const result = await MenuItem.deleteOne({ _id: docId });
  console.log('deleteOne result:', JSON.stringify(result, null, 2));

  const regex = /^\s*test chai\s*$/i;
  const verify = await MenuItem.find({ name: { $regex: regex } }).lean();
  console.log('remaining documents:', verify.length);
  if (verify.length > 0) {
    console.log(JSON.stringify(verify, null, 2));
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
