import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { createChoice, createNode } from "@/app/admin/actions";

export default async function AdminStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db } = await requireStaff();
  const { data: story } = await db.from("stories").select("id,title,slug,status").eq("slug", slug).maybeSingle();
  if (!story) notFound();
  const [{ data: nodes }, { data: choices }] = await Promise.all([
    db.from("story_nodes").select("id,node_key,title,node_type,is_start,status").eq("story_id", story.id).order("created_at"),
    db.from("story_choices").select("id,node_id,next_node_id,label").eq("story_id", story.id),
  ]);
  return <main className="shell page">
    <div className="page-intro"><p className="eyebrow">STUDIO / CERITA</p><h1 className="page-title">{story.title}</h1><p>Status: {story.status}</p></div>
    <div className="admin-grid">
      <section className="panel"><h2>Chapter dan pilihan</h2>{nodes?.map(n => <div key={n.id} style={{ borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
        <strong>{n.title}</strong> <span className="pill">{n.node_key}</span>{n.is_start && <span className="pill">awal</span>}{n.node_type === "ending" && <span className="pill">akhir</span>}
        <p className="muted">{choices?.filter(c => c.node_id === n.id).map(c => `${c.label} → ${nodes.find(t => t.id === c.next_node_id)?.title || "?"}`).join(" · ") || "Belum ada pilihan"}</p>
        <Link className="text-link" href={`/admin/stories/${slug}/chapters/${n.id}`}>Kelola gambar →</Link>
      </div>)}</section>
      <form action={createNode} className="panel"><h2>Tambah chapter</h2><input type="hidden" name="story_id" value={story.id} /><input type="hidden" name="slug" value={slug} />
        <label className="field"><span>Kunci chapter</span><input name="node_key" required /></label>
        <label className="field"><span>Judul</span><input name="title" required /></label>
        <label className="field"><span>Ringkasan</span><textarea name="synopsis" rows={4} /></label>
        <label className="field"><span>Jenis</span><select name="node_type"><option value="episode">Episode</option><option value="ending">Ending</option></select></label>
        <label><input type="checkbox" name="is_start" /> Chapter awal</label><p><button className="primary-button">Tambah chapter</button></p>
      </form>
    </div>
    {(nodes?.length || 0) > 1 && <form action={createChoice} className="panel" style={{ marginTop: 20 }}><h2>Tambah pilihan</h2><input type="hidden" name="story_id" value={story.id} /><input type="hidden" name="slug" value={slug} />
      <div className="admin-grid"><label className="field"><span>Dari</span><select name="node_id">{nodes?.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}</select></label>
        <label className="field"><span>Ke</span><select name="next_node_id">{nodes?.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}</select></label></div>
      <label className="field"><span>Teks pilihan</span><input name="label" required /></label><button className="primary-button">Tambah pilihan</button>
    </form>}
  </main>;
}
