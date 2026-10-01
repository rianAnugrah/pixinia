import Link from "next/link";
import { getStories, storyCoverUrl, storyFormatLabel } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { catalogHref, knownStoryGenre, storyGenreLabel } from "@/lib/story-taxonomy";

export default async function Home({ searchParams }: { searchParams: Promise<{ format?: string; genre?: string; tag?: string }> }) {
  const requested = await searchParams;
  const requestedFormat = requested.format;
  const format = requestedFormat === "web_novel" ? "web_novel" : requestedFormat === "comic" ? "comic" : null;
  const [stories, db] = await Promise.all([getStories(), createClient()]);
  const { data: { user } } = await db.auth.getUser();
  const { data: progressRows, error: progressError } = user ? await db.from("user_story_progress").select("story_id,current_node_id,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1) : { data: [], error: null };
  if (progressError) throw progressError;
  const progress = progressRows?.[0];
  const currentStory = stories.find(story => story.id === progress?.story_id);
  const { data: currentNode, error: nodeError } = currentStory && progress?.current_node_id ? await db.from("story_nodes").select("node_key,title").eq("id", progress.current_node_id).eq("status", "published").maybeSingle() : { data: null, error: null };
  if (nodeError) throw nodeError;
  const featured = stories[0];
  const genre = requested.genre && knownStoryGenre(requested.genre) ? requested.genre : null;
  const allTags = [...new Set(stories.flatMap(story => story.tags))].sort((a, b) => a.localeCompare(b, "id"));
  const tag = requested.tag && allTags.includes(requested.tag) ? requested.tag : null;
  const availableGenres = [...new Set(stories.flatMap(story => story.genres))].filter(knownStoryGenre);
  const visibleStories = stories.filter(story =>
    (!format || (format === "comic" ? story.default_format !== "web_novel" : story.default_format === "web_novel"))
    && (!genre || story.genres.includes(genre)) && (!tag || story.tags.includes(tag)));
  const featuredCover = featured ? storyCoverUrl(featured.cover_path) : null;
  return <main className="reader-home">
    <section className="reader-home-featured" style={featuredCover ? { backgroundImage: `linear-gradient(0deg,#08111d 0%,#08111d33 72%),url(${JSON.stringify(featuredCover)})` } : undefined}>
      <div className="reader-home-hero-content"><p className="reader-home-eyebrow">CERITA PILIHAN PIXINIA</p><h1>{featured?.title || "Setiap pilihan membuka cerita baru."}</h1><p>{featured?.tagline || featured?.description || "Jelajahi komik interaktif dan tentukan arah kisahmu."}</p><Link className="primary-button" href={featured ? `/stories/${featured.slug}` : "#cerita"}>{featured ? "Baca cerita" : "Jelajahi cerita"} <span aria-hidden>→</span></Link></div>
    </section>
    <div className="reader-home-sections">
      {currentStory && currentNode && <section className="reader-home-section"><h2>Lanjut membaca</h2><Link className="reader-continue-card" href={`/read/${currentStory.slug}/${currentNode.node_key}`}><span className="reader-continue-art" style={storyCoverUrl(currentStory.cover_path) ? { backgroundImage: `url(${JSON.stringify(storyCoverUrl(currentStory.cover_path))})` } : undefined} aria-hidden>✦</span><span><strong>{currentStory.title}</strong><small>{currentNode.title}</small></span><span aria-hidden>→</span></Link></section>}
      <section className="reader-home-section" id="cerita"><div className="reader-home-heading"><h2>Jelajahi cerita</h2><span>{visibleStories.length} cerita</span></div>
        <nav className="story-format-filters" aria-label="Format cerita"><Link href={catalogHref({ genre, tag })} aria-current={!format ? "page" : undefined}>Semua</Link><Link href={catalogHref({ format: "comic", genre, tag })} aria-current={format === "comic" ? "page" : undefined}>Komik</Link><Link href={catalogHref({ format: "web_novel", genre, tag })} aria-current={format === "web_novel" ? "page" : undefined}>Web Novel</Link></nav>
        {!!availableGenres.length && <nav className="story-format-filters story-taxonomy-filters" aria-label="Genre cerita"><Link href={catalogHref({ format, tag })} aria-current={!genre ? "page" : undefined}>Semua genre</Link>{availableGenres.map(value => <Link key={value} href={catalogHref({ format, genre: value, tag })} aria-current={genre === value ? "page" : undefined}>{storyGenreLabel(value)}</Link>)}</nav>}
        {!!allTags.length && <nav className="story-format-filters story-taxonomy-filters" aria-label="Tag cerita"><Link href={catalogHref({ format, genre })} aria-current={!tag ? "page" : undefined}>Semua tag</Link>{allTags.map(value => <Link key={value} href={catalogHref({ format, genre, tag: value })} aria-current={tag === value ? "page" : undefined}>#{value}</Link>)}</nav>}
        {visibleStories.length ? <div className="reader-home-grid">{visibleStories.map(story => <Link key={story.id} href={`/stories/${story.slug}`} className="reader-home-card"><div className="reader-home-card-art" style={storyCoverUrl(story.cover_path) ? { backgroundImage: `url(${JSON.stringify(storyCoverUrl(story.cover_path))})` } : undefined}><span aria-hidden>✦</span></div><span className="story-format-label">{storyFormatLabel(story.default_format)}</span><strong>{story.title}</strong><small>{story.tagline || story.description || "Cerita interaktif"}</small><span className="story-card-taxonomy">{story.genres.map(value => storyGenreLabel(value)).join(" · ")}</span></Link>)}</div> : <div className="empty-state"><h3>Belum ada cerita yang cocok</h3><p>Coba ubah genre, tag, atau format.</p><Link className="text-link" href="/#cerita">Lihat semua cerita →</Link></div>}
      </section>
    </div>
  </main>;
}
