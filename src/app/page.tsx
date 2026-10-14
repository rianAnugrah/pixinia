import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, GitBranch, ArrowRight, BookOpen, Compass, PenLine, ArrowUpRight } from "lucide-react";
import { getStories } from "@/lib/data";
import { getReaderDashboard } from "@/lib/reader-dashboard";
import { createClient } from "@/lib/supabase/server";
import { Cover, StoryCard, SectionHeading } from "@/components/reader/design-ui";
import { storyGenreLabel } from "@/lib/story-taxonomy";

export default async function Home({ searchParams }: { searchParams: Promise<{ format?: string; genre?: string; tag?: string }> }) {
  const query = await searchParams;
  if (query.format || query.genre || query.tag) { const params = new URLSearchParams(); for (const [key, value] of Object.entries(query)) if (value) params.set(key, value); redirect(`/explore?${params}`); }
  const [stories, dashboard] = await Promise.all([getStories(), getReaderDashboard()]);
  const progress = dashboard.progress.find(row => stories.some(story => story.id === row.story_id));
  const currentStory = stories.find(story => story.id === progress?.story_id);
  const db = await createClient();
  const { data: node, error } = progress?.current_node_id ? await db.from("story_nodes").select("node_key,title").eq("id", progress.current_node_id).eq("status", "published").maybeSingle() : { data: null, error: null };
  if (error) throw error;
  const featured = currentStory || stories[0];
  const genres = [...new Set(stories.flatMap(story => story.genres))].slice(0, 6);
  return <main className="px-page px-home">
    <header className="px-home-header"><Link href="/profile" className="px-greeting"><span className="px-avatar">{dashboard.name.slice(0, 1).toUpperCase()}</span><span><small>{dashboard.user ? "Senang kamu kembali," : "Selamat datang di Pixinia"}</small><strong>{dashboard.name}</strong></span></Link><Link className="px-icon-button" href="/notifications" aria-label="Notifikasi"><Bell size={19} /></Link></header>
    <div className="px-content"><section className="discovery-hero" aria-labelledby="discovery-title"><div className="discovery-hero-copy"><p className="eyebrow"><GitBranch size={14} aria-hidden />{currentStory ? "PERJALANANMU BELUM BERAKHIR" : "CERITA INTERAKTIF. PILIHANMU."}</p><h1 id="discovery-title">{currentStory ? <>Kisahmu masih<br />punya <em>kemungkinan.</em></> : <>Ada dunia lain<br />di balik <em>pilihanmu.</em></>}</h1><p>Temukan komik dan novel dengan jalan cerita yang kamu tentukan sendiri. Ke mana kisahmu akan berakhir?</p><Link className="px-button" href={currentStory ? (node ? `/read/${currentStory.slug}/${node.node_key}` : `/stories/${currentStory.slug}`) : "/explore"}>{currentStory ? "Lanjut membaca" : "Temukan ceritamu"} <ArrowRight size={17} aria-hidden /></Link><span className="discovery-hero-note"><BookOpen size={15} aria-hidden />Baca. Pilih. Temukan akhir yang berbeda.</span></div>{featured && <Link className="discovery-feature" href={`/stories/${featured.slug}`}><div className="discovery-feature-art"><Cover path={featured.cover_path} title={featured.title} /><span className="discovery-feature-label">{currentStory ? "SEDANG KAMU BACA" : "CERITA TERBARU"}</span></div><div><small>{featured.default_format === "web_novel" ? "WEB NOVEL" : "KOMIK"} / {featured.genres.slice(0, 1).map(storyGenreLabel).join("") || "INTERAKTIF"}</small><strong>{featured.title}</strong><span>Buka cerita <ArrowUpRight size={16} aria-hidden /></span></div></Link>}</section>
    <div className="discovery-genres"><span>Jelajahi duniamu</span><div className="px-chips"><Link href="/explore">Semua cerita</Link>{genres.map(genre => <Link key={genre} href={`/explore?genre=${genre}`}>{storyGenreLabel(genre)}</Link>)}</div></div>
    {currentStory && <section className="home-continue-section"><SectionHeading title="Kisahmu belum selesai" href="/library" action="Pustaka kamu" /><article className="px-continue"><Cover path={currentStory.cover_path} title={currentStory.title} /><div><p className="eyebrow">LANJUT MEMBACA</p><h2>{currentStory.title}</h2><p className="px-muted">{node?.title || "Perjalananmu tersimpan. Kembali ke ceritamu."}</p><Link className="px-button px-button-small" href={node ? `/read/${currentStory.slug}/${node.node_key}` : `/stories/${currentStory.slug}`}>Lanjutkan cerita <ArrowRight size={16} aria-hidden /></Link></div><Link className="continue-map" href={`/stories/${currentStory.slug}/map`}><GitBranch size={20} aria-hidden /><span>Lihat perjalananmu</span><ArrowUpRight size={16} aria-hidden /></Link></article></section>}
    <section className="home-catalog"><SectionHeading title="Kisah untuk dijelajahi" href="/explore" action="Semua cerita" /><p className="section-description">Dunia yang berbeda. Pilihan yang berarti. Mulai dari cerita yang menarikmu.</p><div className="px-story-rail">{stories.slice(0, 8).map(story => <StoryCard key={story.id} story={story} />)}</div>{!stories.length && <div className="empty-state"><BookOpen size={28} /><h2>Cerita sedang disiapkan</h2><p>Kembali lagi untuk petualangan baru.</p></div>}</section>
    <section className="discovery-paths" aria-label="Pilihan format cerita"><Link href="/explore?format=web_novel"><span className="discovery-path-icon"><PenLine size={24} aria-hidden /></span><div><small>UNTUK IMAJINASIMU</small><h2>Tersesat dalam kata.</h2><p>Novel yang memberi ruang untuk pilihanmu.</p></div><ArrowUpRight size={23} aria-hidden /></Link><Link href="/explore?format=comic"><span className="discovery-path-icon"><BookOpen size={24} aria-hidden /></span><div><small>UNTUK SUDUT PANDANG BARU</small><h2>Masuk ke dalam panel.</h2><p>Komik dengan kisah yang ikut kamu bentuk.</p></div><ArrowUpRight size={23} aria-hidden /></Link></section>
    <div className="discovery-footer"><span><GitBranch size={18} aria-hidden />Setiap pilihan berarti.</span><Link href="/welcome">Kenali Pixinia <Compass size={16} aria-hidden /></Link></div>
    </div>
  </main>;
}
