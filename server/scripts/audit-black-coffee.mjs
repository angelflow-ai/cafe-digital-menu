import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
dotenv.config({ path: path.join(repoRoot, '.env') });

const { MenuItem, Outlet } = await import(pathToFileURL(path.join(repoRoot, 'src', 'db.js')).href);

const outletId = '6a5cadad7aed56a342c4ea44';
const objectId = mongoose.Types.ObjectId.isValid(outletId) ? new mongoose.Types.ObjectId(outletId) : outletId;

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });

const matches = await MenuItem.find({
  outletId: objectId,
  $or: [{ name: { $regex: /^Black Coffee$/i } }, { id: 'black-coffee' }]
}).lean();

const formattedMatches = matches.map((item) => ({
  _id: item._id?.toString?.() || item._id,
  name: item.name,
  image: item.image,
  active: item.active,
  isDeleted: item.isDeleted,
  price: item.sizes?.[0]?.price ?? null
}));

const recentDeleted = await MenuItem.find({ outletId: objectId, isDeleted: true })
  .sort({ deletedAt: -1, name: 1 })
  .limit(5)
  .lean();

const formattedRecentDeleted = recentDeleted.map((item) => ({
  _id: item._id?.toString?.() || item._id,
  name: item.name,
  active: item.active,
  isDeleted: item.isDeleted
}));

console.log(JSON.stringify({
  outlet: await Outlet.findById(objectId).lean(),
  matches: formattedMatches,
  recentDeleted: formattedRecentDeleted
}, null, 2));

await mongoose.disconnect();
