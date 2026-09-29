import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export default async function Page() {
  const db = await createClient(); const { data: { user } } = await db.auth.getUser(); if (!user) redirect("/login?next=/library");
  const { data: rows } = await db.from("user_story_progress").select("story_id,current_node_id,completed_at,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
  const storyIds = (rows ?? []).map(r => r.story_id); const nodeIds = (rows ?? []).map(r => r.current_node_id).filter(Boolean) as string[];
  const [stories, nodes] = await Promise.all([storyIds.length ? db.from("stories").select("id,title,slug").in("id", storyIds) : Promise.resolve({data:[]}), nodeIds.length ? db.from("story_nodes").select("id,node_key,title").in("id", nodeIds) : Promise.resolve({data:[]})]);
  return <main className="shell page"><div className="page-intro"><p className="eyebrow">PERJALANANMU</p><h1 className="page-title">Pustaka saya</h1><p>Lanjutkan kisah dari pilihan terakhir.</p></div>{rows?.length ? <div className="story-grid">{rows.map(row => { const story = stories.data?.find(s => s.id === row.story_id); const node = nodes.data?.find(n => n.id === row.current_node_id); return story ? <Link className="panel" key={row.story_id} href={node ? `/read/${story.slug}/${node.node_key}` : `/stories/${story.slug}`}><h2>{story.title}</h2><p className="muted">{row.completed_at ? "Tamat" : node?.title || "Mulai cerita"}</p><span className="text-link">Lanjutkan →</span></Link> : null; })}</div> : <div className="empty-state"><h2>Belum ada cerita dibaca</h2><Link href="/" className="text-link">Jelajahi cerita →</Link></div>}</main>;
}
