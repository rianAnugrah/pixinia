import test from "node:test";
import assert from "node:assert/strict";
import { parseGraph, validatePublication } from "../src/lib/studio/graph.ts";

const ids = ["a1000000-0000-4000-8000-000000000001", "a1000000-0000-4000-8000-000000000002", "a1000000-0000-4000-8000-000000000003", "a1000000-0000-4000-8000-000000000004"];
const episode = "b1000000-0000-4000-8000-000000000001";
const node = (id, key, start = false, type = "episode") => ({ id, key, title: key, synopsis: "", type, start, episodeId: episode, x: 0, y: 0, tags: [], notes: "" });
const choice = (id, source, target) => ({ id, source, target, label: "Lanjut", description: "", sortOrder: 1, color: "blue", condition: {} });
const valid = () => ({ episodes: [{ id: episode, title: "Episode 1", sortOrder: 1 }], nodes: [node(ids[0], "awal", true), node(ids[1], "tengah"), node(ids[2], "akhir", false, "ending")], choices: [choice("c1000000-0000-4000-8000-000000000001", ids[0], ids[1]), choice("c1000000-0000-4000-8000-000000000002", ids[1], ids[2])] });

test("graph sederhana valid dan round trip", () => assert.deepEqual(validatePublication(parseGraph(valid())), []));
test("menolak tujuan di luar graph", () => { const graph = valid(); graph.choices[0].target = ids[3]; assert.throws(() => parseGraph(graph), /Pilihan tidak valid/); });
test("menolak start ganda, node tak terjangkau dan siklus", () => {
  const graph = valid(); graph.nodes[1].start = true;
  assert.match(validatePublication(parseGraph(graph)).join(" "), /tepat satu/);
  graph.nodes[1].start = false; graph.choices.splice(0, 1);
  assert.match(validatePublication(parseGraph(graph)).join(" "), /tidak terjangkau/);
  graph.choices.unshift(choice("c1000000-0000-4000-8000-000000000001", ids[0], ids[1]));
  graph.choices.push(choice("c1000000-0000-4000-8000-000000000003", ids[1], ids[0]));
  assert.match(validatePublication(parseGraph(graph)).join(" "), /siklus/);
});
test("menolak cabang tanpa ending dan ending dengan pilihan keluar", () => {
  const graph = valid(); graph.nodes[2].type = "episode";
  assert.match(validatePublication(parseGraph(graph)).join(" "), /ending/);
  graph.nodes[2].type = "ending";
  graph.choices.push(choice("c1000000-0000-4000-8000-000000000003", ids[2], ids[0]));
  assert.match(validatePublication(parseGraph(graph)).join(" "), /ending masih memiliki pilihan/);
});
