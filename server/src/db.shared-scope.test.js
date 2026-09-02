import test from 'node:test';
import assert from 'node:assert/strict';
import { deduplicateSharedRecords, resolveCollectionOutletScope } from './db.js';

test('collections resolve with outlet scoping unless explicitly shared', async () => {
  const inventoryScope = await resolveCollectionOutletScope('inventory', { outletSlug: 'near-skit' });
  const recipesScope = await resolveCollectionOutletScope('recipes', { outletSlug: 'near-high-street' });
  const orderScope = await resolveCollectionOutletScope('orders', { outletSlug: 'near-skit' });
  const categoriesScope = await resolveCollectionOutletScope('categories', { outletSlug: 'near-skit' });

  assert.equal(typeof inventoryScope, 'string');
  assert.equal(typeof recipesScope, 'string');
  assert.equal(typeof orderScope, 'string');
  assert.equal(categoriesScope, null);
  assert.notEqual(inventoryScope, '');
  assert.notEqual(recipesScope, '');
  assert.notEqual(orderScope, '');
});

test('shared records are de-duplicated by id while preferring shared rows', () => {
  const docs = [
    { id: 'mango-juice', outletId: 'outlet-a', stock: 10 },
    { id: 'mango-juice', outletId: null, stock: 25 },
    { id: 'cheese-slice', outletId: 'outlet-b', stock: 7 }
  ];

  const result = deduplicateSharedRecords(docs, 'id');

  assert.deepEqual(result, [
    { id: 'mango-juice', outletId: null, stock: 25 },
    { id: 'cheese-slice', outletId: 'outlet-b', stock: 7 }
  ]);
});
