import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prosePlainLength, sanitizeProseHtml } from "@/lib/web-novel";

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
  const { data: story, error: storyError } = await db.from("stories").select("id,slug,default_format").eq("id", storyId).maybeSingle();
  if (storyError || !story || story.default_format !== "web_novel") return { error: NextResponse.json({ error: "Cerita web novel tidak ditemukan." }, { status: 404 }) };
  const { data: node, error: nodeError } = await db.from("story_nodes").select("id").eq("id", nodeId).eq("story_id", storyId).maybeSingle();
  if (nodeError || !node) return { error: NextResponse.json({ error: "Node tidak ditemukan." }, { status: 404 }) };
  const { data: canManage, error: accessError } = await db.rpc("studio_can_manage_story", { p_story_id: storyId });
  if (accessError || !canManage) return { error: NextResponse.json({ error: "Akses cerita ditolak." }, { status: 403 }) };
  return { db, story, nodeId, admin: profile.role === "admin" };
}

export async function GET(request: NextRequest) {
  const result = await context(request);
  if (result.error) return result.error;
  const { db, nodeId, admin } = result;
  const [{ data: draft }, { data: published }] = await Promise.all([
    db.from("story_node_prose_drafts").select("body").eq("node_id", nodeId).maybeSingle(),
    db.from("story_node_prose_publications").select("body,published_at").eq("node_id", nodeId).maybeSingle(),
  ]);
  return NextResponse.json(
    { draftBody: draft?.body ?? null, publishedBody: published?.body ?? null, publishedAt: published?.published_at ?? null, admin },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: NextRequest) {
  let body: { storyId?: string; nodeId?: string; html?: string; intent?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
  const result = await context(request, body);
  if (result.error) return result.error;
  const { db, story, nodeId, admin } = result;
  const html = sanitizeProseHtml(String(body.html ?? ""));
  const publish = body.intent === "publish";
  const length = prosePlainLength(html);
  if (length > 200000) return NextResponse.json({ error: "Naskah maksimal 200.000 karakter." }, { status: 400 });
  if (publish && length === 0) return NextResponse.json({ error: "Naskah tidak boleh kosong untuk diterbitkan." }, { status: 400 });
  if (publish && !admin) return NextResponse.json({ error: "Hanya admin dapat menerbitkan naskah." }, { status: 403 });
  const { error } = await db.from("story_node_prose_drafts").upsert({ node_id: nodeId, body: html }, { onConflict: "node_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  let publishedAt: string | null = null;
  if (publish) {
    publishedAt = new Date().toISOString();
    const { error: publishError } = await db.from("story_node_prose_publications").upsert({ node_id: nodeId, body: html, published_at: publishedAt }, { onConflict: "node_id" });
    if (publishError) return NextResponse.json({ error: publishError.message }, { status: 400 });
  }
  revalidatePath(`/studio/stories/${story.slug}`);
  revalidatePath(`/read/${story.slug}`);
  return NextResponse.json({ ok: true, publishedAt });
}
