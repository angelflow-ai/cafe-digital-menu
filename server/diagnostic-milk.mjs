#!/usr/bin/env node

import mongoose from 'mongoose';
import process from 'process';

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/cafe-ordering-test';

const outletReference = {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Outlet',
  default: null
};

const rawMaterialSchema = new mongoose.Schema(
  {
    outletId: outletReference,
    id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, default: 'Inventory' },
    unit: { type: String, enum: ['g', 'ml', 'pcs'], required: true },
    displayUnit: { type: String, default: null },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 0 },
    costPerUnit: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const RawMaterial = mongoose.model('RawMaterial', rawMaterialSchema);

async function fetchMilk() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 5000 });

    console.log('\nFetching "Milk" document...\n');
    const milk = await RawMaterial.findOne({ id: 'milk' }).lean();

    if (!milk) {
      console.log('❌ No "Milk" document found in database');
      console.log('\nFetching ALL raw materials to see what exists:\n');
      const all = await RawMaterial.find({}).lean();
      if (all.length === 0) {
        console.log('❌ No raw materials found at all');
      } else {
        console.log(`Found ${all.length} raw material(s):`);
        all.forEach((item, i) => {
          console.log(`\n[${i + 1}] ID: ${item.id}, Name: ${item.name}`);
          console.log(`    displayUnit: ${item.displayUnit || '(NOT SET)'}`);
          console.log(`    unit (base): ${item.unit}`);
          console.log(`    stock: ${item.stock} ${item.unit}`);
          console.log(`    costPerUnit: ${item.costPerUnit}`);
        });
      }
    } else {
      console.log('✅ Found "Milk" document:\n');
      console.log(JSON.stringify(milk, null, 2));
      console.log('\n--- Field-by-field check ---');
      console.log(`id: ${milk.id}`);
      console.log(`name: ${milk.name}`);
      console.log(`unit (base): ${milk.unit}`);
      console.log(`displayUnit: ${milk.displayUnit || '(NOT SET)'}`);
      console.log(`stock: ${milk.stock}`);
      console.log(`minStock: ${milk.minStock}`);
      console.log(`costPerUnit: ${milk.costPerUnit}`);
      console.log(`active: ${milk.active}`);
      console.log(`isDeleted: ${milk.isDeleted}`);
    }

    console.log('\n✅ Diagnostic complete');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

fetchMilk();
