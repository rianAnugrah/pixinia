import test from "node:test";
import assert from "node:assert/strict";
import { novel } from "../content/web-novel/peta-langit-yang-retak.mjs";
import { validateSeed } from "../scripts/validate-web-novel-seed.mjs";

test("seed isekai memiliki semua jalur menuju tiga ending", () => {
  assert.deepEqual(validateSeed(novel), { chapters: 33, choices: 56, endings: 3 });
  assert.equal(novel.chapters[0].key, "pintu-lantai-tiga-belas");
  assert.deepEqual(novel.chapters.filter(chapter => chapter.choices.length === 0).map(chapter => chapter.key), ["fajar-untuk-semua", "rumah-dua-pintu", "nama-yang-tinggal"]);
});
