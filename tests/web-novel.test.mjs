import test from "node:test";
import assert from "node:assert/strict";
import { novelParagraphs } from "../src/lib/web-novel.ts";

test("naskah memisahkan paragraf CRLF dan mempertahankan baris dialog", () => {
  assert.deepEqual(novelParagraphs("  Pagi tiba.\r\nNara berangkat.\r\n\r\n  Ia berhenti.  "), ["Pagi tiba.\nNara berangkat.", "Ia berhenti."]);
  assert.deepEqual(novelParagraphs(null), []);
});
