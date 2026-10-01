import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const formats = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;

export async function POST(request: NextRequest) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Masuk dahulu" }, { status: 401 });
  const { data: profile } = await db.from("profiles").select("role,is_active").eq("id", user.id).single();
  if (!profile?.is_active || !["admin", "creator"].includes(profile.role))
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid" }, { status: 400 }); }
  const setId = String(body.setId || "");
  const { data: set } = await db.from("chapter_image_sets").select("id,node_id,status").eq("id", setId).eq("status", "draft").maybeSingle();
  if (!set) return NextResponse.json({ error: "Draft tidak ditemukan" }, { status: 404 });

  if (body.action === "prepare") {
    const mime = String(body.mime || "") as keyof typeof formats;
    const size = Number(body.size);
    if (!formats[mime] || !Number.isSafeInteger(size) || size < 1 || size > MAX_BYTES)
      return NextResponse.json({ error: "Gunakan JPEG, PNG, atau WebP hingga 10 MB" }, { status: 400 });
    const path = `${user.id}/${set.node_id}/${crypto.randomUUID()}.${formats[mime]}`;
    const { data, error } = await db.storage.from("story-private").createSignedUploadUrl(path);
    if (error || !data) return NextResponse.json({ error: "Gagal menyiapkan upload" }, { status: 500 });
    return NextResponse.json({ path, token: data.token });
  }

  if (body.action === "finalize") {
    const path = String(body.path || "");
    const alt = String(body.alt || "").trim();
    if (!new RegExp(`^${user.id}/${set.node_id}/[0-9a-f-]+\\.(jpg|png|webp)$`).test(path) || !alt || alt.length > 500)
      return NextResponse.json({ error: "Data gambar tidak valid" }, { status: 400 });
    const { data: file, error: downloadError } = await db.storage.from("story-private").download(path);
    if (downloadError || !file || file.size > MAX_BYTES || file.size < 1)
      return NextResponse.json({ error: "File tidak ditemukan atau terlalu besar" }, { status: 400 });
    try {
      const bytes = Buffer.from(await file.arrayBuffer());
      const image = sharp(bytes, { limitInputPixels: 40_000_000 });
      const info = await image.metadata();
      const mime = info.format === "jpeg" ? "image/jpeg" : info.format === "png" ? "image/png" : info.format === "webp" ? "image/webp" : null;
      if (!mime || !info.width || !info.height || info.pages && info.pages > 1 || formats[mime] !== path.split(".").pop())
        throw new Error("Format gambar tidak cocok");
      const { data, error } = await db.rpc("add_chapter_image", {
        p_set_id: set.id, p_path: path, p_mime: mime, p_width: info.width,
        p_height: info.height, p_alt: alt, p_source: "upload",
      });
      if (error) throw error;
      return NextResponse.json({ id: data });
    } catch {
      return NextResponse.json({ error: "Gagal memvalidasi atau menyimpan gambar" }, { status: 400 });
    }
  }
  return NextResponse.json({ error: "Tindakan tidak dikenal" }, { status: 400 });
}
