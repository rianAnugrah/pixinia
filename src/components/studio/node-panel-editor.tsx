"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChapterImageEditor from "@/components/chapter-image-editor";
import BusyStatus from "@/components/busy-status";

type ImageRow = { id: string; position: number; url: string; alt_text: string; caption: string | null; dialogue: string | null; speaker: string | null; width: number; height: number; source: string };
type PanelData = { setId: string | null; version: number; editable: boolean; admin: boolean; images: ImageRow[]; providers: { openrouter: boolean; kie: boolean } };

export default function NodePanelEditor({ storyId, nodeId }: { storyId: string; nodeId: string }) {
  const router = useRouter();
  const [data, setData] = useState<PanelData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => { setRefreshing(true); setRevision(value => value + 1); router.refresh(); }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setError("");
    fetch(`/api/studio/panels?storyId=${encodeURIComponent(storyId)}&nodeId=${encodeURIComponent(nodeId)}`, { cache: "no-store", signal: controller.signal })
      .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error || "Gagal memuat panel."); return result as PanelData; })
      .then(result => { if (active) { setData(result); setRefreshing(false); } })
      .catch(cause => { if (active && !controller.signal.aborted) { setError(cause instanceof Error ? cause.message : "Gagal memuat panel."); setRefreshing(false); } });
    return () => { active = false; controller.abort(); };
  }, [storyId, nodeId, revision]);

  async function begin() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/studio/panels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storyId, nodeId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menyiapkan draft.");
      reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Gagal menyiapkan draft."); }
    finally { setBusy(false); }
  }

  if (error && !data) return <div role="alert"><p>{error}</p><button onClick={reload}>Coba lagi</button></div>;
  if (!data) return <p role="status"><BusyStatus>Memuat panel node…</BusyStatus></p>;
  return <div className="studio-node-panel-editor">
    {refreshing && <p role="status"><BusyStatus>Memperbarui panel…</BusyStatus></p>}
    {!data.editable && <div className="studio-panel-draft-notice"><p>{data.setId ? "Gambar terbit tetap terlihat oleh pembaca. Mulai revisi untuk mengubahnya." : "Belum ada draft gambar. Buat draft untuk upload atau generate AI."}</p><button disabled={busy} onClick={begin}>{busy ? <BusyStatus>Menyiapkan draft…</BusyStatus> : "Mulai revisi panel"}</button></div>}
    {data.setId && <ChapterImageEditor key={data.setId} setId={data.setId} version={data.version} editable={data.editable} admin={data.admin} images={data.images} providers={data.providers} compact onChanged={reload} />}
    {error && <p role="alert">{error}</p>}
  </div>;
}
