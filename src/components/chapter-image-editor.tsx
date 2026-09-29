"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type ImageRow = { id: string; position: number; url: string; alt_text: string; caption: string | null; dialogue: string | null; speaker: string | null; width: number; height: number; source: string };

type GenerationJob = { id: string; provider: string; status: string; created_at: string; last_error: string | null };

export default function ChapterImageEditor({ setId, version, editable, admin, images, providers }: { setId: string; version: number; editable: boolean; admin: boolean; images: ImageRow[]; providers: { openrouter: boolean; kie: boolean } }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState("");
  const [alt, setAlt] = useState("");
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [provider, setProvider] = useState<"openrouter" | "kie">("openrouter");
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const submitting = useRef(false);
  const seenSuccess = useRef<Set<string>>(new Set());
  const db = createClient();

  useEffect(() => {
    if (!editable) return;
    let active = true;
    async function refreshJobs() {
      try {
        const response = await fetch(`/api/studio/generate?setId=${encodeURIComponent(setId)}`, { cache: "no-store" });
        if (!response.ok || !active) return;
        const result = await response.json();
        if (active) {
          setJobs(result.jobs ?? []);
          const fresh = (result.jobs ?? []).filter((job: GenerationJob) => job.status === "succeeded" && !seenSuccess.current.has(job.id));
          fresh.forEach((job: GenerationJob) => seenSuccess.current.add(job.id));
          if (fresh.length) router.refresh();
        }
      } catch { /* Keep the editor usable when polling is temporarily unavailable. */ }
    }
    refreshJobs();
    const timer = window.setInterval(refreshJobs, 10_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [editable, setId, router]);

  async function generate() {
    if (submitting.current) return;
    if (prompt.trim().length < 10 || !alt.trim()) { setMessage("Isi prompt minimal 10 karakter dan alt text."); return; }
    submitting.current = true; setBusy(true); setMessage("Memulai generasi...");
    try {
      const response = await fetch("/api/studio/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId, provider, prompt: prompt.trim(), alt: alt.trim(), aspect, idempotency: crypto.randomUUID() }) });
      const result = await response.json();
      setMessage(response.ok ? result.status === "succeeded" ? "Gambar AI tersimpan dalam draft." : "Tugas AI sedang diproses." : result.error || "Gagal memulai generasi");
      router.refresh();
    } catch { setMessage("Koneksi gagal. Periksa status tugas sebelum mencoba lagi."); }
    finally { submitting.current = false; setBusy(false); }
  }

  async function mutate(name: string, params: Record<string, unknown>) {
    setBusy(true); setMessage("");
    const { error } = await db.rpc(name, params);
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    router.refresh();
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    if (!alt.trim()) { setMessage("Isi alt text sebelum upload."); return; }
    setBusy(true); setMessage("");
    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i]; setProgress(`${i + 1}/${files.length}: ${file.name}`);
      try {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error("Format atau ukuran tidak didukung");
        const prepared = await fetch("/api/studio/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "prepare", setId, mime: file.type, size: file.size }) });
        const ticket = await prepared.json();
        if (!prepared.ok) throw new Error(ticket.error);
        const { error } = await db.storage.from("story-private").uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
        if (error) throw error;
        const finalized = await fetch("/api/studio/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "finalize", setId, path: ticket.path, alt: alt.trim() }) });
        const result = await finalized.json();
        if (!finalized.ok) throw new Error(result.error);
      } catch (error) { failed++; setMessage(`${file.name}: ${error instanceof Error ? error.message : "Gagal upload"}`); }
    }
    setBusy(false); setProgress("");
    if (!failed) setMessage(`${files.length} gambar tersimpan.`);
    router.refresh();
  }

  return <div className="admin-grid" style={{ alignItems: "start" }}>
    <section className="panel"><h2>Gambar chapter</h2><p className="muted">{editable ? "Versi kerja. Pembaca belum melihat perubahan ini." : "Versi yang sedang terbit."}</p>
      {images.length ? images.map((image, index) => <article key={image.id} style={{ borderBottom: "1px solid var(--line)", padding: "16px 0" }}>
        {image.url && <img src={image.url} alt={image.alt_text} style={{ width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 12 }} />}
        <p>#{index + 1} · {image.source === "ai" ? "AI" : "Upload"} · {image.width}×{image.height}</p>
        {editable ? <form onSubmit={async event => { event.preventDefault(); const data = new FormData(event.currentTarget); await mutate("update_chapter_image", { p_image_id: image.id, p_alt: data.get("alt"), p_caption: data.get("caption"), p_dialogue: data.get("dialogue"), p_speaker: data.get("speaker") }); }}>
          <label className="field"><span>Alt text</span><input name="alt" defaultValue={image.alt_text} required maxLength={500} /></label>
          <label className="field"><span>Caption</span><textarea name="caption" defaultValue={image.caption ?? ""} maxLength={2000} /></label>
          <label className="field"><span>Dialogue</span><textarea name="dialogue" defaultValue={image.dialogue ?? ""} maxLength={2000} /></label>
          <label className="field"><span>Speaker</span><input name="speaker" defaultValue={image.speaker ?? ""} maxLength={200} /></label>
          <button disabled={busy}>Simpan teks</button>
        </form> : <p>{image.caption}</p>}
        {editable && <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button disabled={busy || index === 0} onClick={() => mutate("move_chapter_image", { p_image_id: image.id, p_direction: -1, p_version: version })}>Naik</button>
          <button disabled={busy || index === images.length - 1} onClick={() => mutate("move_chapter_image", { p_image_id: image.id, p_direction: 1, p_version: version })}>Turun</button>
          <button disabled={busy} onClick={() => { if (confirm("Hapus gambar dari draft?")) mutate("remove_chapter_image", { p_image_id: image.id }); }}>Hapus</button>
        </div>}
      </article>) : <p>Belum ada gambar pada versi ini.</p>}
    </section>
    <aside className="panel"><h2>Tambah gambar</h2>{editable ? <>
      <label className="field"><span>Alt text</span><input value={alt} onChange={event => setAlt(event.target.value)} maxLength={500} placeholder="Jelaskan isi gambar" /></label>
      <label className="field"><span>Upload JPEG, PNG, atau WebP (maks. 10 MB/file)</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => upload(event.target.files)} /></label>
      {progress && <p aria-live="polite">{progress}</p>}
      <h3>Generate AI</h3><p className="muted">Batas biaya awal US$2. Setiap tugas memakai reservasi biaya; hasil masuk ke draft untuk ditinjau.</p>
      <label className="field"><span>Provider</span><select value={provider} onChange={event => setProvider(event.target.value as "openrouter" | "kie")}>
        <option value="openrouter">OpenRouter {providers.openrouter ? "" : "(belum dikonfigurasi)"}</option>
        <option value="kie">kie.ai {providers.kie ? "" : "(belum dikonfigurasi)"}</option>
      </select></label>
      <label className="field"><span>Prompt gambar</span><textarea value={prompt} onChange={event => setPrompt(event.target.value)} rows={5} maxLength={2000} placeholder="Deskripsikan adegan dan gaya gambar" /></label>
      <label className="field"><span>Rasio</span><select value={aspect} onChange={event => setAspect(event.target.value)}><option>1:1</option><option>16:9</option><option>9:16</option><option>4:3</option><option>3:4</option></select></label>
      <button disabled={busy || !(provider === "openrouter" ? providers.openrouter : providers.kie)} onClick={generate}>Generate gambar</button>
      {!providers.openrouter && !providers.kie && <p className="muted">Tambahkan secret provider pada Vercel untuk mengaktifkan AI. Higgsfield disiapkan sebagai adapter berikutnya setelah kontrak API dan biaya tersedia.</p>}
      {!!jobs.length && <div><h3>Status tugas AI</h3>{jobs.map(job => <p key={job.id}>{job.provider}: {job.status}{job.last_error ? ` · ${job.last_error}` : ""}</p>)}</div>}
      {admin && <><h3>Publikasikan</h3><p className="muted">Publikasi mengganti versi gambar chapter yang dilihat pembaca.</p><button className="primary-button" disabled={busy || !images.length} onClick={() => { if (confirm("Terbitkan revisi gambar chapter ini?")) mutate("publish_chapter_images", { p_set_id: setId }); }}>Terbitkan gambar</button></>}
    </> : <p>Mulai revisi baru untuk menambah atau mengubah gambar.</p>}
      {message && <p role="status">{message}</p>}
    </aside>
  </div>;
}
