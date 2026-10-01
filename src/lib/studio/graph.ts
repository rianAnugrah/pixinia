export type StudioEpisode = { id: string; title: string; sortOrder: number };
export type StudioNode = {
  id: string; key: string; title: string; synopsis: string; type: "episode" | "ending";
  start: boolean; episodeId: string; x: number | null; y: number | null;
  tags: string[]; notes: string;
};
export type StudioChoice = {
  id: string; source: string; target: string; label: string; description: string;
  sortOrder: number; color: "blue" | "pink" | "purple"; condition: Record<string, unknown>;
};
export type StudioGraph = { episodes: StudioEpisode[]; nodes: StudioNode[]; choices: StudioChoice[] };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const key = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

export function parseGraph(value: unknown): StudioGraph {
  if (!isRecord(value) || !Array.isArray(value.episodes) || !Array.isArray(value.nodes) || !Array.isArray(value.choices) || value.episodes.length < 1 || value.episodes.length > 50 || value.nodes.length > 200 || value.choices.length > 400)
    throw new Error("Data graph tidak valid atau terlalu besar.");
  const episodes = value.episodes.map(item => {
    if (!isRecord(item) || typeof item.id !== "string" || !uuid.test(item.id) || typeof item.title !== "string" || !item.title.trim() || item.title.length > 120 || typeof item.sortOrder !== "number" || !Number.isInteger(item.sortOrder)) throw new Error("Episode tidak valid.");
    return { id: item.id, title: item.title.trim(), sortOrder: item.sortOrder };
  });
  const episodeIds = new Set(episodes.map(e => e.id));
  if (episodeIds.size !== episodes.length) throw new Error("ID episode ganda.");
  const nodes = value.nodes.map(item => {
    if (!isRecord(item) || typeof item.id !== "string" || !uuid.test(item.id) || typeof item.key !== "string" || !key.test(item.key) || item.key.length > 100 || typeof item.title !== "string" || !item.title.trim() || item.title.length > 200 || typeof item.synopsis !== "string" || item.synopsis.length > 4000 || !["episode", "ending"].includes(String(item.type)) || typeof item.start !== "boolean" || !episodeIds.has(String(item.episodeId)) || typeof item.notes !== "string" || item.notes.length > 4000 || !Array.isArray(item.tags) || item.tags.length > 15 || item.tags.some(tag => typeof tag !== "string" || tag.length > 40)) throw new Error("Node tidak valid.");
    for (const coordinate of [item.x, item.y]) if (coordinate !== null && (typeof coordinate !== "number" || !Number.isFinite(coordinate) || Math.abs(coordinate) > 100000)) throw new Error("Posisi node tidak valid.");
    return { id: item.id, key: item.key, title: item.title.trim(), synopsis: item.synopsis, type: item.type as StudioNode["type"], start: item.start, episodeId: item.episodeId as string, x: item.x as number | null, y: item.y as number | null, tags: item.tags as string[], notes: item.notes };
  });
  const ids = new Set(nodes.map(n => n.id));
  if (ids.size !== nodes.length || new Set(nodes.map(n => n.key)).size !== nodes.length) throw new Error("ID atau kunci node ganda.");
  const choices = value.choices.map(item => {
    if (!isRecord(item) || typeof item.id !== "string" || !uuid.test(item.id) || !ids.has(String(item.source)) || !ids.has(String(item.target)) || typeof item.label !== "string" || !item.label.trim() || item.label.length > 200 || typeof item.description !== "string" || item.description.length > 1000 || !Number.isInteger(item.sortOrder) || Number(item.sortOrder) < 0 || !["blue", "pink", "purple"].includes(String(item.color)) || !isRecord(item.condition)) throw new Error("Pilihan tidak valid.");
    return { id: item.id, source: item.source as string, target: item.target as string, label: item.label.trim(), description: item.description, sortOrder: item.sortOrder as number, color: item.color as StudioChoice["color"], condition: item.condition };
  });
  if (new Set(choices.map(c => c.id)).size !== choices.length) throw new Error("ID pilihan ganda.");
  return { episodes, nodes, choices };
}

export function validatePublication(graph: StudioGraph): string[] {
  const errors: string[] = [];
  const starts = graph.nodes.filter(node => node.start);
  if (starts.length !== 1) errors.push("Tentukan tepat satu node awal.");
  if (!graph.nodes.some(node => node.type === "ending")) errors.push("Tambahkan setidaknya satu ending.");
  for (const node of graph.nodes) {
    const outgoing = graph.choices.filter(choice => choice.source === node.id);
    if (node.type === "ending" && outgoing.length) errors.push(`${node.title}: ending masih memiliki pilihan.`);
    if (node.type !== "ending" && !outgoing.length) errors.push(`${node.title}: belum memiliki pilihan.`);
  }
  if (starts.length === 1) {
    const seen = new Set<string>(); const visiting = new Set<string>(); let cyclic = false;
    function visit(id: string) {
      if (visiting.has(id)) { cyclic = true; return; }
      if (seen.has(id)) return;
      visiting.add(id);
      graph.choices.filter(choice => choice.source === id).forEach(choice => visit(choice.target));
      visiting.delete(id); seen.add(id);
    }
    visit(starts[0].id);
    if (cyclic) errors.push("Graph memiliki siklus.");
    const unreachable = graph.nodes.filter(node => !seen.has(node.id));
    if (unreachable.length) errors.push(`${unreachable.length} node tidak terjangkau dari awal.`);
    const canEnd = new Set(graph.nodes.filter(node => node.type === "ending").map(node => node.id));
    for (let i = 0; i < graph.nodes.length; i++) for (const choice of graph.choices) if (canEnd.has(choice.target)) canEnd.add(choice.source);
    if (graph.nodes.some(node => !canEnd.has(node.id))) errors.push("Ada jalur yang tidak dapat mencapai ending.");
  }
  return errors;
}
