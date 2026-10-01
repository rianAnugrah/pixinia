import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStoryAccess } from "@/lib/admin";
import { beginChapterImages } from "@/app/studio/actions";
import ChapterImageEditor from "@/components/chapter-image-editor";
import SubmitButton from "@/components/submit-button";

export default async function ChapterImagesPage({ params }: { params: Promise<{ slug: string; nodeId: string }> }) {
  const { slug, nodeId } = await params;
  const { db, role, story } = await requireStoryAccess(slug);
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
    <Link className="text-link" href={`/studio/stories/${slug}`}>← Kembali ke cerita</Link>
    <div className="page-intro"><p className="eyebrow">STUDIO / CHAPTER</p><h1 className="page-title">{node.title}</h1><p>{story.title} · {node.node_key}</p></div>
    {!draft && <form action={beginChapterImages} className="panel"><p>{published ? "Versi terbit tetap tampil saat Anda menyiapkan revisi." : "Buat draft untuk menambahkan gambar."}</p><input type="hidden" name="slug" value={slug} /><input type="hidden" name="node_id" value={node.id} /><SubmitButton pendingLabel="Menyiapkan draft…">Mulai edit gambar</SubmitButton></form>}
    {active && <ChapterImageEditor setId={active.id} version={active.version} editable={!!draft} admin={role === "admin"} images={images}
      providers={{ openrouter: !!process.env.OPENROUTER_API_KEY, kie: !!process.env.KIE_API_KEY }} />}
  </main>;
}
