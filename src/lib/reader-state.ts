export function visitedNodeIds(currentId: string | null | undefined, history: unknown): string[] {
  const ids = new Set<string>();
  if (currentId) ids.add(currentId);
  if (!Array.isArray(history)) return [...ids];
  for (const entry of history) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as { from_node_id?: unknown; to_node_id?: unknown };
    if (typeof row.from_node_id === "string") ids.add(row.from_node_id);
    if (typeof row.to_node_id === "string") ids.add(row.to_node_id);
  }
  return [...ids];
}

export function activePanelIndex(tops: number[], threshold = 112): number {
  let active = 0;
  tops.forEach((top, index) => { if (top <= threshold) active = index; });
  return active;
}
