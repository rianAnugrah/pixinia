import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseGraph, validatePublication } from "@/lib/studio/graph";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try { return await handlePost(request); }
  catch { return NextResponse.json({ error: "Server sedang tidak merespons. Periksa versi draft sebelum mencoba lagi." }, { status: 503 }); }
}

async function handlePost(request: NextRequest) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesi berakhir. Masuk kembali." }, { status: 401 });
  const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) return NextResponse.json({ error: "Akses Studio ditolak." }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 350_000) return NextResponse.json({ error: "Graph terlalu besar." }, { status: 413 });
  let body: { action?: string; storyId?: string; version?: number; graph?: unknown; mutationId?: string };
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
  if (!body.storyId || typeof body.version !== "number" || !Number.isSafeInteger(body.version) || body.version < 1 || !body.mutationId || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(body.mutationId))
    return NextResponse.json({ error: "Versi graph tidak valid." }, { status: 400 });
  if (body.action === "save") {
    let graph;
    try { graph = parseGraph(body.graph); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Graph tidak valid." }, { status: 422 }); }
    const { data, error } = await db.rpc("studio_save_graph_once", { p_story_id: body.storyId, p_version: body.version, p_graph: graph, p_mutation_id: body.mutationId });
    if (error) return NextResponse.json({ error: error.code === "40001" ? "Graph telah berubah di tab lain. Muat ulang sebelum menyimpan." : error.message }, { status: error.code === "40001" ? 409 : 422 });
    return NextResponse.json({ version: data });
  }
  if (body.action === "publish") {
    if (profile.role !== "admin") return NextResponse.json({ error: "Hanya admin yang dapat menerbitkan struktur cerita." }, { status: 403 });
    const { data: draft, error: readError } = await db.from("studio_graph_drafts").select("graph,version").eq("story_id", body.storyId).maybeSingle();
    if (readError || !draft) return NextResponse.json({ error: "Draft tidak ditemukan." }, { status: 404 });
    if (draft.version !== body.version) return NextResponse.json({ error: "Graph berubah. Muat ulang sebelum menerbitkan." }, { status: 409 });
    let errors: string[];
    try { errors = validatePublication(parseGraph(draft.graph)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Graph tidak valid." }, { status: 422 }); }
    if (errors.length) return NextResponse.json({ error: "Graph belum siap diterbitkan.", errors }, { status: 422 });
    const { data, error } = await db.rpc("studio_publish_graph_once", { p_story_id: body.storyId, p_version: body.version, p_mutation_id: body.mutationId });
    if (error) return NextResponse.json({ error: error.code === "40001" ? "Graph berubah. Muat ulang sebelum menerbitkan." : error.message }, { status: error.code === "40001" ? 409 : 422 });
    return NextResponse.json({ publicationVersion: data, version: body.version + 1 });
  }
  return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
}
