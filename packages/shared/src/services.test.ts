import { test } from 'node:test';
import assert from 'node:assert/strict';

import { cleanParams, defaultPricing, formatUsd, planLines, quote, serviceTools, serviceToolKeys } from './services.ts';

test('every service tool has a fal endpoint and a positive price', () => {
  for (const key of serviceToolKeys) {
    const t = serviceTools[key];
    assert.ok(t.endpoint.includes('/'), key);
    assert.ok(t.usd > 0, key);
  }
});

test('quote adds tool costs, converts to dinars and applies the margin', () => {
  const q = quote(
    [
      { tool: 'klingVideo', qty: 10, task: 'scenes' },
      { tool: 'music', qty: 1, task: 'music' },
    ],
    { usdToIqd: 1500, markup: 0.5, minPrice: 0 },
  );
  assert.equal(q.toolsUsd.toFixed(2), '1.50');
  assert.equal(q.toolsIqd, 2250);
  assert.equal(q.totalIqd, 3500);
  assert.equal(q.feeIqd, q.totalIqd - q.toolsIqd);
});

test('quote never goes below the minimum price', () => {
  const q = quote([{ tool: 'claude', qty: 1, task: 'write' }], defaultPricing);
  assert.equal(q.totalIqd, defaultPricing.minPrice);
});

test('live prices override the list prices', () => {
  const q = quote([{ tool: 'image', qty: 2, task: 'ad' }], { usdToIqd: 1000, markup: 0, minPrice: 0 }, { image: 0.2 });
  assert.equal(q.toolsIqd, 400);
});

test('unknown tools and zero quantities are dropped', () => {
  const q = quote([
    { tool: 'nope' as never, qty: 3, task: 'x' },
    { tool: 'voice', qty: 0, task: 'y' },
  ]);
  assert.equal(q.lines.length, 0);
});

test('dollar amounts read cleanly', () => {
  assert.equal(formatUsd(0.14), '$0.14');
  assert.equal(formatUsd(0.0002), '$0.0002');
});

test('a text-to-video plan bills Kling per second and music once', () => {
  const p = cleanParams({ kind: 'textVideo', prompt: 'a burger', duration: 10, music: 'upbeat' });
  assert.ok(p);
  const lines = planLines(p);
  assert.deepEqual(
    lines.map((l) => [l.tool, l.qty]),
    [
      ['claude', 1],
      ['klingVideo', 10],
      ['music', 1],
      ['mergeAudio', 10],
    ],
  );
});

test('model output is clamped to what can run', () => {
  const p = cleanParams({ kind: 'textVideo', prompt: 'x', duration: 90, music: '' });
  assert.ok(p && p.kind === 'textVideo');
  assert.equal(p.duration, 15);
  assert.equal(p.music, null);
  assert.equal(cleanParams({ kind: 'copy', topic: '' }), null);
  assert.equal(cleanParams({ kind: 'hack' }), null);
});

test('editing an uploaded video only bills the steps asked for', () => {
  const p = cleanParams({ kind: 'editVideo', trimStart: 2, trimEnd: 20, captions: true, music: null });
  assert.ok(p);
  const tools = planLines(p, 45).map((l) => l.tool);
  assert.deepEqual(tools, ['claude', 'trim', 'captions']);
});

test('long voice-overs are billed per started thousand characters', () => {
  const p = cleanParams({ kind: 'voice', text: 'ا'.repeat(1200), voice: 'sarah' });
  assert.ok(p);
  assert.equal(planLines(p).find((l) => l.tool === 'voice')?.qty, 2);
});
