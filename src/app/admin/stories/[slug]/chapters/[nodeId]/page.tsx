import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { beginChapterImages } from "@/app/admin/actions";
import ChapterImageEditor from "@/components/chapter-image-editor";

export default async function ChapterImagesPage({ params }: { params: Promise<{ slug: string; nodeId: string }> }) {
  const { slug, nodeId } = await params;
  const { db, role } = await requireStaff();
  const { data: story } = await db.from("stories").select("id,title,slug").eq("slug", slug).maybeSingle();
  if (!story) notFound();
  const { data: node } = await db.from("story_nodes").select("id,title,node_key").eq("id", nodeId).eq("story_id", story.id).maybeSingle();
  if (!node) notFound();
  const { data: sets } = await db.from("chapter_image_sets").select("id,status,version,published_at").eq("node_id", node.id).in("status", ["draft", "published"]);
  const draft = sets?.find(s => s.status === "draft");
  const published = sets?.find(s => s.status === "published");
  const active = draft ?? published;
  const { data: items } = active ? await db.from("chapter_images").select("id,position,storage_path,alt_text,caption,dialogue,speaker,width,height,source").eq("set_id", active.id).order("position") : { data: [] };
  const images = await Promise.all((items ?? []).map(async item => {
    const { data } = await db.storage.from("story-private").createSignedUrl(item.storage_path, 3600);
    return { ...item, url: data?.signedUrl ?? "" };
  }));
  return <main className="shell page">
    <Link className="text-link" href={`/admin/stories/${slug}`}>← Kembali ke cerita</Link>
    <div className="page-intro"><p className="eyebrow">STUDIO / CHAPTER</p><h1 className="page-title">{node.title}</h1><p>{story.title} · {node.node_key}</p></div>
    {!draft && <form action={beginChapterImages} className="panel"><p>{published ? "Versi terbit tetap tampil saat Anda menyiapkan revisi." : "Buat draft untuk menambahkan gambar."}</p><input type="hidden" name="slug" value={slug} /><input type="hidden" name="node_id" value={node.id} /><button className="primary-button">Mulai edit gambar</button></form>}
    {active && <ChapterImageEditor setId={active.id} version={active.version} editable={!!draft} admin={role === "admin"} images={images}
      providers={{ openrouter: !!process.env.OPENROUTER_API_KEY, kie: !!process.env.KIE_API_KEY && !!process.env.KIE_RESULT_HOSTS }} />}
  </main>;
}
