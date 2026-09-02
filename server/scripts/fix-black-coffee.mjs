import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const { MenuItem } = await import(pathToFileURL(path.join(process.cwd(), 'src', 'db.js')).href);

const outletId = '6a5cadad7aed56a342c4ea44';
const objectId = mongoose.Types.ObjectId.isValid(outletId) ? new mongoose.Types.ObjectId(outletId) : outletId;

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });

const matches = await MenuItem.find({
  outletId: objectId,
  $or: [{ name: 'Black Coffee' }, { id: 'black-coffee' }]
}).sort({ createdAt: 1, _id: 1 }).lean();

console.log('AUDIT');
console.log(JSON.stringify(matches, null, 2));

if (!matches.length) {
  const created = await MenuItem.create({
    id: 'black-coffee',
    name: 'Black Coffee',
    categoryId: 'hot-drinks',
    description: '',
    subCategoryId: 'coffee',
    subCategoryName: 'Coffee',
    subcategory: 'Coffee',
    image: '/assets/images/Hot Drinks/Hot Coffee/Black Coffee.jpg',
    sizes: [{ id: 'regular', name: 'Regular', label: 'Regular', price: 88, sortOrder: 1 }],
    serveOptions: [],
    addons: [],
    featured: false,
    active: true,
    isDeleted: false,
    deletedAt: null,
    outletId: objectId
  });
  console.log('CREATED');
  console.log(JSON.stringify(created.toObject(), null, 2));
  await mongoose.disconnect();
  process.exit(0);
}

const keepId = matches[matches.length - 1]._id.toString();
const keepDoc = await MenuItem.findById(keepId);
if (!keepDoc) {
  throw new Error('Could not load the preferred document');
}

keepDoc.set({
  id: 'black-coffee',
  name: 'Black Coffee',
  image: '/assets/images/Hot Drinks/Hot Coffee/Black Coffee.jpg',
  categoryId: 'hot-drinks',
  description: '',
  subCategoryId: 'coffee',
  subCategoryName: 'Coffee',
  subcategory: 'Coffee',
  sizes: [{ id: 'regular', name: 'Regular', label: 'Regular', price: 88, sortOrder: 1 }],
  serveOptions: [],
  addons: [],
  featured: false,
  active: true,
  isDeleted: false,
  deletedAt: null,
  outletId: objectId
});
await keepDoc.save();

for (const match of matches) {
  const matchId = match._id.toString();
  if (matchId === keepId) continue;
  await MenuItem.findByIdAndUpdate(matchId, {
    $set: {
      active: false,
      isDeleted: true,
      deletedAt: new Date()
    }
  });
}

const finalDoc = await MenuItem.findById(keepId).lean();
console.log('FINAL');
console.log(JSON.stringify(finalDoc, null, 2));
await mongoose.disconnect();
