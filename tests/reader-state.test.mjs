import test from 'node:test';
import assert from 'node:assert/strict';
import { activePanelIndex, visitedNodeIds } from '../src/lib/reader-state.ts';

test('riwayat baca hanya memakai id node yang valid sebagai teks dan tidak menduplikasi', () => {
  assert.deepEqual(visitedNodeIds('current', [
    { from_node_id: 'start', to_node_id: 'current' },
    null, { from_node_id: 42, to_node_id: 'ending' },
  ]), ['current', 'start', 'ending']);
  assert.deepEqual(visitedNodeIds(null, 'invalid'), []);
});

test('panel aktif mengikuti batas viewport dan aman saat belum ada panel', () => {
  assert.equal(activePanelIndex([], 112), 0);
  assert.equal(activePanelIndex([20, 280, 600], 112), 0);
  assert.equal(activePanelIndex([-400, 50, 240], 112), 1);
  assert.equal(activePanelIndex([-700, -300, 80], 112), 2);
});
