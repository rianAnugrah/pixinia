import test from 'node:test';
import assert from 'node:assert/strict';
import { canUseStudio, canManageStory } from '../src/lib/roles.ts';
import { analyticsDays, ratingLabel } from '../src/lib/story-engagement.ts';

test('Reader tidak memiliki akses Studio; hanya Creator dan Admin aktif', () => {
  for (const role of ['reader', 'editor', undefined]) assert.equal(canUseStudio(role), false);
  assert.equal(canUseStudio('creator'), true);
  assert.equal(canUseStudio('admin'), true);
  assert.equal(canUseStudio('admin', false), false);
});
test('Creator hanya mengelola karya sendiri, Admin dapat mengelola semua karya', () => {
  assert.equal(canManageStory('creator', 'a', 'a'), true);
  assert.equal(canManageStory('creator', 'a', 'b'), false);
  assert.equal(canManageStory('creator', 'a', null), false);
  assert.equal(canManageStory('reader', 'a', 'a'), false);
  assert.equal(canManageStory('admin', 'a', 'b'), true);
  assert.equal(canManageStory('admin', 'a', 'a', false), false);
});
test('Rating kosong tidak ditampilkan sebagai nol dan periode analytics dibatasi', () => {
  assert.equal(ratingLabel(null, 0), 'Belum ada rating');
  assert.equal(ratingLabel(4.75, 2), '4,8 / 5 · 2 rating');
  for (const value of ['-1', '2', 'NaN', undefined]) assert.equal(analyticsDays(value), 30);
  assert.equal(analyticsDays('90'), 90);
});
