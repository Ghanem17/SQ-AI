import { test } from 'node:test';
import assert from 'node:assert/strict';

import { toWesternDigits } from './digits.ts';
import { formatIQD, formatNumber, formatPercent, setCurrencyLang } from './format.ts';

test('groups thousands with commas', () => {
  assert.equal(formatNumber(2100), '2,100');
  assert.equal(formatNumber(420000), '420,000');
  assert.equal(formatNumber(-1234567), '-1,234,567');
  assert.equal(formatNumber(14), '14');
});

test('formats Iraqi dinars and percentages', () => {
  assert.equal(formatIQD(33000), '33,000 د.ع');
  setCurrencyLang('en');
  assert.equal(formatIQD(33000), 'IQD 33,000');
  setCurrencyLang('ar');
  assert.equal(formatPercent(96), '96%');
  assert.equal(formatPercent(47.5, 1), '47.5%');
});

test('toWesternDigits leaves other text alone', () => {
  assert.equal(toWesternDigits('طلب ٣ كباب'), 'طلب 3 كباب');
});
