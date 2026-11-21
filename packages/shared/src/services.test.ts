import { test } from 'node:test';
import assert from 'node:assert/strict';

import { cleanParams, defaultPricing, formatUsd, levelModel, levelQuality, planLines, quote, serviceOrder, serviceTiers, serviceTools, serviceToolKeys, startingPrice, tierModel } from './services.ts';

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
    { kind: 'imageVideo', prompt: 'x', duration: 10, music: 'x' },
    { kind: 'adImage', prompt: 'x', aspect: '1:1' },
    { kind: 'voice', text: 'مرحبا', voice: 'brian' },
    { kind: 'copy', format: 'post', topic: 'x', details: '' },
    { kind: 'editVideo', trimStart: null, trimEnd: null, captions: true, music: 'x', musicMode: 'replace' },
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

test('video from photos uses its own models and lengths per level', () => {
  const p = cleanParams({ kind: 'imageVideo', prompt: 'burger on a plate', duration: 12, music: 'calm' });
  assert.ok(p && p.kind === 'imageVideo');
  const tools = (tier: 'low' | 'mid' | 'high') => planLines(p, 0, tier).map((l) => [l.tool, l.qty]);
  assert.deepEqual(tools('low'), [['claude', 1], ['refVideoLite', 5], ['music', 1], ['mergeAudio', 5]]);
  assert.deepEqual(tools('mid'), [['claude', 1], ['refVideo', 10], ['music', 1], ['mergeAudio', 10]]);
  // The high level makes its own sound, so no music lines.
  assert.deepEqual(tools('high'), [['claude', 1], ['refVideoPro', 12]]);
});

test('video edits keep the voice: music is mixed under it unless asked to replace the sound', () => {
  const p = cleanParams({ kind: 'editVideo', trimStart: null, trimEnd: null, captions: false, music: 'calm oud' });
  assert.ok(p && p.kind === 'editVideo');
  assert.equal(p.musicMode, 'under');
  assert.deepEqual(
    planLines(p, 40, 'mid').map((l) => [l.tool, l.qty]),
    [
      ['claude', 1],
      ['musicUnder', 40],
    ],
  );
  // The high level adds only upscaling; the low and medium levels match.
  const tools = (tier: 'low' | 'mid' | 'high') => planLines(p, 40, tier).map((l) => l.tool);
  assert.deepEqual(tools('low'), tools('mid'));
  assert.deepEqual(tools('high'), ['claude', 'musicUnder', 'upscale']);
  assert.equal(levelModel(p, 'mid'), 'Sonilo');
  assert.equal(levelQuality(p, 'mid').en, 'Same as Low for this request');

  const replace = cleanParams({ kind: 'editVideo', captions: false, music: 'calm', musicMode: 'replace' });
  assert.ok(replace);
  assert.deepEqual(
    planLines(replace, 40, 'low').map((l) => l.tool),
    ['claude', 'music', 'mergeAudio'],
  );
  assert.equal(levelModel(replace, 'mid'), 'ElevenLabs Music');
});

test('captions of the speech add no music and stay in the spoken language', () => {
  const p = cleanParams({ kind: 'editVideo', trimStart: null, trimEnd: null, captions: true, captionLanguage: null, music: null });
  assert.ok(p && p.kind === 'editVideo');
  assert.equal(p.captionLanguage, null);
  assert.deepEqual(
    planLines(p, 75, 'mid').map((l) => [l.tool, l.qty]),
    [
      ['claude', 1],
      ['captions', 2],
    ],
  );
});

test('translated captions run on VEED and bill its translation surcharge', () => {
  const p = cleanParams({ kind: 'editVideo', captions: false, captionLanguage: 'en', music: null });
  assert.ok(p && p.kind === 'editVideo');
  // Asking for a translation turns captions on.
  assert.equal(p.captions, true);
  const lines = planLines(p, 75, 'low');
  assert.deepEqual(
    lines.map((l) => [l.tool, l.qty]),
    [
      ['claude', 1],
      ['captionsPro', 2],
      ['captionsPro', 4],
    ],
  );
  // $0.10 a minute plus $0.20 a minute for the translation.
  const q = quote(lines.slice(1), { usdToIqd: 1, markup: 0, minPrice: 0 });
  assert.equal(q.toolsUsd.toFixed(2), '0.60');
  assert.equal(levelModel(p, 'low'), 'VEED');
  const unknown = cleanParams({ kind: 'editVideo', captions: true, captionLanguage: 'klingon' });
  assert.ok(unknown && unknown.kind === 'editVideo');
  assert.equal(unknown.captionLanguage, null);
});

test('videos too large for the quick caption tool are captioned by VEED', () => {
  const p = cleanParams({ kind: 'editVideo', captions: true, music: null });
  assert.ok(p);
  assert.equal(planLines(p, 60, 'mid', 90_000_000).find((l) => l.tool.startsWith('captions'))?.tool, 'captions');
  assert.equal(planLines(p, 60, 'mid', 300_000_000).find((l) => l.tool.startsWith('captions'))?.tool, 'captionsPro');
});
