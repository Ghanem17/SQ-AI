import { test } from 'node:test';
import assert from 'node:assert/strict';

import { cleanParams, defaultPricing, formatUsd, planLines, quote, serviceOrder, serviceTiers, serviceTools, serviceToolKeys, startingPrice, tierModel } from './services.ts';

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
      { tool: 'klingVideo', qty: 10, task: { ar: 'مشاهد', en: 'scenes' } },
      { tool: 'music', qty: 1, task: { ar: 'موسيقى', en: 'music' } },
    ],
    { usdToIqd: 1500, markup: 0.5, minPrice: 0 },
  );
  assert.equal(q.toolsUsd.toFixed(2), '1.50');
  assert.equal(q.toolsIqd, 2250);
  assert.equal(q.totalIqd, 3500);
  assert.equal(q.feeIqd, q.totalIqd - q.toolsIqd);
});

test('quote never goes below the minimum price', () => {
  const q = quote([{ tool: 'claude', qty: 1, task: { ar: 'كتابة', en: 'write' } }], defaultPricing);
  assert.equal(q.totalIqd, defaultPricing.minPrice);
});

test('live prices override the list prices', () => {
  const q = quote([{ tool: 'image', qty: 2, task: { ar: 'إعلان', en: 'ad' } }], { usdToIqd: 1000, markup: 0, minPrice: 0 }, { image: 0.2 });
  assert.equal(q.toolsIqd, 400);
});

test('unknown tools and zero quantities are dropped', () => {
  const q = quote([
    { tool: 'nope' as never, qty: 3, task: { ar: 'x', en: 'x' } },
    { tool: 'voice', qty: 0, task: { ar: 'y', en: 'y' } },
  ]);
  assert.equal(q.lines.length, 0);
});

test('dollar amounts read cleanly', () => {
  assert.equal(formatUsd(0.14), '$0.14');
  assert.equal(formatUsd(0.0002), '$0.0002');
});

test('a medium text-to-video plan bills Kling per second and music once', () => {
  const p = cleanParams({ kind: 'textVideo', prompt: 'a burger', duration: 10, music: 'upbeat' });
  assert.ok(p);
  const lines = planLines(p, 0, 'mid');
  assert.deepEqual(
    lines.map((l) => [l.tool, l.qty]),
    [
      ['claude', 1],
      ['klingVideo', 10],
      ['musicPro', 1],
      ['mergeAudio', 10],
    ],
  );
});

test('each level uses its own models and video length', () => {
  const p = cleanParams({ kind: 'textVideo', prompt: 'x', duration: 12, music: 'calm' });
  assert.ok(p);
  const low = planLines(p, 0, 'low');
  const high = planLines(p, 0, 'high');
  assert.deepEqual(low.find((l) => l.tool === 'wanVideo')?.qty, 5);
  assert.deepEqual(high.find((l) => l.tool === 'veoVideo')?.qty, 8);
  // Veo makes its own sound, so the high level adds no music.
  assert.equal(high.some((l) => l.tool === 'musicPro'), false);
});

test('the minimum price rises with the level', () => {
  const p = cleanParams({ kind: 'copy', format: 'post', topic: 'x', details: '' });
  assert.ok(p);
  const total = (tier: 'low' | 'mid' | 'high') => quote(planLines(p, 0, tier), defaultPricing, {}, tier).totalIqd;
  assert.deepEqual([total('low'), total('mid'), total('high')], [3000, 4500, 7500]);
});

test('higher levels cost more for the same request', () => {
  for (const raw of [
    { kind: 'textVideo', prompt: 'x', duration: 10, music: 'x' },
    { kind: 'adImage', prompt: 'x', aspect: '1:1' },
    { kind: 'voice', text: 'مرحبا', voice: 'brian' },
    { kind: 'copy', format: 'post', topic: 'x', details: '' },
    { kind: 'editVideo', trimStart: null, trimEnd: null, captions: true, music: 'x' },
  ]) {
    const p = cleanParams(raw);
    assert.ok(p);
    const cost = (tier: 'low' | 'mid' | 'high') => quote(planLines(p, 40, tier), { usdToIqd: 1500, markup: 0, minPrice: 0 }).toolsUsd;
    assert.ok(cost('low') < cost('mid') && cost('mid') < cost('high'), raw.kind);
  }
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
  const tools = planLines(p, 45, 'mid').map((l) => l.tool);
  assert.deepEqual(tools, ['claude', 'trim', 'captions']);
});

test('long voice-overs are billed per started thousand characters', () => {
  const p = cleanParams({ kind: 'voice', text: 'ا'.repeat(1200), voice: 'sarah' });
  assert.ok(p);
  assert.equal(planLines(p).find((l) => l.tool === 'voice')?.qty, 2);
});

test('each level names a headline model, and services start at the minimum price', () => {
  assert.equal(tierModel('textVideo', 'low'), 'Wan 2.2');
  assert.equal(tierModel('textVideo', 'mid'), 'Kling 3 Pro');
  assert.equal(tierModel('textVideo', 'high'), 'Veo 3.1');
  for (const k of serviceOrder) for (const t of serviceTiers) assert.ok(tierModel(k, t).length > 0);
  assert.equal(startingPrice(), 3000);
  assert.equal(startingPrice({ ...defaultPricing, minPrice: 3100 }), 3250);
});

test('a medium 10-second text video with music matches the approved quote', () => {
  const lines = planLines({ kind: 'textVideo', prompt: 'x', duration: 10, music: 'calm' }, 0, 'mid');
  const q = quote(lines, defaultPricing, {}, 'mid');
  assert.deepEqual(
    q.lines.map((l) => l.costIqd),
    [15, 2100, 900, 3],
  );
  assert.equal(q.feeIqd, 1982);
  assert.equal(q.totalIqd, 5000);
});
