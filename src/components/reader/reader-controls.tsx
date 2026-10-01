"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, List, Coins, Settings2, GitBranch, Check, LockKeyhole, Wallet } from "lucide-react";
import { activePanelIndex } from "@/lib/reader-state";
import { visibleChapterSections } from "@/lib/reader-chapters";
import type { ReaderMapNode, ReaderMapEdge } from "@/lib/reader-map";
import ReaderDialog from "./reader-dialog";
import BranchMap from "./branch-map";

export default function ReaderControls({ slug, title, nodeId, panelIds, chapters, edges, accountKey, balance, signedIn, hasChoices, contentLabel = "Panel" }: {
  slug: string; title: string; nodeId: string; panelIds: string[]; chapters: ReaderMapNode[]; edges: ReaderMapEdge[]; accountKey: string; balance: number; signedIn: boolean; hasChoices: boolean; contentLabel?: string;
}) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<"chapters" | "wallet" | "settings" | null>(null);
  const [tab, setTab] = useState<"map" | "list">("list");
  const [largeText, setLargeText] = useState(false);
  const restoredKey = useRef("");
  const storageKey = `pixinia:panel:${accountKey}:${slug}:${nodeId}`;
  const goTo = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reader-panel]"));
    if (!elements[index]) return;
    elements[index].scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : behavior, block: "start" });
    setActive(index);
  }, []);
  useEffect(() => {
    if (!panelIds.length) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reader-panel]"));
        const index = activePanelIndex(elements.map(element => element.getBoundingClientRect().top), 112);
        setActive(index);
        try { if (panelIds[index]) localStorage.setItem(storageKey, panelIds[index]); } catch { /* Optional local bookmark. */ }
      });
    };
    if (restoredKey.current !== storageKey) {
      restoredKey.current = storageKey;
      try { const id = localStorage.getItem(storageKey); const index = id ? panelIds.indexOf(id) : -1; if (index >= 0) goTo(index, "instant"); } catch { /* Optional local bookmark. */ }
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    document.addEventListener("load", update, true);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); document.removeEventListener("load", update, true); };
  }, [goTo, panelIds, storageKey]);
  useEffect(() => {
    const reader = document.getElementById("konten-baca");
    reader?.classList.toggle("reader-large-text", largeText);
    return () => reader?.classList.remove("reader-large-text");
  }, [largeText]);
  function showChapters() {
    setTab("list"); setOpen("chapters");
  }
  const last = active >= panelIds.length - 1;
  const { continuation, start, unlocked } = visibleChapterSections(chapters, chapters.find(chapter => chapter.active)?.id);
  const row = (chapter: ReaderMapNode, label: string) => <Link href={`/read/${slug}/${chapter.nodeKey}`} key={chapter.id} aria-current={chapter.current ? "page" : undefined} onClick={() => setOpen(null)}><span className={`reader-chapter-status ${chapter.owned ? "is-owned" : ""}`}>{chapter.owned ? <Check size={20} /> : <LockKeyhole size={20} />}</span><span><strong>{chapter.title}</strong><small>{label}{chapter.ending ? " · Akhir cerita" : ""}</small></span><ChevronRight size={18} /></Link>;
  return <>
    <header className="reader-topbar">
      <Link href={`/stories/${slug}`} aria-label="Kembali ke detail cerita"><ArrowLeft aria-hidden size={22} /></Link>
      <strong title={title}>{title}</strong>
      <button className="reader-icon-button" onClick={() => setOpen("settings")} aria-label="Pengaturan baca"><Settings2 size={20} /></button>
      <button className="reader-wallet-pill" onClick={() => setOpen("wallet")} aria-label={signedIn ? `Saldo ${balance} coin` : "Masuk untuk melihat saldo coin"}><Coins size={19} /><span>{signedIn ? balance : "Coin"}</span><span aria-hidden>+</span></button>
    </header>
    <div className="reader-toolbar" role="group" aria-label="Navigasi panel dan bab">
      <button type="button" onClick={showChapters} aria-label="Buka peta dan daftar bab" className="reader-chapters-button"><GitBranch size={20} /><small>Bab</small></button>
      <button type="button" disabled={active <= 0 || !panelIds.length} onClick={() => goTo(active - 1)} aria-label={`${contentLabel} sebelumnya`}><ChevronLeft size={23} /></button>
      {panelIds.length > 0 ? <><input aria-label={`Posisi ${contentLabel.toLowerCase()}`} type="range" min={1} max={panelIds.length} value={Math.min(active + 1, panelIds.length)} onChange={event => goTo(Number(event.target.value) - 1)} /><span className="reader-panel-count" aria-live="polite">{Math.min(active + 1, panelIds.length)} / {panelIds.length}</span></> : <span className="reader-no-panels">{chapters.find(c => c.id === nodeId)?.owned ? `${contentLabel} belum tersedia` : "Bab terkunci"}</span>}
      <button type="button" disabled={!panelIds.length || (last && !hasChoices)} onClick={() => last ? document.getElementById("akhir-bab")?.scrollIntoView({ behavior: "smooth" }) : goTo(active + 1)} aria-label={last && hasChoices ? "Lihat pilihan cerita" : `${contentLabel} berikutnya`}><ChevronRight size={23} /></button>
    </div>
    {open === "chapters" && <ReaderDialog title="Jalur cerita" onClose={() => setOpen(null)} wide>
      <div className="reader-view-tabs" role="group" aria-label="Tampilan navigasi bab">
        <button aria-pressed={tab === "list"} onClick={() => setTab("list")}><List size={16} /> Bab</button><button aria-pressed={tab === "map"} onClick={() => setTab("map")}><GitBranch size={16} /> Peta cabang</button>
      </div>
      {tab === "map" ? <BranchMap slug={slug} nodes={chapters} edges={edges} onNavigate={() => setOpen(null)} /> : <div className="reader-navigation-list">
        {continuation && <div className="chapter-list-section"><h3>Continue</h3>{row(continuation, "Lanjutkan membaca")}</div>}
        {start && <div className="chapter-list-section"><h3>Awal Bab</h3>{row(start, start.owned ? "Mulai dari awal" : `Unlock · ${start.cost} coin`)}</div>}
        <div className="chapter-list-section"><h3>Bab terbuka · Baca ulang</h3>{unlocked.map(chapter => row(chapter, "Baca ulang · Gratis"))}{!unlocked.length && <p className="reader-map-help">Belum ada bab lain yang terbuka.</p>}</div>
      </div>}
      <Link href={`/stories/${slug}`} className="reader-sheet-detail">Detail cerita →</Link>
    </ReaderDialog>}
    {open === "wallet" && <ReaderDialog title="Coin kamu" onClose={() => setOpen(null)}><div className="reader-wallet-summary"><Coins size={34} /><strong>{signedIn ? balance : "100"}</strong><span>{signedIn ? "coin tersedia" : "coin awal untuk setiap akun"}</span></div><p>Coin dipakai untuk unlock bab, komik premium, dan reward. Harga ditampilkan sebelum kamu mengonfirmasi.</p><p>Membaca ulang dan reset bab gratis. Untuk tambahan coin, hubungi admin.</p><Link className="reader-primary" href={signedIn ? "/account" : `/login?next=${encodeURIComponent(`/read/${slug}/${chapters.find(c => c.id === nodeId)?.nodeKey}`)}`}><Wallet size={18} />{signedIn ? "Wallet & riwayat transaksi" : "Masuk ke akun"}</Link></ReaderDialog>}
    {open === "settings" && <ReaderDialog title="Pengaturan baca" onClose={() => setOpen(null)}><label className="reader-setting"><span>{contentLabel === "Paragraf" ? "Teks novel lebih besar" : "Teks dialog lebih besar"}</span><input type="checkbox" checked={largeText} onChange={e => setLargeText(e.target.checked)} /></label><p>Geser halaman untuk membaca. Gunakan slider untuk pindah {contentLabel.toLowerCase()} dan tombol Bab untuk melihat cabang lain.</p><button className="reader-secondary" onClick={() => { goTo(0); setOpen(null); }}>Kembali ke {contentLabel.toLowerCase()} pertama</button></ReaderDialog>}
  </>;
}
