import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatDate, formatTime, lastDays, lastMonths } from './dates.ts';

const at = new Date(2026, 10, 7, 10, 42).getTime();

test('dates use Iraqi month names and a 24-hour clock', () => {
  assert.equal(formatDate(at, 'ar'), '7 تشرين الثاني 2026');
  assert.equal(formatDate(at, 'en'), '7 November 2026');
  assert.equal(formatTime(at), '10:42');
  assert.equal(formatTime(new Date(2026, 0, 1, 7, 5).getTime()), '07:05');
});

test('chart axes list the last days and months, oldest first', () => {
  // 7 November 2026 is a Saturday.
  assert.deepEqual(lastDays(at, 7, 'en'), ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  assert.equal(lastDays(at, 7, 'ar')[0], 'أحد');
  assert.deepEqual(lastMonths(at, 6, 'ar'), ['حزيران', 'تموز', 'آب', 'أيلول', 'ت. الأول', 'ت. الثاني']);
  assert.deepEqual(lastMonths(new Date(2026, 1, 1).getTime(), 3, 'en'), ['Dec', 'Jan', 'Feb']);
});
