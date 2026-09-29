import Link from "next/link";
import { getStories } from "@/lib/data";

export default async function Home() {
  const stories = await getStories();
  return <main>
    <section className="hero"><div className="shell hero-inner"><p className="eyebrow">KISAH YANG KAMU TENTUKAN</p><h1>Setiap pilihan membuka cerita baru.</h1><p className="hero-copy">Jelajahi komik interaktif. Baca, pilih arah cerita, dan temukan semua akhir yang tersembunyi.</p><a className="primary-button" href="#cerita">Jelajahi cerita <span aria-hidden>↗</span></a></div></section>
    <section className="shell section" id="cerita"><div className="section-heading"><div><p className="eyebrow">PERPUSTAKAAN PIXINIA</p><h2>Cerita untuk dijelajahi</h2></div><span>{stories.length} cerita</span></div>
      {stories.length ? <div className="story-grid">{stories.map((story, index) => <Link key={story.id} href={`/stories/${story.slug}`} className="story-card"><div className={`story-cover cover-${index % 4}`} aria-hidden="true"><span>✦</span></div><div className="story-card-content"><span className="story-tag">KOMIK INTERAKTIF</span><h3>{story.title}</h3><p>{story.tagline || story.description}</p><span className="story-link">Baca cerita <span aria-hidden>→</span></span></div></Link>)}</div> : <div className="empty-state"><h3>Belum ada cerita terbit</h3><p>Studio sedang menyiapkan kisah pertama. Kembali lagi sebentar.</p></div>}
    </section>
  </main>;
}
