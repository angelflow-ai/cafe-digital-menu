import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
await mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000
});

const db = mongoose.connection.db;
const outlets = db.collection('outlets');
const rawMaterials = db.collection('rawmaterials');
const outlet = await outlets.findOne({ slug: 'near-skit' });
const documents = await rawMaterials.find({
  outletId: outlet?._id,
  name: { $in: ['Milk', 'Sugar'] }
}).toArray();

console.log(JSON.stringify({ outlet, documents }, null, 2));
await mongoose.disconnect();
