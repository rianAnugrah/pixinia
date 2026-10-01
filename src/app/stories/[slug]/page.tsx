import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPanelCounts, getStory, storyCoverUrl, storyFormatLabel } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import StoryStart from "@/components/story-start";
import StoryTabs from "@/components/reader/story-tabs";
import { getCoinAccess } from "@/lib/coins";
import CoinAction from "@/components/coin-action";
import { visitedNodeIds } from "@/lib/reader-state";
import { catalogHref, storyGenreLabel } from "@/lib/story-taxonomy";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const story = await getStory(slug);
  return { title: story?.title || "Cerita tidak ditemukan", description: story?.tagline || story?.description || undefined };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStory(slug); if (!story) notFound();
  const db = await createClient();
  const [{ data: start, error: startError }, { data: { user } }] = await Promise.all([
    db.from("story_nodes").select("id,node_key,title,is_start,sequence_hint,unlock_cost,is_premium").eq("story_id", story.id).eq("is_start", true).eq("status", "published").maybeSingle(),
    db.auth.getUser(),
  ]);
  if (startError) throw startError;
  const { data: progress, error: progressError } = user ? await db.from("user_story_progress").select("current_node_id,choices_history").eq("story_id", story.id).eq("user_id", user.id).maybeSingle() : { data: null, error: null };
  if (progressError) throw progressError;
  const access = await getCoinAccess(user?.id, story.id);
  const { data: chapterRows, error: chapterError } = await db.from("story_nodes").select("id,node_key,title,is_start,sequence_hint,unlock_cost,is_premium,node_type").eq("story_id", story.id).eq("status", "published").order("created_at");
  if (chapterError) throw chapterError;
  const panelCounts = story.default_format === "web_novel" ? {} : await getPublishedPanelCounts((chapterRows ?? []).map(chapter => chapter.id));
  const isOwned = (chapter: { id: string; unlock_cost: number; is_premium: boolean }) => access.staff || access.storyOwned || access.owned.has(chapter.id) || (chapter.unlock_cost === 0 && !chapter.is_premium && !story.is_premium);
  const visited = new Set(visitedNodeIds(progress?.current_node_id, progress?.choices_history));
  const { data: edges, error: edgesError } = await db.rpc("reader_story_edges", { p_story_id: story.id });
  if (edgesError) throw edgesError;
  const chapters = (chapterRows ?? []).sort((a, b) => Number(b.is_start) - Number(a.is_start) || (a.sequence_hint ?? 2147483647) - (b.sequence_hint ?? 2147483647)).map(chapter => ({ id: chapter.id, nodeKey: chapter.node_key, title: chapter.title, isStart: chapter.is_start, current: chapter.id === progress?.current_node_id, panelCount: panelCounts[chapter.id] ?? 0, owned: isOwned(chapter), cost: chapter.unlock_cost, premium: chapter.is_premium, visited: visited.has(chapter.id), ending: chapter.node_type === "ending" }));
  const currentKey = chapters.find(chapter => chapter.current)?.nodeKey;
  const cover = storyCoverUrl(story.cover_path);
  return <main className="story-detail">
    <div className="story-detail-cover" style={cover ? { backgroundImage: `linear-gradient(0deg,#080f16 0%,#080f1640 65%),url(${JSON.stringify(cover)})` } : undefined}>
      {!cover && <span className="story-cover-mark" aria-hidden>✦</span>}
      <div className="story-detail-hero"><p>{storyFormatLabel(story.default_format).toUpperCase()} INTERAKTIF PIXINIA</p><h1>{story.title}</h1>{story.tagline && <span>{story.tagline}</span>}{(story.genres.length > 0 || story.tags.length > 0) && <div className="story-detail-taxonomy">{story.genres.map(value => <Link key={value} href={catalogHref({ genre: value })}>{storyGenreLabel(value)}</Link>)}{story.tags.map(value => <Link key={value} href={catalogHref({ tag: value })}>#{value}</Link>)}</div>}</div>
    </div>
    <div className="story-detail-body"><div className="story-detail-actions">{user && <p>Saldo: <strong>{access.balance} coin</strong></p>}{progress?.current_node_id && !currentKey ? <p role="alert">Bab terakhir belum tersedia. Progresmu tetap tersimpan.</p> : start ? <StoryStart storyId={story.id} slug={slug} startKey={start.node_key} currentKey={currentKey} signedIn={!!user} cost={isOwned(start) ? 0 : start.unlock_cost} balance={access.balance} /> : <p>Awal cerita belum tersedia.</p>}{story.is_premium && !access.storyOwned && !access.staff && <CoinAction rpc="coin_unlock_story" args={{ p_story_id: story.id }} label="Unlock seluruh cerita premium" cost={story.unlock_cost} balance={access.balance} signedIn={!!user} next={`/stories/${slug}`} />}</div>
      <StoryTabs slug={slug} description={story.description || story.tagline} chapters={chapters} edges={edges ?? []} format={story.default_format} />
    </div>
  </main>;
}
