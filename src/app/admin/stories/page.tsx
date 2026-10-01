import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { AssignAuthor } from "@/components/admin/account-forms";
import { getStoryMetrics, ratingLabel } from "@/lib/story-engagement";

export default async function StoriesPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { db } = await requireAdmin(); const params = await searchParams;
  const q = (params.q || "").replace(/[%_]/g, "").trim().slice(0, 100);
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page || "1", 10) || 1));
  let query = db.from("stories").select("id,title,slug,status,default_format,author_id", { count: "exact" }).order("created_at", { ascending: false }).order("id").range((page - 1) * 25, page * 25 - 1);
  if (q) query = query.ilike("title", `%${q}%`);
  const [stories, authors] = await Promise.all([query, db.from("profiles").select("id,display_name").in("role", ["creator", "admin"]).eq("is_active", true).order("display_name")]);
  if (stories.error) throw stories.error; if (authors.error) throw authors.error;
  const metrics = await getStoryMetrics(db, (stories.data ?? []).map(s => s.id));
  return <main className="shell page"><div className="page-intro"><p className="eyebrow">ADMIN / CERITA</p><h1 className="page-title">Semua komik & novel</h1><p>{stories.count ?? 0} cerita. Tetapkan author untuk mengatur kepemilikan Studio.</p></div>
    <form className="admin-filter"><label className="field"><span>Cari judul</span><input name="q" defaultValue={q} /></label><button className="primary-button">Cari</button></form>
    <div className="admin-grid">{stories.data?.map(s => { const m = metrics.find(m => m.story_id === s.id); return <section className="panel" key={s.id}><h2>{s.title}</h2><p>{s.default_format === "web_novel" ? "Web Novel" : "Komik"} · {s.status}</p><p>Author: {m?.author_name}</p><p>{ratingLabel(m?.rating_average, m?.rating_count)}</p><p>{m?.read_count ?? 0} kali dibaca · {m?.reader_count ?? 0} pembaca unik</p>
      <AssignAuthor storyId={s.id} authorId={s.author_id} authors={authors.data ?? []} /><Link className="text-link" href={`/studio/stories/${s.slug}`}>Buka editor →</Link></section>; })}</div>
    {!stories.data?.length && <p>Belum ada cerita yang sesuai.</p>}
    <nav className="admin-pagination" aria-label="Halaman cerita">{page > 1 && <Link href={`/admin/stories?q=${encodeURIComponent(q)}&page=${page - 1}`}>← Sebelumnya</Link>}<span>Halaman {page}</span>{page * 25 < (stories.count ?? 0) && <Link href={`/admin/stories?q=${encodeURIComponent(q)}&page=${page + 1}`}>Berikutnya →</Link>}</nav>
  </main>;
}
