import assert from 'node:assert/strict';
import test from 'node:test';
import { visibleChapterSections } from '../src/lib/reader-chapters.ts';

test('Bab shows active, start, and owned chapters while leaving locked branches for the map', () => {
  const chapters = [
    { id: 'start', isStart: true, owned: true },
    { id: 'active', isStart: false, owned: true },
    { id: 'owned', isStart: false, owned: true },
    { id: 'locked', isStart: false, owned: false },
  ];
  const sections = visibleChapterSections(chapters, 'active');
  assert.equal(sections.continuation?.id, 'active');
  assert.equal(sections.start?.id, 'start');
  assert.deepEqual(sections.unlocked.map(chapter => chapter.id), ['owned']);
});

test('starting chapter can appear in Continue and Awal Bab without duplicating reread chapters', () => {
  const chapters = [{ id: 'start', isStart: true, owned: true }];
  const sections = visibleChapterSections(chapters, 'start');
  assert.equal(sections.continuation?.id, 'start');
  assert.equal(sections.start?.id, 'start');
  assert.deepEqual(sections.unlocked, []);
});
