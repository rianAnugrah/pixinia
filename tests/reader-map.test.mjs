import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutReaderMap } from '../src/lib/reader-map.ts';

const node = id => ({ id, title: id, nodeKey: id, owned: false, current: false, active: false, visited: false, ending: false, isStart: false, cost: 5 });
test('peta cabang meletakkan merge di bawah kedua parent tanpa kehilangan node terkunci', () => {
  const graph = layoutReaderMap(['a','b','c','d','e'].map(node), [{ node_id:'a',next_node_id:'b' },{node_id:'a',next_node_id:'c'},{node_id:'c',next_node_id:'d'},{node_id:'b',next_node_id:'e'},{node_id:'d',next_node_id:'e'}]);
  const positions = Object.fromEntries(graph.nodes.map(n => [n.id,n]));
  assert.equal(graph.nodes.length,5);
  assert.equal(positions.b.y,positions.c.y);
  assert.notEqual(positions.b.x,positions.c.x);
  assert.ok(positions.e.y>positions.d.y);
  assert.ok(positions.e.y>positions.b.y);
  assert.ok(graph.nodes.every(n=>n.x>=0 && n.x+132<=graph.width));
});
test('peta tetap selesai untuk data kosong, referensi hilang, dan siklus', () => {
  assert.equal(layoutReaderMap([],[]).nodes.length,0);
  const graph = layoutReaderMap(['a','b'].map(node),[{node_id:'a',next_node_id:'b'},{node_id:'b',next_node_id:'a'},{node_id:'a',next_node_id:'missing'}]);
  assert.equal(graph.nodes.length,2);
  assert.equal(graph.edges.length,2);
  assert.ok(Number.isFinite(graph.height));
});

