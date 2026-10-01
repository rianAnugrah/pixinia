import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const coverPath = new URL(request.url).searchParams.get("path");
  if (!coverPath || coverPath.startsWith("/") || coverPath.includes("..")) return new Response(null, { status: 404 });
  const db = await createClient();
  const { data: stories } = await db.from("stories").select("id").eq("cover_path", coverPath).eq("status", "published").eq("visibility", "public").limit(1);
  if (!stories?.length) return new Response(null, { status: 404 });
  const { data } = await db.storage.from("story-public").createSignedUrl(coverPath.replace(/^story-public\//, ""), 300);
  return data ? new Response(null, { status: 307, headers: { Location: data.signedUrl, "Cache-Control": "private, no-store" } }) : new Response(null, { status: 404 });
}
