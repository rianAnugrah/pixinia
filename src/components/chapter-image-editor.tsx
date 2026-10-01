"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import BusyStatus from "@/components/busy-status";
import LoadingImage from "@/components/loading-image";
import ReaderPanelStack from "@/components/reader-panel-stack";
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Settings2, Sparkles, Trash2 } from "lucide-react";

type ImageRow = { id: string; position: number; url: string; alt_text: string; caption: string | null; dialogue: string | null; speaker: string | null; width: number; height: number; source: string };

type GenerationJob = { id: string; provider: string; status: string; created_at: string; last_error: string | null };

export default function ChapterImageEditor({ setId, version, editable, admin, images, providers, compact = false, onChanged }: { setId: string; version: number; editable: boolean; admin: boolean; images: ImageRow[]; providers: { openrouter: boolean; kie: boolean }; compact?: boolean; onChanged?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState("");
  const [checkingJobs, setCheckingJobs] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState("");
  const [alt, setAlt] = useState("");
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState(providers.kie ? "auto" : "1:1");
  const [provider, setProvider] = useState<"openrouter" | "kie">(providers.kie ? "kie" : "openrouter");
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [showAi, setShowAi] = useState(false);
  const submitting = useRef(false);
  const uploading = useRef(false);
  const seenSuccess = useRef<Set<string>>(new Set());
  const db = createClient();

  useEffect(() => {
    if (!editable) return;
    let active = true;
    async function refreshJobs() {
      if (active) setCheckingJobs(true);
      try {
        const response = await fetch(`/api/studio/generate?setId=${encodeURIComponent(setId)}`, { cache: "no-store" });
        if (!response.ok || !active) return;
        const result = await response.json();
        if (active) {
          setJobs(result.jobs ?? []);
          const fresh = (result.jobs ?? []).filter((job: GenerationJob) => job.status === "succeeded" && !seenSuccess.current.has(job.id));
          fresh.forEach((job: GenerationJob) => seenSuccess.current.add(job.id));
          if (fresh.length) { router.refresh(); onChanged?.(); }
        }
      } catch { /* Keep the editor usable when polling is temporarily unavailable. */ }
      finally { if (active) setCheckingJobs(false); }
    }
    refreshJobs();
    const timer = window.setInterval(refreshJobs, 10_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [editable, setId, router, onChanged]);

  async function generate() {
    if (submitting.current) return;
    if (prompt.trim().length < 10 || !alt.trim()) { setMessage("Isi prompt minimal 10 karakter dan alt text."); return; }
    submitting.current = true; setBusy(true); setActivity("Mengirim permintaan AI…"); setMessage("");
    try {
      const response = await fetch("/api/studio/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId, provider, prompt: prompt.trim(), alt: alt.trim(), aspect, idempotency: crypto.randomUUID() }) });
      const result = await response.json();
      setMessage(response.ok ? result.status === "succeeded" ? "Gambar AI tersimpan dalam draft." : "Tugas AI sedang diproses." : result.error || "Gagal memulai generasi");
      router.refresh(); onChanged?.();
    } catch { setMessage("Koneksi gagal. Periksa status tugas sebelum mencoba lagi."); }
    finally { submitting.current = false; setBusy(false); setActivity(""); }
  }

  async function mutate(name: string, params: Record<string, unknown>) {
    if (busy) return false;
    const labels: Record<string, string> = { update_chapter_image: "Menyimpan teks…", move_chapter_image: "Mengubah urutan…", remove_chapter_image: "Menghapus gambar…", publish_chapter_images: "Menerbitkan gambar…" };
    setBusy(true); setActivity(labels[name] ?? "Menyimpan…"); setMessage("");
    try {
      const { error } = await db.rpc(name, params);
      if (error) throw error;
      setMessage("Perubahan tersimpan."); router.refresh(); onChanged?.(); return true;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Perubahan gagal disimpan."); return false; }
    finally { setBusy(false); setActivity(""); }
  }

  async function upload(files: FileList | File[] | null) {
    const queue = Array.from(files ?? []);
    if (!queue.length || uploading.current || busy) return;
    if (!compact && !alt.trim()) { setMessage("Isi alt text sebelum upload."); return; }
    uploading.current = true;
    setBusy(true); setActivity("Menyiapkan upload…"); setMessage("");
    let failed = 0;
    for (let i = 0; i < queue.length; i++) {
      const file = queue[i]; setProgress(`${i + 1}/${queue.length}: ${file.name}`);
      try {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error("Format atau ukuran tidak didukung");
        setActivity(`Menyiapkan ${file.name}…`);
        const prepared = await fetch("/api/studio/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "prepare", setId, mime: file.type, size: file.size }) });
        const ticket = await prepared.json();
        if (!prepared.ok) throw new Error(ticket.error);
        setActivity(`Mengunggah ${file.name}…`);
        const { error } = await db.storage.from("story-private").uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
        if (error) throw error;
        setActivity(`Memvalidasi ${file.name}…`);
        const fileAlt = compact ? file.name.trim().slice(0, 500) || crypto.randomUUID() : alt.trim();
        const finalized = await fetch("/api/studio/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "finalize", setId, path: ticket.path, alt: fileAlt }) });
        const result = await finalized.json();
        if (!finalized.ok) throw new Error(result.error);
      } catch (error) { failed++; setMessage(`${file.name}: ${error instanceof Error ? error.message : "Gagal upload"}`); }
    }
    uploading.current = false; setBusy(false); setActivity(""); setProgress("");
    if (!failed) setMessage(`${queue.length} gambar tersimpan.`);
    router.refresh(); onChanged?.();
  }

  if (compact) return <div className="studio-simple-panels" aria-busy={busy}>
    <p className="studio-panel-mode">{editable ? "Draft panel · perubahan belum dilihat pembaca" : "Panel terbit · mulai revisi untuk mengubah"}</p>
    <ReaderPanelStack className="studio-editable-stack" panels={images.map(image => ({ id: image.id, url: image.url || null, alt: image.alt_text, width: image.width, height: image.height, speaker: image.speaker, dialogue: image.dialogue, caption: image.caption }))}
      renderActions={editable ? (panel, index) => <div className="studio-panel-tools" aria-label={`Tindakan gambar ${index + 1}`}>
        <button type="button" title="Naikkan gambar" aria-label={`Naikkan gambar ${index + 1}`} disabled={busy || index === 0} onClick={() => void mutate("move_chapter_image", { p_image_id: panel.id, p_direction: -1, p_version: version })}><ArrowUp size={18} /></button>
        <button type="button" title="Edit teks gambar" aria-label={`Edit teks gambar ${index + 1}`} disabled={busy} onClick={() => { setEditingId(editingId === panel.id ? null : panel.id); setSettingsId(null); }}><Pencil size={18} /></button>
        <button type="button" title="Detail gambar" aria-label={`Detail gambar ${index + 1}`} onClick={() => { setSettingsId(settingsId === panel.id ? null : panel.id); setEditingId(null); }}><Settings2 size={18} /></button>
        <button type="button" title="Hapus gambar" aria-label={`Hapus gambar ${index + 1}`} disabled={busy} onClick={() => { if (window.confirm("Hapus gambar dari draft?")) void mutate("remove_chapter_image", { p_image_id: panel.id }); }}><Trash2 size={18} /></button>
        <button type="button" title="Turunkan gambar" aria-label={`Turunkan gambar ${index + 1}`} disabled={busy || index === images.length - 1} onClick={() => void mutate("move_chapter_image", { p_image_id: panel.id, p_direction: 1, p_version: version })}><ArrowDown size={18} /></button>
      </div> : undefined}
      renderAfter={editable ? panel => {
        const image = images.find(item => item.id === panel.id);
        if (!image) return null;
        if (settingsId === image.id) return <div className="studio-panel-extra"><strong>Detail gambar</strong><p>{image.source === "ai" ? "Dibuat dengan AI" : "Upload manual"} · {image.width} × {image.height}</p><p>Alt text: {image.alt_text}</p><small>ID: {image.id}</small></div>;
        if (editingId !== image.id) return null;
        return <form className="studio-panel-extra" onSubmit={async event => { event.preventDefault(); const form = new FormData(event.currentTarget); if (await mutate("update_chapter_image", { p_image_id: image.id, p_alt: form.get("alt"), p_caption: form.get("caption"), p_dialogue: form.get("dialogue"), p_speaker: form.get("speaker") })) setEditingId(null); }}>
          <strong>Edit teks panel</strong>
          <label className="field"><span>Alt text</span><input name="alt" defaultValue={image.alt_text} required maxLength={500} /></label>
          <label className="field"><span>Caption</span><textarea name="caption" defaultValue={image.caption ?? ""} maxLength={2000} /></label>
          <label className="field"><span>Dialog</span><textarea name="dialogue" defaultValue={image.dialogue ?? ""} maxLength={2000} /></label>
          <label className="field"><span>Pembicara</span><input name="speaker" defaultValue={image.speaker ?? ""} maxLength={200} /></label>
          <div className="studio-panel-form-actions"><button type="button" onClick={() => setEditingId(null)}>Batal</button><button type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button></div>
        </form>;
      } : undefined} />
    {editable && <div className="studio-add-panel" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void upload(Array.from(event.dataTransfer.files)); }}>
      <ImagePlus size={34} aria-hidden />
      <label className="studio-upload-action" htmlFor={`upload-${setId}`}>Upload Image</label>
      <input id={`upload-${setId}`} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => { const chosen = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; void upload(chosen); }} />
      <span>or</span>
      <button type="button" onClick={() => setShowAi(value => !value)}><Sparkles size={16} /> Generate with AI</button>
      <small>JPEG, PNG, WebP · maks. 10 MB per gambar</small>
    </div>}
    {editable && showAi && <section className="studio-ai-expand"><h3>Generate gambar AI</h3><p>Hasil masuk ke draft. Batas awal US$2 memakai reservasi biaya.</p>
      <label className="field"><span>Provider</span><select value={provider} onChange={event => { const next = event.target.value as "openrouter" | "kie"; setProvider(next); setAspect(next === "kie" ? "auto" : "1:1"); }}><option value="kie" disabled={!providers.kie}>kie.ai · GPT Image 2</option><option value="openrouter" disabled={!providers.openrouter}>OpenRouter</option></select></label>
      <label className="field"><span>Prompt</span><textarea value={prompt} onChange={event => setPrompt(event.target.value)} rows={4} maxLength={2000} placeholder="Deskripsikan gambar…" /></label>
      <label className="field"><span>Alt text</span><input value={alt} onChange={event => setAlt(event.target.value)} maxLength={500} placeholder="Deskripsi singkat gambar" /></label>
      <label className="field"><span>Rasio</span><select value={aspect} onChange={event => setAspect(event.target.value)}>{provider === "kie" && <option value="auto">Auto</option>}<option>1:1</option><option>16:9</option><option>9:16</option><option>4:3</option><option>3:4</option></select></label>
      <button type="button" disabled={busy || !(provider === "kie" ? providers.kie : providers.openrouter)} onClick={() => void generate()}>{busy ? "Memproses…" : "Generate gambar"}</button>
      {!providers.kie && !providers.openrouter && <p>Provider AI belum dikonfigurasi.</p>}
    </section>}
    {busy && <p role="status"><BusyStatus>{activity}</BusyStatus></p>}
    {progress && <p role="status">File {progress}</p>}
    {message && <p role="status">{message}</p>}
    {editable && jobs.length > 0 && <div className="studio-ai-jobs"><strong>Status tugas AI</strong>{jobs.map(job => <p key={job.id}>{job.provider}: {job.status}{job.last_error ? ` · ${job.last_error}` : ""}</p>)}{checkingJobs && <p>Memeriksa status…</p>}</div>}
    {editable && admin && <div className="studio-panel-publish"><p>Setelah sesuai dengan Preview, terbitkan panel agar reader melihatnya.</p><button type="button" disabled={busy || !images.length} onClick={() => { if (window.confirm("Terbitkan revisi gambar chapter ini?")) void mutate("publish_chapter_images", { p_set_id: setId }); }}>Terbitkan gambar</button></div>}
  </div>;

  return <div className="admin-grid" style={{ alignItems: "start" }} aria-busy={busy}>
    <section className="panel"><h2>Gambar chapter</h2><p className="muted">{editable ? "Versi kerja. Pembaca belum melihat perubahan ini." : "Versi yang sedang terbit."}</p>
      {images.length ? images.map((image, index) => <article key={image.id} style={{ borderBottom: "1px solid var(--line)", padding: "16px 0" }}>
        {image.url && <LoadingImage src={image.url} alt={image.alt_text} width={image.width} height={image.height} className="studio-image" />}
        <p>#{index + 1} · {image.source === "ai" ? "AI" : "Upload"} · {image.width}×{image.height}</p>
        {editable ? <form onSubmit={async event => { event.preventDefault(); const data = new FormData(event.currentTarget); await mutate("update_chapter_image", { p_image_id: image.id, p_alt: data.get("alt"), p_caption: data.get("caption"), p_dialogue: data.get("dialogue"), p_speaker: data.get("speaker") }); }}>
          <label className="field"><span>Alt text</span><input name="alt" defaultValue={image.alt_text} required maxLength={500} /></label>
          <label className="field"><span>Caption</span><textarea name="caption" defaultValue={image.caption ?? ""} maxLength={2000} /></label>
          <label className="field"><span>Dialogue</span><textarea name="dialogue" defaultValue={image.dialogue ?? ""} maxLength={2000} /></label>
          <label className="field"><span>Speaker</span><input name="speaker" defaultValue={image.speaker ?? ""} maxLength={200} /></label>
          <button disabled={busy}>{busy ? <BusyStatus>Menyimpan…</BusyStatus> : "Simpan teks"}</button>
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
      {busy && <p><BusyStatus>{activity}</BusyStatus></p>}
      {progress && <p aria-live="polite">File {progress}</p>}
      <h3>Generate AI</h3><p className="muted">Batas biaya awal US$2. Setiap tugas memakai reservasi biaya; hasil masuk ke draft untuk ditinjau.</p>
      <label className="field"><span>Provider</span><select value={provider} onChange={event => { const next = event.target.value as "openrouter" | "kie"; setProvider(next); setAspect(next === "kie" ? "auto" : "1:1"); }}>
        <option value="openrouter">OpenRouter {providers.openrouter ? "" : "(belum dikonfigurasi)"}</option>
        <option value="kie">kie.ai · GPT Image 2 {providers.kie ? "" : "(belum dikonfigurasi)"}</option>
      </select></label>
      <label className="field"><span>Prompt gambar</span><textarea value={prompt} onChange={event => setPrompt(event.target.value)} rows={5} maxLength={2000} placeholder="Deskripsikan adegan dan gaya gambar" /></label>
      <label className="field"><span>Rasio</span><select value={aspect} onChange={event => setAspect(event.target.value)}>{provider === "kie" && <option value="auto">Auto</option>}<option>1:1</option><option>16:9</option><option>9:16</option><option>4:3</option><option>3:4</option></select></label>
      <button disabled={busy || !(provider === "openrouter" ? providers.openrouter : providers.kie)} onClick={generate}>{busy ? "Sedang memproses…" : "Generate gambar"}</button>
      {!providers.openrouter && !providers.kie && <p className="muted">Tambahkan secret provider pada Vercel untuk mengaktifkan AI. Higgsfield disiapkan sebagai adapter berikutnya setelah kontrak API dan biaya tersedia.</p>}
      {(!!jobs.length || checkingJobs) && <div><h3>Status tugas AI</h3>{jobs.map(job => <p key={job.id}>{["queued", "running", "processing", "finalizing"].includes(job.status) ? <BusyStatus>{job.provider}: {job.status === "finalizing" ? "menyimpan hasil" : "membuat gambar"}</BusyStatus> : `${job.provider}: ${job.status}`}{job.last_error ? ` · ${job.last_error}` : ""}</p>)}{checkingJobs && <p className="muted" role="status">Memeriksa status terbaru…</p>}</div>}
      {admin && <><h3>Publikasikan</h3><p className="muted">Publikasi mengganti versi gambar chapter yang dilihat pembaca.</p><button className="primary-button" disabled={busy || !images.length} onClick={() => { if (confirm("Terbitkan revisi gambar chapter ini?")) mutate("publish_chapter_images", { p_set_id: setId }); }}>Terbitkan gambar</button></>}
    </> : <p>Mulai revisi baru untuk menambah atau mengubah gambar.</p>}
      {message && <p role="status">{message}</p>}
    </aside>
  </div>;
}
