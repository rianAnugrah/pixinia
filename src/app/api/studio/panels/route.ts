import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { StudioGraph } from "@/lib/studio/graph";

export const runtime = "nodejs";

async function context(request: NextRequest, body?: { storyId?: string; nodeId?: string }) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Masuk dahulu." }, { status: 401 }) };
  const { data: profile } = await db.from("profiles").select("role,is_active").eq("id", user.id).single();
  if (!profile?.is_active || !["admin", "creator"].includes(profile.role)) return { error: NextResponse.json({ error: "Akses ditolak." }, { status: 403 }) };
  const storyId = body?.storyId ?? request.nextUrl.searchParams.get("storyId");
  const nodeId = body?.nodeId ?? request.nextUrl.searchParams.get("nodeId");
  if (!storyId || !nodeId) return { error: NextResponse.json({ error: "Story dan node diperlukan." }, { status: 400 }) };
  const { data: canManage, error: accessError } = await db.rpc("studio_can_manage_story", { p_story_id: storyId });
  if (accessError || !canManage) return { error: NextResponse.json({ error: "Akses cerita ditolak." }, { status: 403 }) };
  const { data: draft } = await db.from("studio_graph_drafts").select("graph").eq("story_id", storyId).maybeSingle();
  if (!(draft?.graph as StudioGraph | undefined)?.nodes.some(node => node.id === nodeId)) return { error: NextResponse.json({ error: "Node tidak ditemukan." }, { status: 404 }) };
  return { db, nodeId, admin: profile.role === "admin" };
}

export async function GET(request: NextRequest) {
  const result = await context(request);
  if (result.error) return result.error;
  const { db, nodeId, admin } = result;
  const { data: sets, error: setError } = await db.from("chapter_image_sets").select("id,status,version").eq("node_id", nodeId).in("status", ["draft", "published"]);
  if (setError) return NextResponse.json({ error: "Gagal memuat panel." }, { status: 500 });
  const draft = sets?.find(set => set.status === "draft");
  const active = draft ?? sets?.find(set => set.status === "published");
  const { data: rows, error: imageError } = active ? await db.from("chapter_images").select("id,position,storage_path,alt_text,caption,dialogue,speaker,width,height,source").eq("set_id", active.id).order("position") : { data: [], error: null };
  if (imageError) return NextResponse.json({ error: "Gagal memuat gambar." }, { status: 500 });
  const images = await Promise.all((rows ?? []).map(async row => {
    const { data } = await db.storage.from("story-private").createSignedUrl(row.storage_path, 3600);
    return { ...row, url: data?.signedUrl ?? "" };
  }));
  return NextResponse.json({ setId: active?.id ?? null, version: active?.version ?? 0, editable: !!draft, admin, images,
    providers: { openrouter: !!process.env.OPENROUTER_API_KEY, kie: !!process.env.KIE_API_KEY } }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  let body: { storyId?: string; nodeId?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
  const result = await context(request, body);
  if (result.error) return result.error;
  const { error } = await result.db.rpc("begin_chapter_image_draft", { p_node_id: result.nodeId });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
