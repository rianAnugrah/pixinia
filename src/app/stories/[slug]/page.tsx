import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPanelCounts, getStory, storyFormatLabel } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import StoryStart from "@/components/story-start";
import StoryTabs from "@/components/reader/story-tabs";
import { getCoinAccess } from "@/lib/coins";
import CoinAction from "@/components/coin-action";
import { visitedNodeIds } from "@/lib/reader-state";
import { catalogHref, storyGenreLabel } from "@/lib/story-taxonomy";
import { Cover, PageHeading, ProgressBar } from "@/components/reader/design-ui";
import SaveStory from "@/components/reader/saved-stories";
import { GitBranch } from "lucide-react";
import StoryRating from "@/components/reader/story-rating";
import { ratingLabel } from "@/lib/story-engagement";

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
  const discovered = chapters.filter(chapter => chapter.visited).length;
  const endings = chapters.filter(chapter => chapter.ending);
  const [rating, reads] = user && story.metrics ? await Promise.all([
    db.from("story_ratings").select("score").eq("story_id", story.id).eq("user_id", user.id).maybeSingle(),
    db.from("story_read_sessions").select("id").eq("story_id", story.id).eq("user_id", user.id).not("counted_at", "is", null).limit(1),
  ]) : [{ data: null, error: null }, { data: [], error: null }];
  if (rating.error) throw rating.error; if (reads.error) throw reads.error;
  return <main className="px-page px-story-detail">
    <PageHeading title="Detail cerita" back="/explore" />
    <div className="px-content"><section className="px-detail-card"><Cover path={story.cover_path} title={story.title} /><div><h1>{story.title}</h1><p className="px-muted">{storyFormatLabel(story.default_format)} · {story.metrics?.author_name ?? "Pixinia Editorial"}</p><p className="story-rating-summary">★ {ratingLabel(story.metrics?.rating_average, story.metrics?.rating_count)}</p><div className="px-detail-stats"><span><strong>{chapters.length}</strong><small>Bab</small></span><span><strong>{endings.length}</strong><small>Kemungkinan akhir</small></span><span><strong>{(story.metrics?.read_count ?? 0).toLocaleString("id-ID")}</strong><small>Kali dibaca</small></span><span><strong>{(story.metrics?.reader_count ?? 0).toLocaleString("id-ID")}</strong><small>Pembaca unik</small></span></div><div className="px-chips">{story.genres.map(value => <Link key={value} href={catalogHref({ genre: value })}>{storyGenreLabel(value)}</Link>)}</div></div></section>
    {story.metrics && <section className="px-synopsis"><h2>Rating pembaca</h2><StoryRating key={`${user?.id ?? "guest"}:${story.id}`} storyId={story.id} slug={slug} score={rating.data?.score ?? null} signedIn={!!user} eligible={!!reads.data?.length} ownStory={!!user && story.metrics?.author_id === user.id} /></section>}
    <section className="px-synopsis"><h2>Sinopsis</h2><p>{story.description || story.tagline || "Kisah baru menantimu."}</p>{story.tags.length > 0 && <div className="px-chips">{story.tags.map(value => <Link key={value} href={catalogHref({ tag: value })}>#{value}</Link>)}</div>}</section>
    <div className="px-detail-actions">{progress?.current_node_id && !currentKey ? <p role="alert">Bab terakhir belum tersedia. Progresmu tetap tersimpan.</p> : start ? <StoryStart storyId={story.id} slug={slug} startKey={start.node_key} currentKey={currentKey} signedIn={!!user} cost={isOwned(start) ? 0 : start.unlock_cost} balance={access.balance} /> : <p>Awal cerita belum tersedia.</p>}<SaveStory storyId={story.id} accountKey={user?.id ?? "guest"} /></div>
    {story.is_premium && !access.storyOwned && !access.staff && <CoinAction rpc="coin_unlock_story" args={{ p_story_id: story.id }} label="Unlock seluruh cerita premium" cost={story.unlock_cost} balance={access.balance} signedIn={!!user} next={`/stories/${slug}`} />}
    <section className="px-detail-journey"><div className="px-section-heading"><h2>Perjalananmu</h2><span>{progress ? "SEDANG BERJALAN" : "BELUM DIMULAI"}</span></div><div className="px-progress-labels"><span>{discovered} / {chapters.length} bab dijelajahi</span><span>{endings.filter(chapter => chapter.visited).length} / {endings.length} akhir</span></div><ProgressBar value={chapters.length ? discovered / chapters.length * 100 : 0} label="Perjalanan cerita" /><Link className="px-secondary" href={`/stories/${slug}/map`}><GitBranch size={18} />Lihat peta cerita</Link></section>
    <StoryTabs slug={slug} description={story.description || story.tagline} chapters={chapters} edges={edges ?? []} format={story.default_format} />
    </div>
  </main>;
}
