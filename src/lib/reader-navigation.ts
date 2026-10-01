import { createClient } from "@/lib/supabase/server";
import { getCoinAccess } from "@/lib/coins";
import { visitedNodeIds } from "@/lib/reader-state";
import type { ReaderMapEdge, ReaderMapNode } from "@/lib/reader-map";

export async function getReaderNavigation(story: { id: string; is_premium: boolean }, userId?: string, currentId?: string) {
  const db = await createClient();
  const [access, nodes, edges, progress] = await Promise.all([
    getCoinAccess(userId, story.id),
    db.from("story_nodes").select("id,node_key,title,is_start,node_type,sequence_hint,unlock_cost,is_premium").eq("story_id", story.id).eq("status", "published").order("sequence_hint", { ascending: true, nullsFirst: false }).order("created_at"),
    db.rpc("reader_story_edges", { p_story_id: story.id }),
    userId ? db.from("user_story_progress").select("current_node_id,choices_history,updated_at").eq("story_id", story.id).eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  for (const result of [nodes, edges, progress]) if (result.error) throw result.error;
  const visited = new Set(visitedNodeIds(progress.data?.current_node_id, progress.data?.choices_history));
  const chapters: ReaderMapNode[] = (nodes.data ?? []).map(n => ({ id: n.id, nodeKey: n.node_key, title: n.title, current: n.id === currentId, active: n.id === progress.data?.current_node_id, visited: visited.has(n.id), isStart: n.is_start, ending: n.node_type === "ending", cost: n.unlock_cost, owned: access.staff || access.storyOwned || access.owned.has(n.id) || (n.unlock_cost === 0 && !n.is_premium && !story.is_premium) }));
  return { chapters, edges: (edges.data ?? []) as ReaderMapEdge[], progress: progress.data, access };
}
