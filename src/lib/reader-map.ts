export type ReaderMapNode = { id: string; nodeKey: string; title: string; current: boolean; active: boolean; owned: boolean; visited: boolean; cost: number; ending: boolean; isStart: boolean; };
export type ReaderMapEdge = { node_id: string; next_node_id: string };

// Longest path layers keep merges below both parents. Invalid/cyclic leftovers
// remain visible in the final row instead of blocking reader navigation.
export function layoutReaderMap(nodes: ReaderMapNode[], edges: ReaderMapEdge[]) {
  const ids = new Set(nodes.map(n => n.id));
  const valid = edges.filter(e => ids.has(e.node_id) && ids.has(e.next_node_id));
  const incoming = new Map(nodes.map(n => [n.id, 0]));
  const levels = new Map(nodes.map(n => [n.id, 0]));
  const children = new Map<string, string[]>();
  for (const edge of valid) { incoming.set(edge.next_node_id, incoming.get(edge.next_node_id)! + 1); children.set(edge.node_id, [...(children.get(edge.node_id) ?? []), edge.next_node_id]); }
  const queue = nodes.filter(n => incoming.get(n.id) === 0).map(n => n.id);
  const done = new Set<string>();
  for (let index = 0; index < queue.length; index++) {
    const id = queue[index]; done.add(id);
    for (const next of children.get(id) ?? []) { levels.set(next, Math.max(levels.get(next)!, levels.get(id)! + 1)); incoming.set(next, incoming.get(next)! - 1); if (incoming.get(next) === 0) queue.push(next); }
  }
  const last = Math.max(0, ...levels.values()) + 1;
  for (const node of nodes) if (!done.has(node.id)) levels.set(node.id, last);
  const rows = new Map<number, ReaderMapNode[]>();
  for (const node of nodes) { const level = levels.get(node.id)!; rows.set(level, [...(rows.get(level) ?? []), node]); }
  const width = Math.max(280, ...Array.from(rows.values(), row => row.length * 144 + 12));
  const positioned = nodes.map(node => { const level = levels.get(node.id)!; const row = rows.get(level)!; return { ...node, x: (width - row.length * 144) / 2 + row.indexOf(node) * 144 + 6, y: 20 + level * 150 }; });
  return { nodes: positioned.sort((a, b) => a.y - b.y || a.x - b.x), edges: valid, width, height: (Math.max(0, ...levels.values()) + 1) * 150 + 10 };
}
