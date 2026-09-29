import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStory } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import StoryStart from "@/components/story-start";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const story = await getStory(slug);
  return { title: story?.title || "Cerita tidak ditemukan", description: story?.tagline || story?.description || undefined };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStory(slug); if (!story) notFound();
  const db = await createClient();
  const [{ data: start }, { data: { user } }] = await Promise.all([
    db.from("story_nodes").select("id,node_key").eq("story_id", story.id).eq("is_start", true).eq("status", "published").maybeSingle(),
    db.auth.getUser(),
  ]);
  const { data: progress } = user ? await db.from("user_story_progress").select("current_node_id").eq("story_id", story.id).eq("user_id", user.id).maybeSingle() : { data: null };
  const { data: current } = progress?.current_node_id ? await db.from("story_nodes").select("node_key").eq("id", progress.current_node_id).maybeSingle() : { data: null };
  return <main className="shell page"><div className="page-intro"><p className="eyebrow">KOMIK INTERAKTIF</p><h1 className="page-title">{story.title}</h1><p>{story.description || story.tagline}</p><span className="pill">Pilihan bercabang</span><span className="pill">Simpan progres</span><span className="pill">Baca di ponsel</span></div>
    {start ? <StoryStart storyId={story.id} slug={slug} startKey={start.node_key} currentKey={current?.node_key} signedIn={!!user} /> : <p>Awal cerita belum tersedia.</p>}
  </main>;
}
