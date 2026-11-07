import { test } from 'node:test';
import assert from 'node:assert/strict';

import { contrastRatio } from './contrast.ts';
import { palettes, type ColorTokens } from './theme.ts';

// Every text color must stay readable on the surface it is drawn on (WCAG AA).
const textPairs: [keyof ColorTokens, keyof ColorTokens][] = [
  ['text', 'bg'],
  ['text', 'tile'],
  ['text', 'card'],
  ['muted', 'card'],
  ['muted', 'bg'],
  ['muted', 'tile'],
  ['placeholder', 'tile'],
  ['text', 'avatar'],
  ['heroText', 'hero'],
  ['heroMuted', 'hero'],
  ['heroBtnText', 'heroBtn'],
  ['onPrimary', 'primary'],
  ['onPriSoft', 'priSoft'],
  ['ok', 'okSoft'],
  ['bad', 'badSoft'],
  ['acc', 'accSoft'],
  ['onSandTile', 'sandTile'],
  ['onGreenTile', 'greenTile'],
  ['navText', 'nav'],
  ['onNavActive', 'navActive'],
  ['placeholder', 'card'],
  ['heroMuted', 'heroAlt'],
  ['heroAccent', 'hero'],
  ['heroOk', 'hero'],
  ['onFab', 'fab'],
  ['onTooltip', 'tooltip'],
  ['warn', 'warnSoft'],
  ['navActive', 'nav'],
];

// Input underlines and similar controls need 3:1 against their surface.
const uiPairs: [keyof ColorTokens, keyof ColorTokens][] = [
  // Inputs sit on the card surface in v2.
  ['fieldLine', 'card'],
  ['lineStrong', 'card'],
  ['chart', 'card'],
  ['primary', 'card'],
  ['chart2', 'card'],
  ['accent', 'card'],
  ['navIndicator', 'nav'],
];

// Colors the spec allows as rgba() (hero hairlines and glass fills).
const rgbaTokens = new Set<keyof ColorTokens>(['heroLine', 'heroTile', 'heroTileLine', 'heroOkSoft']);

const all = Object.entries(palettes).flatMap(([p, modes]) => Object.entries(modes).map(([m, tokens]) => [`${p} ${m}`, tokens] as const));

for (const [name, tokens] of all) {
  for (const [fg, bg] of textPairs) {
    test(`${name}: ${fg} on ${bg} meets 4.5:1`, () => {
      const ratio = contrastRatio(tokens[fg], tokens[bg]);
      assert.ok(ratio >= 4.5, `${tokens[fg]} on ${tokens[bg]} is ${ratio.toFixed(2)}:1`);
    });
  }
  for (const [fg, bg] of uiPairs) {
    test(`${name}: ${fg} on ${bg} meets 3:1`, () => {
      const ratio = contrastRatio(tokens[fg], tokens[bg]);
      assert.ok(ratio >= 3, `${tokens[fg]} on ${tokens[bg]} is ${ratio.toFixed(2)}:1`);
    });
  }
}

test('every palette and mode defines the same tokens', () => {
  const keys = Object.keys(palettes.ocean.light).sort();
  for (const [name, tokens] of all) assert.deepEqual(Object.keys(tokens).sort(), keys, name);
});

test('every token is a #RRGGBB color, or rgba() where the spec allows it', () => {
  for (const [name, tokens] of all) {
    for (const [key, value] of Object.entries(tokens) as [keyof ColorTokens, string][]) {
      if (rgbaTokens.has(key)) assert.match(value, /^rgba\(\d+,\d+,\d+,(0|1|0?\.\d+)\)$/, `${name} ${key}`);
      else assert.match(value, /^#[0-9A-F]{6}$/, `${name} ${key}`);
    }
  }
});

// Ratios from the spec's contrast table, so a token change that drifts from
// the approved design is caught.
const specRatios: [keyof ColorTokens, keyof ColorTokens, number, number, number, number][] = [
  ['text', 'bg', 16.45, 16.16, 17.63, 17.1],
  ['muted', 'card', 8.27, 8.43, 10.35, 7.78],
  ['heroText', 'hero', 16.45, 13.28, 13.4, 13.4],
  ['onPrimary', 'primary', 15.1, 13.21, 14.68, 5.31],
  ['onFab', 'fab', 13.21, 13.21, 8.09, 5.31],
  ['onTooltip', 'tooltip', 16.45, 16.16, 17.1, 17.1],
  ['lineStrong', 'card', 3.1, 4.22, 3.16, 4.04],
];
const order = [palettes.ocean.light, palettes.ocean.dark, palettes.rose.light, palettes.rose.dark];
for (const [fg, bg, ...ratios] of specRatios) {
  test(`${fg} on ${bg} matches the spec's contrast table`, () => {
    order.forEach((tokens, i) => {
      const ratio = contrastRatio(tokens[fg], tokens[bg]);
      assert.ok(Math.abs(ratio - ratios[i]) < 0.06, `${fg}/${bg} #${i}: ${ratio.toFixed(2)} vs ${ratios[i]}`);
    });
  });
}

test('contrastRatio rejects malformed colors', () => {
  assert.throws(() => contrastRatio('#fff', '#000000'));
});
