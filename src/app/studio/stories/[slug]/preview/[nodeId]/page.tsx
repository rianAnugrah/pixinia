import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStoryAccess } from "@/lib/admin";
import { assetUrl, type Asset } from "@/lib/data";
import type { StudioGraph } from "@/lib/studio/graph";
import ReaderPanelStack from "@/components/reader-panel-stack";
import { novelParagraphs } from "@/lib/web-novel";

export default async function StudioNodePreview({ params, searchParams }: { params: Promise<{ slug: string; nodeId: string }>; searchParams: Promise<{ embedded?: string }> }) {
  const { slug, nodeId } = await params;
  const embedded = (await searchParams).embedded === "1";
  const { db, story } = await requireStoryAccess(slug);
  if (!story) notFound();
  const { data: draft } = await db.from("studio_graph_drafts").select("graph").eq("story_id", story.id).maybeSingle();
  const graph = draft?.graph as StudioGraph | undefined;
  const node = graph?.nodes.find(item => item.id === nodeId);
  if (!graph || !node) notFound();
  const { data: sets } = await db.from("chapter_image_sets").select("id,status").eq("node_id", nodeId).in("status", ["draft", "published"]);
  const active = sets?.find(set => set.status === "draft") ?? sets?.find(set => set.status === "published");
  const { data: images } = active ? await db.from("chapter_images").select("id,storage_path,alt_text,caption,dialogue,speaker,width,height,position").eq("set_id", active.id).order("position") : { data: null };
  const signedImages = await Promise.all((images ?? []).map(async image => {
    const { data } = await db.storage.from("story-private").createSignedUrl(image.storage_path, 3600);
    return { ...image, url: data?.signedUrl ?? "" };
  }));
  const legacy = !active ? await db.from("story_assets").select("id,node_id,storage_bucket,storage_path,external_provider,external_asset_id,format,asset_type").eq("node_id", nodeId).eq("status", "published") : { data: null };
  const legacyIds = (legacy.data ?? []).map(asset => asset.id);
  const { data: legacyPanels } = legacyIds.length ? await db.from("story_asset_panels").select("id,asset_id,panel_order,caption,dialogue,speaker").in("asset_id", legacyIds).order("panel_order") : { data: null };
  const choices = graph.choices.filter(choice => choice.source === nodeId).sort((a,b) => a.sortOrder-b.sortOrder);
  const { data: proseDraft } = story.default_format === "web_novel" ? await db.from("story_node_prose_drafts").select("body").eq("node_id", nodeId).maybeSingle() : { data: null };
  const { data: prosePublished } = story.default_format === "web_novel" ? await db.from("story_node_prose_publications").select("body").eq("node_id", nodeId).maybeSingle() : { data: null };
  const prose = proseDraft?.body || prosePublished?.body || "";
  return <main className={`reader studio-preview-page ${embedded ? "studio-preview-embedded" : ""}`}>
    {!embedded && <Link href={`/studio/stories/${slug}`} className="text-link">← Kembali ke Story Graph</Link>}
    <p className="eyebrow">PREVIEW STUDIO · {story.default_format === "web_novel" ? proseDraft ? "NASKAH DRAFT" : "NASKAH TERBIT" : active?.status === "draft" ? "PANEL DRAFT" : "PANEL TERBIT"}</p>
    <h1>{node.title}</h1><p className="reader-description">{node.synopsis}</p>
    {story.default_format === "web_novel" ? <article className="web-novel-text">{prose ? novelParagraphs(prose).map((paragraph,index) => <p key={index}>{paragraph}</p>) : <p>Belum ada naskah.</p>}</article> : <ReaderPanelStack panels={active ? signedImages.map(image => ({ id: image.id, url: image.url || null, alt: image.alt_text, width: image.width, height: image.height, speaker: image.speaker, dialogue: image.dialogue, caption: image.caption })) : (legacyPanels ?? []).map(panel => { const asset = legacy.data?.find(item => item.id === panel.asset_id); return { id: panel.id, url: asset ? assetUrl(asset as Asset) : null, alt: panel.caption || `Panel ${panel.panel_order}`, speaker: panel.speaker, dialogue: panel.dialogue, caption: panel.caption }; })} />}
    <section className="choices"><h2>Pilihan berikutnya</h2>{choices.length ? choices.map(choice => <Link key={choice.id} className="choice" href={`/studio/stories/${slug}/preview/${choice.target}`}>{choice.label}<span>→ {graph.nodes.find(item=>item.id===choice.target)?.title ?? "?"}</span></Link>) : <p>Ending · tidak ada pilihan berikutnya.</p>}</section>
  </main>;
}
