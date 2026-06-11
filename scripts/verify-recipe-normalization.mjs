import assert from 'node:assert/strict';
import { store } from '../server/src/db.js';

const recipe = await store.upsertRecipe({
  id: 'black-coffee',
  itemId: 'black-coffee',
  ingredients: [
    { rawMaterialId: 'Coffee Powder', amount: 15, unit: 'g' },
    { rawMaterialId: 'Water', amount: 150, unit: 'ml' }
  ]
});

assert.equal(recipe.ingredients[0].rawMaterialId, 'coffee-powder');
assert.equal(recipe.ingredients[1].rawMaterialId, 'water');
console.log('recipe-normalization-check', recipe.ingredients);
