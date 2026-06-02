import { store } from './server/src/db.js';

async function test() {
  const payload = {
    customerName: 'Test COC',
    phone: '1234567890',
    tableNumber: '1',
    paymentMethod: 'cash',
    items: [{ itemId: 'personal-blend-chai', sizeId: 'one', quantity: 1, name: 'Personal Blend Chai' }],
  };
  try {
    const req = await store.createCocRequest(payload);
    console.log('COC request created:', { id: req.id, status: req.status, orderId: req.orderId, paymentMethod: req.paymentMethod, orderType: req.orderType });
    const order = await store.approveCocRequest(req.id);
    console.log('Approved order:', {
      id: order.id,
      orderId: order.orderId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      orderType: order.orderType,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      itemsLength: order.items?.length,
    });
    console.log('Orders count:', (await store.orders()).length);
  } catch (err) {
    console.error(err);
  }
}

test();
