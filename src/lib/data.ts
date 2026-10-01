import { createClient } from "@/lib/supabase/server";

export type Story = { id: string; slug: string; title: string; tagline: string | null; description: string | null; cover_path: string | null; default_format: string; unlock_cost: number; is_premium: boolean; genres: string[]; tags: string[]; };
export const storyFormatLabel = (format: string) => format === "web_novel" ? "Web Novel" : format === "motion_comic" ? "Motion Comic" : format === "video" ? "Video" : "Komik";
export type Node = { id: string; story_id: string; node_key: string; title: string; synopsis: string | null; node_type: string; is_start: boolean; status: string; unlock_cost: number; is_premium: boolean; };
export type Choice = { id: string; node_id: string; next_node_id: string; label: string; description: string | null; sort_order: number; };
export type Panel = { id: string; asset_id: string; panel_order: number; dialogue: string | null; caption: string | null; speaker: string | null; };
export type Asset = { id: string; node_id: string; storage_bucket: string | null; storage_path: string | null; external_provider: string | null; external_asset_id: string | null; format: string; asset_type: string; };

export async function getStories(): Promise<Story[]> {
  const db = await createClient();
  const { data, error } = await db.from("stories").select("id,slug,title,tagline,description,cover_path,default_format,unlock_cost,is_premium,genres,tags").eq("status", "published").eq("visibility", "public").order("published_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getStory(slug: string): Promise<Story | null> {
  const db = await createClient();
  const { data, error } = await db.from("stories").select("id,slug,title,tagline,description,cover_path,default_format,unlock_cost,is_premium,genres,tags").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw error;
  return data;
}

export async function getNode(storyId: string, nodeKey: string): Promise<Node | null> {
  const db = await createClient();
  const { data, error } = await db.from("story_nodes").select("id,story_id,node_key,title,synopsis,node_type,is_start,status,unlock_cost,is_premium").eq("story_id", storyId).eq("node_key", nodeKey).eq("status", "published").maybeSingle();
  if (error) throw error;
  return data;
}

export async function getNodeContent(nodeId: string) {
  const db = await createClient();
  const [assets, choices] = await Promise.all([
    db.from("story_assets").select("id,node_id,storage_bucket,storage_path,external_provider,external_asset_id,format,asset_type").eq("node_id", nodeId).eq("status", "published"),
    db.from("story_choices").select("id,node_id,next_node_id,label,description,sort_order").eq("node_id", nodeId).order("sort_order"),
  ]);
  if (assets.error) throw assets.error;
  if (choices.error) throw choices.error;
  const list = (assets.data ?? []) as Asset[];
  const ids = list.map(a => a.id);
  const panelResult = ids.length ? await db.from("story_asset_panels").select("id,asset_id,panel_order,dialogue,caption,speaker").in("asset_id", ids).order("panel_order") : { data: [] as Panel[], error: null };
  if (panelResult.error) throw panelResult.error;
  return { assets: list, choices: (choices.data ?? []) as Choice[], panels: (panelResult.data ?? []) as Panel[] };
}

export function assetUrl(asset: Asset): string | null {
  if (asset.external_provider === "local" || (asset.storage_bucket && asset.storage_path)) return `/api/reader/assets/${asset.id}`;
  return null;
}

export function storyCoverUrl(coverPath: string | null): string | null {
  if (!coverPath) return null;
  if (coverPath.startsWith("/") && !coverPath.startsWith("//")) return coverPath;
  const publicPath = coverPath.replace(/^story-public\//, "");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !publicPath || publicPath.includes("..")) return null;
  return `/api/reader/cover?path=${encodeURIComponent(coverPath)}`;
}

export async function getPublishedPanelCounts(nodeIds: string[]): Promise<Record<string, number>> {
  if (!nodeIds.length) return {};
  const db = await createClient();
  const [{ data: sets, error: setsError }, { data: assets, error: assetsError }] = await Promise.all([
    db.from("chapter_image_sets").select("id,node_id").eq("status", "published").in("node_id", nodeIds),
    db.from("story_assets").select("id,node_id").eq("status", "published").in("node_id", nodeIds),
  ]);
  if (setsError) throw setsError;
  if (assetsError) throw assetsError;
  const setIds = (sets ?? []).map(set => set.id);
  const assetIds = (assets ?? []).map(asset => asset.id);
  const [{ data: images, error: imagesError }, { data: panels, error: panelsError }] = await Promise.all([
    setIds.length ? db.from("chapter_images").select("set_id").in("set_id", setIds) : Promise.resolve({ data: [], error: null }),
    assetIds.length ? db.from("story_asset_panels").select("asset_id").in("asset_id", assetIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (imagesError) throw imagesError;
  if (panelsError) throw panelsError;
  const counts: Record<string, number> = {};
  for (const nodeId of nodeIds) counts[nodeId] = 0;
  const setToNode = new Map((sets ?? []).map(set => [set.id, set.node_id]));
  const assetToNode = new Map((assets ?? []).map(asset => [asset.id, asset.node_id]));
  for (const image of images ?? []) { const nodeId = setToNode.get(image.set_id); if (nodeId) counts[nodeId]++; }
  for (const panel of panels ?? []) { const nodeId = assetToNode.get(panel.asset_id); if (nodeId && !(sets ?? []).some(set => set.node_id === nodeId)) counts[nodeId]++; }
  return counts;
}

export async function getPublishedChapterImages(nodeId: string) {
  const db = await createClient();
  const { data: set, error: setError } = await db.from("chapter_image_sets").select("id").eq("node_id", nodeId).eq("status", "published").maybeSingle();
  if (setError) throw setError;
  if (!set) return null;
  const { data: images, error } = await db.from("chapter_images").select("id,position,storage_path,alt_text,caption,dialogue,speaker,width,height").eq("set_id", set.id).order("position");
  if (error) throw error;
  return Promise.all((images ?? []).map(async image => {
    const { data } = await db.storage.from("story-private").createSignedUrl(image.storage_path, 300);
    return { ...image, url: data?.signedUrl ?? null };
  }));
}
