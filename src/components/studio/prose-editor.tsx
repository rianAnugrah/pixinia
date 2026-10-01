"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Italic, Maximize2, Minimize2, Strikethrough, Underline as UnderlineIcon, X } from "lucide-react";
import BusyStatus from "@/components/busy-status";
import { legacyProseToHtml, proseBodyToEditableHtml, sanitizeProseHtml } from "@/lib/web-novel";

type LoadResult = { draftBody: string | null; publishedBody: string | null; publishedAt: string | null; admin: boolean };

export default function ProseEditor({ storyId, nodeId, title }: { storyId: string; nodeId: string; title: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [status, setStatus] = useState("Tersimpan");
  const [expanded, setExpanded] = useState(false);
  const [dirtyTick, setDirtyTick] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);
  const revisionRef = useRef(0);
  const savedRef = useRef(0);
  const savingRef = useRef(false);

  useEffect(() => {
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch { /* unsupported in some browsers */ }
  }, []);

  useEffect(() => {
    let active = true;
    loadedRef.current = false;
    setLoading(true); setError("");
    fetch(`/api/studio/prose?storyId=${encodeURIComponent(storyId)}&nodeId=${encodeURIComponent(nodeId)}`, { cache: "no-store" })
      .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error || "Gagal memuat naskah."); return result as LoadResult; })
      .then(result => {
        if (!active) return;
        const html = proseBodyToEditableHtml(result.draftBody ?? result.publishedBody);
        if (editorRef.current) editorRef.current.innerHTML = html;
        setAdmin(result.admin); setPublishedAt(result.publishedAt);
        revisionRef.current = 0; savedRef.current = 0; setDirtyTick(0); setStatus("Tersimpan");
        loadedRef.current = true; setLoading(false);
      })
      .catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : "Gagal memuat naskah."); setLoading(false); } });
    return () => { active = false; };
  }, [storyId, nodeId]);

  const save = useCallback(async (intent: "draft" | "publish") => {
    if (!editorRef.current || savingRef.current) return false;
    const revision = revisionRef.current;
    savingRef.current = true; setStatus(intent === "publish" ? "Menerbitkan…" : "Menyimpan…");
    try {
      const response = await fetch("/api/studio/prose", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storyId, nodeId, html: editorRef.current.innerHTML, intent }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menyimpan naskah.");
      savedRef.current = revision;
      if (intent === "publish") setPublishedAt(result.publishedAt);
      setStatus(revisionRef.current === revision ? "Tersimpan" : "Belum tersimpan");
      return true;
    } catch (cause) { setStatus("Gagal menyimpan"); setError(cause instanceof Error ? cause.message : "Gagal menyimpan naskah."); return false; }
    finally { savingRef.current = false; }
  }, [storyId, nodeId]);

  function markDirty() { revisionRef.current += 1; setDirtyTick(revisionRef.current); setStatus("Belum tersimpan"); }

  useEffect(() => {
    if (!loadedRef.current || dirtyTick === 0 || revisionRef.current === savedRef.current) return;
    const timer = window.setTimeout(() => { if (!savingRef.current) void save("draft"); }, 1500);
    return () => window.clearTimeout(timer);
  }, [dirtyTick, save]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (revisionRef.current !== savedRef.current) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", onKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = originalOverflow; };
  }, [expanded]);

  function format(command: string) {
    editorRef.current?.focus();
    document.execCommand(command, false);
    markDirty();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!(event.ctrlKey || event.metaKey)) return;
    const command = { b: "bold", i: "italic", u: "underline" }[event.key.toLowerCase()];
    if (!command) return;
    event.preventDefault();
    format(command);
  }

  function onPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    const clean = html ? sanitizeProseHtml(html) : legacyProseToHtml(text);
    document.execCommand("insertHTML", false, clean || "");
    markDirty();
  }

  return <div className={`studio-prose-editor ${expanded ? "studio-prose-expanded" : ""}`}>
    {expanded && <div className="studio-prose-backdrop" onClick={() => setExpanded(false)} />}
    <div className="studio-prose-panel">
      <div className="studio-prose-toolbar">
        <div className="studio-prose-toolbar-group">
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => format("bold")} aria-label="Tebal" title="Tebal (Ctrl+B)"><Bold size={15} /></button>
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => format("italic")} aria-label="Miring" title="Miring (Ctrl+I)"><Italic size={15} /></button>
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => format("underline")} aria-label="Garis bawah" title="Garis bawah (Ctrl+U)"><UnderlineIcon size={15} /></button>
          <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => format("strikeThrough")} aria-label="Coret" title="Coret"><Strikethrough size={15} /></button>
        </div>
        <div className="studio-prose-toolbar-group">
          <span className="studio-save-state" role="status" aria-live="polite">{status === "Menyimpan…" || status === "Menerbitkan…" ? <BusyStatus>{status}</BusyStatus> : status}</span>
          <button type="button" onClick={() => void save("draft")} disabled={revisionRef.current === savedRef.current}>Simpan draft</button>
          {admin && <button type="button" className="primary-button" onClick={() => void save("publish")}>Terbitkan</button>}
          <button type="button" onClick={() => setExpanded(value => !value)} aria-label={expanded ? "Perkecil editor" : "Perbesar editor"} title={expanded ? "Perkecil" : "Perbesar editor"}>{expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
          {expanded && <button type="button" onClick={() => setExpanded(false)} aria-label="Tutup"><X size={15} /></button>}
        </div>
      </div>
      {loading && <p role="status"><BusyStatus>Memuat naskah…</BusyStatus></p>}
      <div ref={editorRef} className="studio-prose-surface" style={loading ? { display: "none" } : undefined} contentEditable suppressContentEditableWarning onInput={markDirty} onPaste={onPaste} onKeyDown={onKeyDown} aria-label={`Naskah ${title}`} />
      {error && <p role="alert" className="studio-prose-error">{error}</p>}
      <p className="studio-prose-meta">{publishedAt ? `Naskah terbit · ${new Date(publishedAt).toLocaleDateString("id-ID")}` : "Naskah belum diterbitkan."}</p>
    </div>
  </div>;
}
