import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStories } from "@/lib/data";
import { getReaderDashboard } from "@/lib/reader-dashboard";
import { visitedNodeIds } from "@/lib/reader-state";
import LibraryView from "@/components/reader/library";
export const metadata = { title: "Pustaka kamu" };
export default async function Page() {
  const [dashboard, stories] = await Promise.all([getReaderDashboard(), getStories()]);
  if (!dashboard.user) redirect("/login?next=/library");
  const db = await createClient();
  const ids = dashboard.progress.map(row => row.story_id);
  const { data: nodes, error } = ids.length ? await db.from("story_nodes").select("id,story_id,node_key,title,node_type").eq("status", "published").in("story_id", ids) : { data: [], error: null };
  if (error) throw error;
  const entries = dashboard.progress.map(row => {
    const storyNodes = (nodes ?? []).filter(node => node.story_id === row.story_id);
    const visited = new Set(visitedNodeIds(row.current_node_id, row.choices_history));
    const current = storyNodes.find(node => node.id === row.current_node_id);
    return { storyId: row.story_id, nodeKey: current?.node_key, chapter: current?.title, completed: !!row.completed_at, discovered: storyNodes.filter(node => visited.has(node.id)).length, total: storyNodes.length, endings: storyNodes.filter(node => node.node_type === "ending" && visited.has(node.id)).length, totalEndings: storyNodes.filter(node => node.node_type === "ending").length };
  });
  return <LibraryView stories={stories} entries={entries} accountKey={dashboard.user.id} />;
}
