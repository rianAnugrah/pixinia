import { notFound } from "next/navigation";
import { requireStoryAccess } from "@/lib/admin";
import { assetUrl, type Asset } from "@/lib/data";
import StoryWorkspace from "@/components/studio/story-workspace";
import type { StudioGraph } from "@/lib/studio/graph";
import { updateStoryTaxonomy } from "@/app/studio/actions";
import StoryTaxonomyFields from "@/components/admin/story-taxonomy-fields";
import SubmitButton from "@/components/submit-button";
import CoverUploader from "@/components/admin/cover-uploader";

export default async function AdminStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, role, story } = await requireStoryAccess(slug);
  if (!story) notFound();
  const { data: draft, error } = await db.rpc("studio_begin_graph", { p_story_id: story.id });
  if (error || !draft) throw new Error(error?.message ?? "Draft graph tidak dapat dibuka.");
  const graph = draft.graph as StudioGraph;
  const nodeIds = graph.nodes.map(node => node.id);
  const [{ data: sets }, { data: assets }, { data: publicNodes }, { data: prose }] = await Promise.all([
    nodeIds.length ? db.from("chapter_image_sets").select("id,node_id,status").in("node_id", nodeIds).in("status", ["draft", "published"]) : Promise.resolve({ data: [] }),
    nodeIds.length ? db.from("story_assets").select("id,node_id,storage_bucket,storage_path,external_provider,external_asset_id,format,asset_type,status").in("node_id", nodeIds).eq("status", "published") : Promise.resolve({ data: [] }),
    nodeIds.length ? db.from("story_nodes").select("id,status").in("id", nodeIds) : Promise.resolve({ data: [] }),
    story.default_format === "web_novel" && nodeIds.length ? db.from("story_node_prose_publications").select("node_id").in("node_id", nodeIds) : Promise.resolve({ data: [] }),
  ]);
  const thumbnails: Record<string, string> = {};
  const counts: Record<string, number> = {};
  const publishedMedia = new Set<string>();
  if (story.default_format === "web_novel") for (const item of prose ?? []) publishedMedia.add(item.node_id);
  for (const asset of assets ?? []) {
    publishedMedia.add(asset.node_id);
    counts[asset.node_id] = (counts[asset.node_id] ?? 0) + 1;
    thumbnails[asset.node_id] ??= assetUrl(asset as Asset) ?? "";
  }
  const setIds = (sets ?? []).map(set => set.id);
  if (setIds.length) {
    const { data: images } = await db.from("chapter_images").select("set_id,position,storage_path").in("set_id", setIds).order("position");
    for (const set of sets ?? []) {
      const setImages = (images ?? []).filter(image => image.set_id === set.id);
      if (set.status === "published") publishedMedia.add(set.node_id);
      counts[set.node_id] = setImages.length || counts[set.node_id] || 0;
      if (setImages[0]) {
        const { data } = await db.storage.from("story-private").createSignedUrl(setImages[0].storage_path, 3600);
        if (data?.signedUrl) thumbnails[set.node_id] = data.signedUrl;
      }
    }
  }
  return <StoryWorkspace story={{ id: story.id, title: story.title, slug: story.slug, status: story.status, default_format: story.default_format }}
    sidebarContent={<><CoverUploader storyId={story.id} /><details className="studio-taxonomy-details"><summary>Genre & tag cerita</summary><form action={updateStoryTaxonomy}><input type="hidden" name="story_id" value={story.id} /><input type="hidden" name="slug" value={story.slug} /><StoryTaxonomyFields genres={story.genres} tags={story.tags} /><SubmitButton pendingLabel="Menyimpan…">Simpan genre & tag</SubmitButton></form></details></>}
    initialGraph={graph} initialVersion={draft.version} publicationVersion={draft.publication_version}
    admin={role === "admin"} thumbnails={thumbnails} panelCounts={counts}
    publishedNodeIds={(publicNodes ?? []).filter(node => node.status === "published").map(node => node.id)}
    publishedMediaIds={[...publishedMedia]} />;
}
