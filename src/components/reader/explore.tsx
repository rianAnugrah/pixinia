"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import type { Story } from "@/lib/data";
import { storyGenreLabel } from "@/lib/story-taxonomy";
import { ratingLabel } from "@/lib/story-engagement";
import { Cover, PageHeading, StoryCard, SectionHeading } from "./design-ui";
export default function Explore({ stories, initial }: { stories: Story[]; initial: { genre?: string; format?: string; tag?: string } }) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState(initial.genre || "");
  const [format, setFormat] = useState(initial.format || "");
  const [tag, setTag] = useState(initial.tag || "");
  const [sort, setSort] = useState("latest");
  const [filters, setFilters] = useState(!!initial.format || !!initial.tag);
  const genres = [...new Set(stories.flatMap(story => story.genres))];
  const tags = [...new Set(stories.flatMap(story => story.tags))];
  const visible = stories.filter(story => (!genre || story.genres.includes(genre)) && (!tag || story.tags.includes(tag)) && (!format || (format === "comic" ? story.default_format !== "web_novel" : story.default_format === format)) && (!query.trim() || [story.title, story.tagline, story.description, ...story.tags].filter(Boolean).join(" ").toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID"))));
  if (sort === "title") visible.sort((a, b) => a.title.localeCompare(b.title, "id"));
  return <main className="px-page"><PageHeading title="Jelajahi"><button className="px-icon-button" aria-label="Filter cerita" aria-expanded={filters} onClick={() => setFilters(!filters)}><SlidersHorizontal size={19} /></button></PageHeading><div className="px-content">
    <label className="px-search"><Search size={18} /><input type="search" aria-label="Cari cerita" placeholder="Cari cerita, genre, dunia…" value={query} onChange={event => setQuery(event.target.value)} /><select aria-label="Urutkan cerita" value={sort} onChange={event => setSort(event.target.value)}><option value="latest">Terbaru</option><option value="title">A–Z</option></select></label>
    <div className="px-chips" aria-label="Genre"><button aria-pressed={!genre} onClick={() => setGenre("")}>Semua</button>{genres.map(value => <button key={value} aria-pressed={genre === value} onClick={() => setGenre(value)}>{storyGenreLabel(value)}</button>)}</div>
    {filters && <div className="px-filter-panel"><label>Format<select value={format} onChange={event => setFormat(event.target.value)}><option value="">Semua format</option><option value="web_novel">Web Novel</option><option value="comic">Komik</option></select></label><label>Tag<select value={tag} onChange={event => setTag(event.target.value)}><option value="">Semua tag</option>{tags.map(value => <option key={value}>{value}</option>)}</select></label></div>}
    <SectionHeading title={query || genre || format || tag ? `${visible.length} cerita ditemukan` : "Temukan kisah baru"} /><div className="px-story-rail">{visible.slice(0, 6).map(story => <StoryCard key={story.id} story={story} />)}</div>
    <div className="px-explore-list">{visible.map(story => <Link href={`/stories/${story.slug}`} key={story.id}><Cover path={story.cover_path} title={story.title} /><span><small>{story.genres.map(storyGenreLabel).join(" · ") || "CERITA INTERAKTIF"}</small><strong>{story.title}</strong><small>{story.metrics?.author_name ?? "Pixinia Editorial"} · {ratingLabel(story.metrics?.rating_average, story.metrics?.rating_count)}</small></span><ChevronRight size={16} /></Link>)}</div>
    {!visible.length && <div className="empty-state"><h2>Belum ada cerita yang cocok</h2><p>Coba kata kunci atau genre lain.</p><button className="px-button" onClick={() => { setQuery(""); setGenre(""); setFormat(""); setTag(""); }}>Hapus filter</button></div>}
  </div></main>;
}
