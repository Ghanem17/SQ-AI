import { test } from 'node:test';
import assert from 'node:assert/strict';

import { count } from './plural.ts';

test('Arabic counts agree with the number', () => {
  assert.equal(count(1, 'tool', 'ar'), 'أداة واحدة');
  assert.equal(count(2, 'tool', 'ar'), 'أداتان');
  assert.equal(count(3, 'tool', 'ar'), '3 أدوات');
  assert.equal(count(10, 'tool', 'ar'), '10 أدوات');
  assert.equal(count(11, 'tool', 'ar'), '11 أداة');
  assert.equal(count(15, 'second', 'ar'), '15 ثانية');
  assert.equal(count(5, 'second', 'ar'), '5 ثوانٍ');
  assert.equal(count(14, 'day', 'ar'), '14 يومًا');
  assert.equal(count(103, 'order', 'ar'), '103 طلبات');
  assert.equal(count(100, 'order', 'ar'), '100 طلبًا');
});

test('English counts use the singular for one', () => {
  assert.equal(count(1, 'day', 'en'), '1 day');
  assert.equal(count(4, 'day', 'en'), '4 days');
  assert.equal(count(0, 'order', 'en'), '0 orders');
});
