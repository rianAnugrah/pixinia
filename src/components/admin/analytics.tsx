import Link from "next/link";
import type { Analytics } from "@/lib/story-engagement";
import { ratingLabel } from "@/lib/story-engagement";

export default function AnalyticsView({ data, days, format, authorId, authors }: { data: Analytics; days: number; format?: string; authorId?: string; authors?: { id: string; display_name: string | null }[] }) {
  return <main className="shell page"><div className="page-intro"><p className="eyebrow">ANALYTICS</p><h1 className="page-title">Statistik pembaca</h1><p>Sesi valid minimal 30 detik aktif. Pembaca unik dihitung dari akun berbeda. Rating mencakup seluruh periode.</p></div>
    <form className="admin-filter"><label className="field"><span>Periode membaca</span><select name="days" defaultValue={days}>{[7, 30, 90, 365].map(n => <option key={n} value={n}>{n} hari terakhir</option>)}</select></label>
      <label className="field"><span>Format</span><select name="format" defaultValue={format || ""}><option value="">Semua format</option><option value="comic">Komik</option><option value="web_novel">Web Novel</option><option value="motion_comic">Motion Comic</option><option value="video">Video</option></select></label>
      {authors && <label className="field"><span>Author</span><select name="author" defaultValue={authorId || ""}><option value="">Semua author</option>{authors.map(a => <option key={a.id} value={a.id}>{a.display_name || "Creator"}</option>)}</select></label>}
      <button className="primary-button">Terapkan</button></form>
    <div className="admin-stat-grid">{[{ title: "Kali dibaca", value: data.reads }, { title: "Pembaca unik", value: data.readers }, { title: "Cerita", value: data.stories }, { title: "Rating", value: data.ratings }].map(s => <div className="panel" key={s.title}><small>{s.title}</small><strong>{s.value.toLocaleString("id-ID")}</strong></div>)}</div>
    <section className="panel"><h2>Aktivitas harian · WIB</h2>{data.daily.length ? <div className="analytics-bars">{data.daily.map(d => <div key={d.day}><span>{d.day}</span><meter min={0} max={Math.max(1, ...data.daily.map(d => d.reads))} value={d.reads} aria-label={`${d.day}: ${d.reads} sesi`} /><span>{d.reads} sesi · {d.readers} pembaca</span></div>)}</div> : <p>Belum ada sesi membaca dalam periode ini.</p>}</section>
    <section className="panel admin-table-wrap"><h2>Cerita terpopuler</h2><table className="admin-table"><thead><tr><th>Cerita</th><th>Status</th><th>Kali dibaca</th><th>Pembaca unik</th><th>Rating</th></tr></thead><tbody>{data.top_stories.map(s => <tr key={s.id}><td><Link href={`/studio/stories/${s.slug}`}>{s.title}</Link></td><td>{s.status}</td><td>{s.read_count}</td><td>{s.reader_count}</td><td>{ratingLabel(s.rating_average, s.rating_count)}</td></tr>)}</tbody></table>{!data.top_stories.length && <p>Belum ada karya.</p>}</section>
  </main>;
}
