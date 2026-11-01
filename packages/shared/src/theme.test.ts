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
];

// Input underlines and similar controls need 3:1 against their surface.
const uiPairs: [keyof ColorTokens, keyof ColorTokens][] = [
  ['fieldLine', 'tile'],
  ['lineStrong', 'card'],
  ['chart', 'card'],
  ['primary', 'card'],
];

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

test('contrastRatio rejects malformed colors', () => {
  assert.throws(() => contrastRatio('#fff', '#000000'));
});
