import { test } from 'node:test';
import assert from 'node:assert/strict';

import { checkPhone, findCountry, formatNational, nationalNumber } from './phone.ts';

const iq = findCountry('IQ');

test('accepts an Iraqi mobile number in every common shape', () => {
  for (const input of ['7701234567', '07701234567', '+9647701234567', '009647701234567', '0770 123 4567', '٠٧٧٠١٢٣٤٥٦٧']) {
    const result = checkPhone(input, iq);
    assert.ok(result.ok, `rejected ${input}`);
    assert.equal(result.ok && result.e164, '+9647701234567');
  }
});

test('explains why a number is rejected', () => {
  assert.deepEqual(checkPhone('', iq), { ok: false, reason: 'empty', national: '' });
  assert.equal((checkPhone('770123', iq) as { reason: string }).reason, 'short');
  assert.equal((checkPhone('77012345678', iq) as { reason: string }).reason, 'long');
  assert.equal((checkPhone('6701234567', iq) as { reason: string }).reason, 'prefix');
});

test('does not strip a country code that is really the start of the number', () => {
  // A Turkish number starting with 90 should keep it when it is the national part.
  const tr = findCountry('TR');
  assert.equal(nationalNumber('5321234567', tr), '5321234567');
});

test('validates other markets with their own rules', () => {
  const sa = findCountry('SA');
  const result = checkPhone('0501234567', sa);
  assert.ok(result.ok);
  assert.equal(result.ok && result.e164, '+966501234567');
});

test('formats the national number in groups', () => {
  assert.equal(formatNational('7701234567', iq), '770 123 4567');
  assert.equal(formatNational('7701', iq), '770 1');
});

test('unknown country falls back to Iraq', () => {
  assert.equal(findCountry('XX').code, 'IQ');
});
