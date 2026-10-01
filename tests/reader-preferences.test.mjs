import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReaderPreferences, defaultPreferences } from '../src/lib/reader-preferences.ts';
test('corrupt browser settings cannot break the reader', () => {
  assert.deepEqual(parseReaderPreferences(null), defaultPreferences);
  assert.deepEqual(parseReaderPreferences('broken'), defaultPreferences);
  const parsed = parseReaderPreferences({ font: 'url(evil)', size: Infinity, spacing: -20, theme: 'unknown', brightness: 0, autoScroll: 99999, notifications: 'false' });
  assert.equal(parsed.font, 'serif'); assert.equal(parsed.theme, 'dark'); assert.equal(parsed.size, 18); assert.equal(parsed.spacing, 1.4); assert.equal(parsed.brightness, 60); assert.equal(parsed.autoScroll, 0); assert.equal(parsed.notifications, true);
});
test('valid saved reading preferences survive reload', () => {
  const saved = { font: 'sans', size: 24, spacing: 2, theme: 'paper', brightness: 80, autoScroll: 15, notifications: false };
  assert.deepEqual(parseReaderPreferences(JSON.parse(JSON.stringify(saved))), saved);
});
