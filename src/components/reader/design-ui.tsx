import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import type { Story } from "@/lib/data";
import { storyCoverUrl, storyFormatLabel } from "@/lib/story-media";
import { storyGenreLabel } from "@/lib/story-taxonomy";
import { ratingLabel } from "@/lib/story-engagement";

export function PageHeading({ title, back, children }: { title: string; back?: string; children?: React.ReactNode }) {
  return <header className={`px-heading ${back ? "px-heading-back" : ""}`}>{back && <Link href={back} className="px-icon-button" aria-label="Kembali"><ChevronLeft size={20} /></Link>}<h1>{title}</h1>{children || (back && <span className="px-heading-spacer" />)}</header>;
}
export function Cover({ path, title, className = "" }: { path: string | null; title: string; className?: string }) {
  const url = storyCoverUrl(path);
  return <span className={`px-cover ${className}`}>{url ? <Image src={url} alt={`Sampul ${title}`} fill sizes="(max-width: 600px) 160px, 240px" unoptimized /> : <BookOpen size={28} aria-hidden />}</span>;
}
export function StoryCard({ story }: { story: Story }) {
  return <Link className="px-story-card" href={`/stories/${story.slug}`}><Cover path={story.cover_path} title={story.title} /><strong>{story.title}</strong><small>{story.metrics?.author_name ?? "Pixinia Editorial"}</small><small>{story.genres.map(storyGenreLabel).slice(0, 2).join(" · ") || storyFormatLabel(story.default_format)}</small><small>{ratingLabel(story.metrics?.rating_average, story.metrics?.rating_count)}</small></Link>;
}
export function SectionHeading({ title, href, action = "Lihat semua" }: { title: string; href?: string; action?: string }) {
  return <div className="px-section-heading"><h2>{title}</h2>{href && <Link href={href}>{action}</Link>}</div>;
}
export function MenuLink({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail?: string }) {
  return <Link className="px-menu-link" href={href}><span className="px-menu-icon">{icon}</span><span><strong>{title}</strong>{detail && <small>{detail}</small>}</span><ChevronRight size={16} aria-hidden /></Link>;
}
export function ProgressBar({ value, label }: { value: number; label: string }) {
  return <div className="px-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}
