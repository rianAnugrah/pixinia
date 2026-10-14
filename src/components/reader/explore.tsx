"use client";
import { useState } from "react";
import { ArrowDownAZ, Search, SlidersHorizontal, X } from "lucide-react";
import type { Story } from "@/lib/data";
import { storyGenreLabel } from "@/lib/story-taxonomy";
import { PageHeading, StoryCard } from "./design-ui";

export default function Explore({ stories, initial }: { stories: Story[]; initial: { genre?: string; format?: string; tag?: string } }) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState(initial.genre || "");
  const [format, setFormat] = useState(initial.format || "");
  const [tag, setTag] = useState(initial.tag || "");
  const [sort, setSort] = useState("latest");
  const [filters, setFilters] = useState(!!initial.tag);
  const genres = [...new Set(stories.flatMap(story => story.genres))];
  const tags = [...new Set(stories.flatMap(story => story.tags))];
  const visible = stories.filter(story => (!genre || story.genres.includes(genre)) && (!tag || story.tags.includes(tag)) && (!format || (format === "comic" ? story.default_format !== "web_novel" : story.default_format === format)) && (!query.trim() || [story.title, story.tagline, story.description, ...story.genres.map(storyGenreLabel), ...story.tags].filter(Boolean).join(" ").toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID"))));
  if (sort === "title") visible.sort((a, b) => a.title.localeCompare(b.title, "id"));
  const active = !!(query || genre || format || tag);
  function reset() { setQuery(""); setGenre(""); setFormat(""); setTag(""); }
  return <main className="px-page px-explore"><PageHeading title="Temukan dunia berikutnya." /><div className="px-content"><p className="section-description">Komik dan novel interaktif. Satu pilihan bisa mengubah segalanya.</p>
    <div className="explore-toolbar"><label className="px-search"><Search size={20} aria-hidden /><input type="search" aria-label="Cari cerita" placeholder="Cari judul, genre, atau dunia yang kamu suka…" value={query} onChange={event => setQuery(event.target.value)} /></label><button className="px-secondary" aria-expanded={filters} aria-controls="explore-filters" onClick={() => setFilters(!filters)}><SlidersHorizontal size={17} aria-hidden />Filter{tag && <span className="filter-dot" />}</button></div>
    <div className="explore-formats px-segmented" role="group" aria-label="Format cerita">{[["", "Semua cerita"], ["web_novel", "Web Novel"], ["comic", "Komik"]].map(([value, label]) => <button key={value} aria-pressed={format === value} onClick={() => setFormat(value)}>{label}</button>)}</div>
    <div className="px-chips explore-genres" role="group" aria-label="Genre"><button aria-pressed={!genre} onClick={() => setGenre("")}>Semua genre</button>{genres.map(value => <button key={value} aria-pressed={genre === value} onClick={() => setGenre(value)}>{storyGenreLabel(value)}</button>)}</div>
    {filters && <div className="explore-tags" id="explore-filters"><p>Tag cerita</p><div className="px-chips" role="group" aria-label="Tag cerita"><button aria-pressed={!tag} onClick={() => setTag("")}>Semua tag</button>{tags.map(value => <button key={value} aria-pressed={tag === value} onClick={() => setTag(value)}>#{value}</button>)}</div></div>}
    <div className="explore-results-heading"><p role="status"><strong>{visible.length}</strong> cerita{active ? " ditemukan" : " untuk kamu jelajahi"}</p><button className="explore-sort" onClick={() => setSort(sort === "latest" ? "title" : "latest")} aria-label={`Urutan ${sort === "latest" ? "terbaru" : "judul A–Z"}. Klik untuk mengganti.`}><ArrowDownAZ size={17} aria-hidden />{sort === "latest" ? "Terbaru" : "Judul A–Z"}</button></div>
    {active && <button className="explore-reset" onClick={reset}><X size={14} aria-hidden />Hapus semua filter</button>}
    <div className="discovery-story-grid">{visible.map(story => <StoryCard key={story.id} story={story} />)}</div>
    {!visible.length && <div className="empty-state"><Search size={30} aria-hidden /><h2>Belum menemukan kisahmu?</h2><p>Coba kata kunci lain atau hapus filter untuk melihat semua cerita.</p><button className="px-button" onClick={reset}>Tampilkan semua cerita</button></div>}
  </div></main>;
}
