import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  estimatedOrders,
  estimatedReach,
  planDiscount,
  planPrice,
  promotionCost,
  reelPrice,
  tierOrder,
  tiers,
  tools,
  toolsCost,
} from './pricing.ts';
import { pipeline, toolsFor } from './pipeline.ts';

test('reel price is the AI work plus the service fee', () => {
  for (const tier of tierOrder) {
    assert.equal(reelPrice(tier), toolsCost(tier) + tiers[tier].serviceFee);
  }
});

test('sample prices are round and rise with quality', () => {
  assert.equal(reelPrice('basic'), 10000);
  assert.equal(reelPrice('pro'), 20000);
  assert.equal(reelPrice('premium'), 40000);
});

test('every line item names known tools', () => {
  for (const tier of tierOrder) {
    for (const item of tiers[tier].items) {
      assert.ok(item.tools.length > 0, item.task);
      for (const id of item.tools) assert.ok(tools[id], id);
    }
  }
});

test('promotion cost is the daily budget times the days', () => {
  assert.equal(promotionCost('none', 7), 0);
  assert.equal(promotionCost('mid', 5), 60000);
  assert.equal(promotionCost('low', -2), 0);
});

test('reach and order estimates are ranges and handle zero spend', () => {
  const reach = estimatedReach(60000);
  assert.ok(reach.low < reach.high);
  assert.deepEqual(estimatedOrders(0, 2100), { low: 0, high: 0 });
  const orders = estimatedOrders(60000, 2100);
  assert.ok(orders.low <= orders.high);
});

test('monthly plans get cheaper per reel as they grow', () => {
  assert.equal(planDiscount(4), 0);
  assert.equal(planDiscount(8), 0.1);
  assert.equal(planDiscount(20), 0.2);
  const four = planPrice(4, 'pro');
  const twelve = planPrice(12, 'pro');
  assert.equal(four.total, 80000);
  assert.ok(twelve.perReel < four.perReel);
  assert.equal(twelve.full - twelve.discount, twelve.total);
});

test('every AI model goes through OpenRouter with a model id', () => {
  for (const t of Object.values(tools)) {
    if (t.via === 'openrouter') assert.ok(t.model && t.model.includes('/'), t.id);
  }
});

test('pipeline routes publishing to each platform API', () => {
  const publish = pipeline.find((s) => s.id === 'publish');
  assert.ok(publish);
  assert.deepEqual(toolsFor(publish, 'tiktok'), ['tiktokApi']);
  assert.deepEqual(toolsFor(publish, 'instagram'), ['metaApi']);
});
