import assert from 'node:assert/strict';
import test from 'node:test';
import { catalogHref, parseStoryTaxonomy } from '../src/lib/story-taxonomy.ts';

test('genre and tag input is normalized for consistent catalog filtering', () => {
  const form = new FormData();
  form.append('genres', 'fantasi');
  form.append('genres', 'petualangan');
  form.set('tags', 'Isekai, Dunia   Lain, isekai');
  assert.deepEqual(parseStoryTaxonomy(form), {
    genres: ['fantasi', 'petualangan'],
    tags: ['isekai', 'dunia lain'],
  });
  assert.equal(catalogHref({ format: 'web_novel', genre: 'fantasi', tag: 'dunia lain' }), '/?format=web_novel&genre=fantasi&tag=dunia+lain#cerita');
});

test('unknown genres and oversized tag collections are rejected', () => {
  const invalidGenre = new FormData();
  invalidGenre.append('genres', 'unknown');
  assert.throws(() => parseStoryTaxonomy(invalidGenre));
  const tooManyTags = new FormData();
  tooManyTags.set('tags', Array.from({ length: 13 }, (_, index) => `tag ${index}`).join(','));
  assert.throws(() => parseStoryTaxonomy(tooManyTags));
});
