import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { storyCoverUrl, storyFormatLabel } from "@/lib/data";

export default async function Page() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login?next=/library");
  const { data: rows, error: progressError } = await db.from("user_story_progress").select("story_id,current_node_id,completed_at,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
  if (progressError) throw progressError;
  const storyIds = (rows ?? []).map(row => row.story_id);
  const nodeIds = (rows ?? []).map(row => row.current_node_id).filter((id): id is string => !!id);
  const [stories, nodes] = await Promise.all([
    storyIds.length ? db.from("stories").select("id,title,slug,cover_path,default_format").eq("status", "published").in("id", storyIds) : Promise.resolve({ data: [], error: null }),
    nodeIds.length ? db.from("story_nodes").select("id,node_key,title").eq("status", "published").in("id", nodeIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (stories.error) throw stories.error;
  if (nodes.error) throw nodes.error;
  return <main className="reader-library"><div className="reader-library-inner"><p className="reader-home-eyebrow">PERJALANANMU</p><h1>Pustaka saya</h1><p className="reader-library-intro">Lanjutkan kisah dari pilihan terakhirmu.</p>
    {rows?.length ? <div className="reader-library-grid">{rows.map(row => {
      const story = stories.data?.find(item => item.id === row.story_id);
      const node = nodes.data?.find(item => item.id === row.current_node_id);
      return story ? <Link className="reader-library-card" key={row.story_id} href={node ? `/read/${story.slug}/${node.node_key}` : `/stories/${story.slug}`}>
        <span className="reader-library-art" style={storyCoverUrl(story.cover_path) ? { backgroundImage: `url(${JSON.stringify(storyCoverUrl(story.cover_path))})` } : undefined} aria-hidden>✦</span>
        <span className="reader-library-copy"><strong>{story.title}</strong><small>{storyFormatLabel(story.default_format)} · {row.completed_at ? "Tamat" : node?.title || "Mulai cerita"}</small><span>Lanjutkan →</span></span>
      </Link> : null;
    })}</div> : <div className="empty-state"><h2>Belum ada cerita dibaca</h2><Link href="/" className="text-link">Jelajahi cerita →</Link></div>}
  </div></main>;
}
