"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BusyStatus from "@/components/busy-status";

export default function CoverUploader({ storyId }: { storyId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function upload(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true); setMessage("");
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error("Gunakan JPEG, PNG, atau WebP hingga 10 MB.");
      const prepared = await fetch("/api/studio/covers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "prepare", storyId, mime: file.type, size: file.size }) });
      const ticket = await prepared.json(); if (!prepared.ok) throw new Error(ticket.error);
      const { error } = await (await import("@/lib/supabase/browser")).createClient().storage.from("story-public").uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
      if (error) throw error;
      const finalized = await fetch("/api/studio/covers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "finalize", storyId, path: ticket.path }) });
      const result = await finalized.json(); if (!finalized.ok) throw new Error(result.error);
      setMessage("Cover berhasil diperbarui."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload cover gagal."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  return <section className="panel" aria-busy={busy}><h3>Cover cerita</h3><p className="muted">JPEG, PNG, atau WebP · maks. 10 MB</p><button type="button" className="studio-cover-upload" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Mengunggah…" : "Ganti cover"}</button><input hidden ref={input} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => void upload(event.currentTarget.files?.[0])} />{busy && <p role="status"><BusyStatus>Mengunggah dan memvalidasi cover…</BusyStatus></p>}{message && <p role="status">{message}</p>}</section>;
}
