import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isCompleteOtp, sanitizeOtp } from './otp.ts';

test('keeps digits only and caps at six', () => {
  assert.equal(sanitizeOtp('12a3'), '123');
  assert.equal(sanitizeOtp('1234567'), '123456');
});

test('converts Arabic-Indic and Persian digits', () => {
  assert.equal(sanitizeOtp('١٢٣٤٥٦'), '123456');
  assert.equal(sanitizeOtp('۱۲۳'), '123');
});

test('finds the code inside a pasted message with other numbers', () => {
  assert.equal(sanitizeOtp('رمز SQ AI هو 482913، صالح لمدة 10 دقائق'), '482913');
  assert.equal(sanitizeOtp('Valid 10 minutes: 482913'), '482913');
});

test('isCompleteOtp needs exactly six digits', () => {
  assert.equal(isCompleteOtp('123456'), true);
  assert.equal(isCompleteOtp('12345'), false);
  assert.equal(isCompleteOtp('12345a'), false);
});
