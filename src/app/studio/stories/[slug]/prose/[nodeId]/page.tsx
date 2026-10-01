import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStoryAccess } from "@/lib/admin";
import { saveProse } from "./actions";

export default async function ProseEditor({ params }: { params: Promise<{ slug: string; nodeId: string }> }) {
  const { slug, nodeId } = await params;
  const { db, role, story } = await requireStoryAccess(slug);
  if (!story || story.default_format !== "web_novel") notFound();
  const { data: node } = await db.from("story_nodes").select("id,title,node_key").eq("id", nodeId).eq("story_id", story.id).maybeSingle();
  if (!node) notFound();
  const [{ data: draft }, { data: published }] = await Promise.all([
    db.from("story_node_prose_drafts").select("body,updated_at").eq("node_id", nodeId).maybeSingle(),
    db.from("story_node_prose_publications").select("body,published_at").eq("node_id", nodeId).maybeSingle(),
  ]);
  return <main className="shell page prose-editor-page"><Link className="text-link" href={`/studio/stories/${slug}`}>← Kembali ke cerita</Link>
    <div className="page-intro"><p className="eyebrow">STUDIO / WEB NOVEL</p><h1 className="page-title">{node.title}</h1><p>{story.title} · {node.node_key}</p></div>
    <form action={saveProse} className="panel prose-editor-form">
      <input type="hidden" name="story_id" value={story.id} /><input type="hidden" name="node_id" value={nodeId} /><input type="hidden" name="slug" value={slug} />
      <label className="field"><span>Naskah bab</span><textarea name="body" defaultValue={draft?.body ?? published?.body ?? ""} required maxLength={200000} rows={22} placeholder="Tulis cerita di sini. Pisahkan paragraf dengan baris kosong." /></label>
      <p className="muted">Pisahkan paragraf dengan baris kosong. Draft hanya terlihat oleh tim Studio. Versi terbit hanya bisa dibaca setelah bab terbuka.</p>
      <div className="prose-editor-actions"><button className="secondary-button" type="submit" name="intent" value="draft">Simpan draft</button>{role === "admin" && <button className="primary-button" type="submit" name="intent" value="publish">Terbitkan naskah</button>}</div>
      <p>{published ? `Naskah terbit · ${new Date(published.published_at).toLocaleDateString("id-ID")}` : "Naskah belum diterbitkan."}</p>
    </form>
  </main>;
}
