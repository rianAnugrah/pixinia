"use client";

import { useState } from "react";
import Link from "next/link";
import BranchMap from "./branch-map";
import type { ReaderMapEdge } from "@/lib/reader-map";
import { visibleChapterSections } from "@/lib/reader-chapters";

export type StoryChapter = { id: string; nodeKey: string; title: string; current: boolean; isStart: boolean; panelCount: number; owned: boolean; cost: number; premium: boolean; visited: boolean; ending: boolean };

export default function StoryTabs({ slug, description, chapters, edges, format = "comic" }: { slug: string; description: string | null; chapters: StoryChapter[]; edges: ReaderMapEdge[]; format?: string }) {
  const [tab, setTab] = useState<"chapters" | "map" | "about">("chapters");
  const { continuation, start, unlocked } = visibleChapterSections(chapters, chapters.find(chapter => chapter.current)?.id);
  const row = (chapter: StoryChapter, label: string) => <Link key={chapter.id} className="story-chapter-row" href={`/read/${slug}/${chapter.nodeKey}`}>
    <span className="story-chapter-icon" aria-hidden>✦</span>
    <span className="story-chapter-copy"><strong>{chapter.title}{chapter.premium ? " · Premium" : ""}</strong><small>{label}{format !== "web_novel" && chapter.panelCount > 0 ? ` · ${chapter.panelCount} panel` : ""}</small></span>
    <span aria-hidden>›</span>
  </Link>;
  return <section className="story-tabs">
    <div className="story-tab-buttons" role="tablist" aria-label="Informasi cerita" onKeyDown={event => { if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return; event.preventDefault(); const tabs = ["chapters", "map", "about"] as const; const next = tabs[(tabs.indexOf(tab) + (event.key === "ArrowRight" ? 1 : 2)) % 3]; setTab(next); document.getElementById(`tab-${next}`)?.focus(); }}>
      <button type="button" id="tab-chapters" role="tab" tabIndex={tab === "chapters" ? 0 : -1} aria-selected={tab === "chapters"} aria-controls="story-chapters" onClick={() => setTab("chapters")}>Bab</button>
      <button type="button" id="tab-map" role="tab" tabIndex={tab === "map" ? 0 : -1} aria-selected={tab === "map"} aria-controls="story-map" onClick={() => setTab("map")}>Peta cabang</button>
      <button type="button" id="tab-about" role="tab" tabIndex={tab === "about" ? 0 : -1} aria-selected={tab === "about"} aria-controls="story-about" onClick={() => setTab("about")}>Tentang</button>
    </div>
    {tab === "chapters" ? <div id="story-chapters" role="tabpanel" aria-labelledby="tab-chapters" className="story-chapter-list">
      <p className="story-tab-explainer">Bab lain dan jalur terkunci tersedia di Peta cabang.</p>
      {continuation && <div className="chapter-list-section"><h3>Continue</h3>{row(continuation, "Lanjutkan membaca")}</div>}
      {start && <div className="chapter-list-section"><h3>Awal Bab</h3>{row(start, start.owned ? "Mulai dari awal" : `Unlock · ${start.cost} coin`)}</div>}
      <div className="chapter-list-section"><h3>Bab terbuka · Baca ulang</h3>{unlocked.map(chapter => row(chapter, "Baca ulang · Gratis"))}{!unlocked.length && <p className="story-tab-explainer">Belum ada bab lain yang terbuka.</p>}</div>
    </div> : tab === "map" ? <div id="story-map" role="tabpanel" aria-labelledby="tab-map"><BranchMap slug={slug} edges={edges} nodes={chapters.map(chapter => ({ ...chapter, active: chapter.current }))} /></div> : <div id="story-about" role="tabpanel" aria-labelledby="tab-about" className="story-about"><p>{description || "Deskripsi cerita belum tersedia."}</p></div>}
  </section>;
}
