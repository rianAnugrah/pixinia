import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Coins, GitBranch, ArrowRight, Sparkles, BookOpen, Compass } from "lucide-react";
import { getStories } from "@/lib/data";
import { getReaderDashboard } from "@/lib/reader-dashboard";
import { createClient } from "@/lib/supabase/server";
import { Cover, StoryCard, SectionHeading, MenuLink } from "@/components/reader/design-ui";

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
  return <main className="px-page px-home">
    <header className="px-home-header"><Link href="/profile" className="px-greeting"><span className="px-avatar">{dashboard.name.slice(0, 1).toUpperCase()}</span><span><small>{dashboard.user ? "Selamat datang kembali" : "Selamat datang di Pixinia"}</small><strong>{dashboard.name}</strong></span></Link><div><Link href="/account" className="px-coin-pill"><Coins size={14} />{dashboard.balance.toLocaleString("id-ID")}</Link><Link className="px-icon-button" href="/notifications" aria-label="Notifikasi"><Bell size={18} /></Link></div></header>
    <div className="px-content"><SectionHeading title={currentStory ? "Lanjut membaca" : "Mulai petualanganmu"} href={currentStory ? "/library" : "/explore"} />
      {featured ? <article className="px-continue"><Cover path={featured.cover_path} title={featured.title} /><div><h2>{featured.title}</h2><p className="px-gold">{node?.title || "Setiap pilihan membuka jalan baru"}</p><p className="px-muted">{currentStory ? "Perjalananmu tersimpan. Lanjutkan kisahmu." : featured.tagline || "Temukan dunia dan takdirmu sendiri."}</p><Link className="px-button px-button-small" href={currentStory && node ? `/read/${featured.slug}/${node.node_key}` : `/stories/${featured.slug}`}>{currentStory ? "Lanjutkan" : "Mulai membaca"}</Link></div></article> : <div className="empty-state"><BookOpen /><h2>Cerita sedang disiapkan</h2><p>Kembali lagi untuk petualangan baru.</p></div>}
      {currentStory && <Link className="px-journey-banner" href={`/stories/${currentStory.slug}/map`}><span><GitBranch size={18} /></span><div><small>PERJALANANMU SAAT INI</small><strong>{node?.title || currentStory.title}</strong></div><ArrowRight size={17} /></Link>}
      <SectionHeading title="Pilihan cerita" href="/explore" action="Jelajahi" /><div className="px-story-rail">{stories.slice(0, 8).map(story => <StoryCard key={story.id} story={story} />)}</div>
      <div className="px-discoveries"><MenuLink href="/explore?format=web_novel" icon={<Sparkles size={18} />} title="Dunia dalam kata" detail="Temukan web novel untuk perjalanan berikutnya" /><MenuLink href="/explore?format=comic" icon={<BookOpen size={18} />} title="Cerita bergambar" detail="Jelajahi komik dan pilihan yang mengubah cerita" /><MenuLink href="/journey" icon={<GitBranch size={18} />} title="Jelajahi jalur cerita" detail="Temukan pilihan dan akhir yang belum kamu baca" /><MenuLink href="/welcome" icon={<Compass size={18} />} title="Kenali Pixinia" detail="Satu cerita, banyak kemungkinan" /></div>
    </div>
  </main>;
}

