import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const formats = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;

export async function POST(request: NextRequest) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Masuk dahulu." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
  const storyId = String(body.storyId || "");
  if (!/^[0-9a-f-]{36}$/.test(storyId)) return NextResponse.json({ error: "Cerita tidak valid." }, { status: 400 });
  const { data: canManage, error: accessError } = await db.rpc("studio_can_manage_story", { p_story_id: storyId });
  if (accessError || !canManage) return NextResponse.json({ error: "Akses cerita ditolak." }, { status: 403 });
  const { data: story } = await db.from("stories").select("id").eq("id", storyId).maybeSingle();
  if (!story) return NextResponse.json({ error: "Cerita tidak ditemukan." }, { status: 404 });

  if (body.action === "prepare") {
    const mime = String(body.mime || "") as keyof typeof formats;
    const size = Number(body.size);
    if (!formats[mime] || !Number.isSafeInteger(size) || size < 1 || size > MAX_BYTES)
      return NextResponse.json({ error: "Gunakan JPEG, PNG, atau WebP hingga 10 MB." }, { status: 400 });
    const path = `covers/${storyId}/${crypto.randomUUID()}.${formats[mime]}`;
    const { data, error } = await db.storage.from("story-public").createSignedUploadUrl(path);
    if (error || !data) return NextResponse.json({ error: "Gagal menyiapkan upload cover." }, { status: 500 });
    return NextResponse.json({ path, token: data.token });
  }

  if (body.action === "finalize") {
    const path = String(body.path || "");
    if (!new RegExp(`^covers/${storyId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`).test(path))
      return NextResponse.json({ error: "Path cover tidak valid." }, { status: 400 });
    const { data: file, error: downloadError } = await db.storage.from("story-public").download(path);
    if (downloadError || !file || file.size < 1 || file.size > MAX_BYTES)
      return NextResponse.json({ error: "File cover tidak ditemukan atau terlalu besar." }, { status: 400 });
    try {
      const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000 });
      const info = await image.metadata();
      const mime = info.format === "jpeg" ? "image/jpeg" : info.format === "png" ? "image/png" : info.format === "webp" ? "image/webp" : null;
      if (!mime || !info.width || !info.height || info.pages && info.pages > 1 || formats[mime] !== path.split(".").pop()) throw new Error("invalid");
      const { error } = await db.from("stories").update({ cover_path: path }).eq("id", storyId);
      if (error) throw error;
      return NextResponse.json({ path });
    } catch {
      return NextResponse.json({ error: "Cover harus berupa gambar JPEG, PNG, atau WebP yang valid." }, { status: 400 });
    }
  }
  return NextResponse.json({ error: "Tindakan tidak dikenal." }, { status: 400 });
}
