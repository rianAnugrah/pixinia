import Link from "next/link";
import { requireStaff } from "@/lib/admin";
import { createStory } from "./actions";

export default async function AdminPage() {
  const { db } = await requireStaff(); const { data: stories } = await db.from("stories").select("id,slug,title,status").order("created_at", { ascending:false });
  return <main className="shell page"><div className="page-intro"><p className="eyebrow">STUDIO PIXINIA</p><h1 className="page-title">Kelola cerita</h1><p>Rancang graph, tulis bab, dan siapkan media untuk ditinjau.</p></div><div className="admin-grid"><section className="panel"><h2>Cerita</h2>{stories?.length ? stories.map(s => <p key={s.id}><Link className="text-link" href={`/admin/stories/${s.slug}`}>{s.title} →</Link> <span className="pill">{s.status}</span></p>) : <p className="muted">Belum ada cerita.</p>}</section><form action={createStory} className="panel"><h2>Cerita baru</h2><label className="field"><span>Judul</span><input name="title" required maxLength={200} /></label><label className="field"><span>Slug URL</span><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label><label className="field"><span>Sinopsis</span><textarea name="description" rows={4} /></label><button className="primary-button">Buat cerita</button></form></div></main>;
}
