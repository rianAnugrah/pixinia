import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
  const db = await createClient();
  // The user's RLS session is used here, including for signed Storage URLs.
  const { data: asset, error } = await db.from("story_assets").select("node_id,external_provider,external_asset_id,storage_bucket,storage_path").eq("id", id).maybeSingle();
  if (error || !asset) return new Response(null, { status: 404 });
  const { data: allowed } = await db.rpc("coin_can_read_node", { p_node: asset.node_id });
  if (!allowed) return new Response(null, { status: 403 });
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (asset.external_provider === "local") {
    const match = /^\/comic\/([a-z0-9-]+\.svg)$/.exec(asset.external_asset_id ?? "");
    if (!match) return new Response(null, { status: 404 });
    try {
      const body = await readFile(path.join(process.cwd(), "content", "comic", match[1]));
      return new Response(new Uint8Array(body), { headers: { ...headers, "Content-Type": "image/svg+xml" } });
    } catch { return new Response(null, { status: 404 }); }
  }
  if (!asset.storage_bucket || !asset.storage_path) return new Response(null, { status: 404 });
  const { data } = await db.storage.from(asset.storage_bucket).createSignedUrl(asset.storage_path, 300);
  return data ? new Response(null, { status: 307, headers: { ...headers, Location: data.signedUrl } }) : new Response(null, { status: 404 });
}
