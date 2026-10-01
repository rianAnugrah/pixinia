import Link from "next/link";
import { requireStaff } from "@/lib/admin";
import { createStory } from "./actions";
import SubmitButton from "@/components/submit-button";
import StoryTaxonomyFields from "@/components/admin/story-taxonomy-fields";

export default async function AdminPage() {
  const { db, role, user } = await requireStaff(); const { data: stories, error } = await db.from("stories").select("id,slug,title,status,default_format").eq("author_id", user.id).order("created_at", { ascending:false });
  if (error) throw error;
  return <main className="shell page"><div className="page-intro"><p className="eyebrow">STUDIO PIXINIA</p><h1 className="page-title">Kelola cerita</h1><p>Rancang graph, tulis bab, dan siapkan media untuk ditinjau.</p>{role === "admin" && <Link className="text-link" href="/admin">Dashboard Admin →</Link>}</div><div className="admin-grid"><section className="panel"><h2>Cerita</h2>{stories?.length ? stories.map(s => <p key={s.id}><Link className="text-link" href={`/studio/stories/${s.slug}`}>{s.title} →</Link> <span className="pill">{s.default_format === "web_novel" ? "Web Novel" : "Komik"} · {s.status}</span></p>) : <p className="muted">Belum ada cerita.</p>}</section><form action={createStory} className="panel"><h2>Cerita baru</h2><label className="field"><span>Format cerita</span><select name="default_format" defaultValue="comic"><option value="comic">Komik</option><option value="web_novel">Web Novel</option></select></label><label className="field"><span>Judul</span><input name="title" required maxLength={200} /></label><label className="field"><span>Slug URL</span><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label><label className="field"><span>Sinopsis</span><textarea name="description" rows={4} /></label><StoryTaxonomyFields /><SubmitButton pendingLabel="Membuat cerita…">Buat cerita</SubmitButton></form></div></main>;
}
