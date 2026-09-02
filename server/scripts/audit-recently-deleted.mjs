import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const { MenuItem } = await import(pathToFileURL(path.join(process.cwd(), 'src', 'db.js')).href);

const outletId = '6a5cadad7aed56a342c4ea44';
const objectId = mongoose.Types.ObjectId.isValid(outletId) ? new mongoose.Types.ObjectId(outletId) : outletId;

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
const items = await MenuItem.find({ outletId: objectId, isDeleted: true }).sort({ deletedAt: -1, name: 1 }).limit(5).lean();
console.log(JSON.stringify({ count: items.length, items }, null, 2));
await mongoose.disconnect();
