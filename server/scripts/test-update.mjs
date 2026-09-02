import { connectDatabase, store } from '../src/db.js';

async function main() {
  await connectDatabase();
  const id = process.argv[2] || '6a649453d11edf151a48d439';
  const outletId = process.argv[3] || '6a5cadad7aed56a342c4ea44';
  console.log('Running test update for id=', id, 'outletId=', outletId);
  const result = await store.updateMenuItem(id, { name: 'DEBUG NAME' }, { outletId });
  console.log('Test update result:', JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err.stack || err);
  process.exit(1);
});
