import test from 'node:test';
import assert from 'node:assert/strict';

import { isMongoObjectId, resolveCocRequestId, mergeCocRequestEntries, isCocApprovalCandidate } from './cocRequestUtils.js';

test('rejects non-ObjectId Mongo-like values for COC request lookup', () => {
  assert.equal(isMongoObjectId('507f1f77bcf86cd799439011'), true);
  assert.equal(isMongoObjectId('coc-12345'), false);
  assert.equal(isMongoObjectId('not-a-real-id'), false);
});

test('prefers real COC request identifiers instead of Mongo _id', () => {
  assert.equal(resolveCocRequestId({ id: 'coc-1001', _id: '507f1f77bcf86cd799439011' }), 'coc-1001');
  assert.equal(resolveCocRequestId({ orderId: 'ORD-42', _id: 'bad-id' }), 'ORD-42');
  assert.equal(resolveCocRequestId({ _id: '507f1f77bcf86cd799439011' }), '507f1f77bcf86cd799439011');
});

test('does not keep approved OOC orders in the COC Requests list', () => {
  const approvedOrder = {
    id: 'order-1',
    orderId: 'ORD-1',
    orderType: 'OOC',
    source: 'ooc',
    paymentMethod: 'cash',
    paymentMode: 'Cash On Counter',
    status: 'confirmed',
    paymentStatus: 'paid',
    pendingApproval: true,
    items: []
  };

  assert.equal(isCocApprovalCandidate(approvedOrder), false);
});

test('includes OOC cash-on-counter pending orders in the request list', () => {
  const order = {
    id: 'order-1',
    orderId: 'ORD-1',
    orderType: 'OOC',
    source: 'ooc',
    paymentMethod: 'cash',
    paymentMode: 'Cash On Counter',
    status: 'pending',
    pendingApproval: true,
    items: []
  };

  assert.equal(isCocApprovalCandidate(order), true);

  const merged = mergeCocRequestEntries([order], []);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'ORD-1');
});

test('does not keep approved OOC orders in the COC Requests list once approval is finalized', () => {
  const approvedOrder = {
    id: 'order-1',
    orderId: 'ORD-1',
    orderType: 'OOC',
    source: 'ooc',
    paymentMethod: 'cash',
    paymentMode: 'Cash On Counter',
    status: 'confirmed',
    paymentStatus: 'pending',
    pendingApproval: false,
    requestStatus: 'approved',
    approvedAt: '2026-06-08T12:00:00.000Z',
    items: []
  };

  assert.equal(isCocApprovalCandidate(approvedOrder), false);
});
