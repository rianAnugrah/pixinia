import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { downloadKieResult, generateWithOpenRouter, pollKie, submitToKie, type ImageProvider } from "@/lib/image-providers";

export const runtime = "nodejs";
export const maxDuration = 60;

async function context() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role)) return null;
  return { db, user };
}

async function saveResult(db: Awaited<ReturnType<typeof createClient>>, userId: string, nodeId: string, jobId: string, bytes: Buffer, cost: number | null) {
  const image = sharp(bytes, { limitInputPixels: 40_000_000 });
  const meta = await image.metadata();
  if (!meta.width || !meta.height || !["jpeg", "png", "webp"].includes(meta.format || "") || meta.pages && meta.pages > 1)
    throw new Error("Provider tidak mengembalikan gambar yang valid");
  const output = await image.resize({ width: 4096, height: 4096, fit: "inside", withoutEnlargement: true }).webp({ quality: 86 }).toBuffer({ resolveWithObject: true });
  if (output.data.length > 10 * 1024 * 1024) throw new Error("Hasil AI terlalu besar");
  const path = `${userId}/${nodeId}/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await db.storage.from("story-private").upload(path, output.data, { contentType: "image/webp", upsert: false });
  if (uploadError) throw new Error("Gagal menyimpan hasil AI");
  const { error } = await db.rpc("complete_chapter_image_job", {
    p_job_id: jobId, p_path: path, p_mime: "image/webp", p_width: output.info.width,
    p_height: output.info.height, p_actual_cost: cost,
  });
  if (error) throw new Error("Gagal menambahkan hasil AI ke chapter");
}

export async function POST(request: NextRequest) {
  const session = await context();
  if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { db, user } = session;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid" }, { status: 400 }); }
  const provider = String(body.provider || "") as ImageProvider;
  const key = provider === "openrouter" ? process.env.OPENROUTER_API_KEY : provider === "kie" ? process.env.KIE_API_KEY : null;
  if (!key) return NextResponse.json({ error: `${provider} belum dikonfigurasi` }, { status: 503 });
  const setId = String(body.setId || "");
  const prompt = String(body.prompt || "").trim();
  const alt = String(body.alt || "").trim();
  const aspect = String(body.aspect || "1:1");
  const idempotency = String(body.idempotency || "");
  if (!/^[0-9a-f-]{36}$/.test(idempotency)) return NextResponse.json({ error: "ID permintaan tidak valid" }, { status: 400 });
  const { data: set } = await db.from("chapter_image_sets").select("id,node_id").eq("id", setId).eq("status", "draft").maybeSingle();
  if (!set) return NextResponse.json({ error: "Draft tidak ditemukan" }, { status: 404 });
  const { data: jobId, error: enqueueError } = await db.rpc("enqueue_chapter_image_job", {
    p_set_id: setId, p_provider: provider, p_prompt: prompt, p_alt: alt, p_aspect: aspect, p_key: idempotency,
  });
  if (enqueueError) return NextResponse.json({ error: enqueueError.message }, { status: 400 });
  const { error: claimError } = await db.rpc("set_chapter_image_job_state", { p_job_id: jobId, p_status: "running" });
  if (claimError) return NextResponse.json({ id: jobId, status: "processing" });
  try {
    if (provider === "kie") {
      const taskId = await submitToKie(prompt, aspect);
      await db.rpc("set_chapter_image_job_state", { p_job_id: jobId, p_status: "processing", p_task_id: taskId });
      return NextResponse.json({ id: jobId, status: "processing" });
    }
    const result = await generateWithOpenRouter(prompt, aspect);
    await saveResult(db, user.id, set.node_id, jobId, result.bytes, result.reportedCost);
    return NextResponse.json({ id: jobId, status: "succeeded" });
  } catch {
    // A provider may have charged before a timeout. Never retry automatically.
    await db.rpc("set_chapter_image_job_state", { p_job_id: jobId, p_status: "uncertain", p_error: "Periksa provider; hasil atau biaya belum dapat dipastikan" });
    return NextResponse.json({ id: jobId, status: "uncertain", error: "Hasil belum dapat dipastikan. Periksa provider sebelum mencoba lagi." }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const session = await context();
  if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { db, user } = session;
  const setId = request.nextUrl.searchParams.get("setId");
  if (!setId) return NextResponse.json({ error: "Draft tidak dipilih" }, { status: 400 });
  const { data: set } = await db.from("chapter_image_sets").select("id,node_id").eq("id", setId).maybeSingle();
  if (!set) return NextResponse.json({ error: "Draft tidak ditemukan" }, { status: 404 });
  const { data: jobs } = await db.from("chapter_image_generation_jobs")
    .select("id,provider,status,provider_task_id,created_at,last_error")
    .eq("set_id", setId).eq("requested_by", user.id).order("created_at", { ascending: false }).limit(10);
  const pending = jobs?.find(job => job.provider === "kie" && job.status === "processing" && job.provider_task_id);
  if (pending && process.env.KIE_API_KEY) {
    try {
      const result = await pollKie(pending.provider_task_id);
      if (result.state === "failed") {
        await db.rpc("set_chapter_image_job_state", { p_job_id: pending.id, p_status: "failed", p_error: "Generasi gagal di kie.ai" });
      } else if (result.state === "success" && result.url) {
        const bytes = await downloadKieResult(result.url);
        await saveResult(db, user.id, set.node_id, pending.id, bytes, null);
      }
    } catch {
      // Leave the job processing so the admin can retry polling without charging again.
    }
  }
  const { data: latest } = await db.from("chapter_image_generation_jobs")
    .select("id,provider,status,created_at,last_error").eq("set_id", setId).eq("requested_by", user.id)
    .order("created_at", { ascending: false }).limit(10);
  return NextResponse.json({ jobs: latest ?? [] });
}
