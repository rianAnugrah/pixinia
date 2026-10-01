import { notFound } from "next/navigation";
import Link from "next/link";
import { LocateFixed } from "lucide-react";
import { getStory } from "@/lib/data";
import { getReaderDashboard } from "@/lib/reader-dashboard";
import { getReaderNavigation } from "@/lib/reader-navigation";
import BranchMap from "@/components/reader/branch-map";
import { PageHeading } from "@/components/reader/design-ui";
export const metadata = { title: "Peta perjalanan" };
export default async function StoryMap({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [story, d] = await Promise.all([getStory(slug), getReaderDashboard()]); if (!story) notFound();
  const nav = await getReaderNavigation(story, d.user?.id);
  const current = nav.chapters.find(node => node.active);
  const start = nav.chapters.find(node => node.isStart);
  const target = current || start;
  const chapters = nav.chapters.map(node => ({ ...node, current: node.id === target?.id }));
  return <main className="px-page px-map-page"><PageHeading title="Perjalananmu" back={`/stories/${slug}`} /><p className="px-map-story">{story.title}</p><div className="px-map-summary"><div><small>SAAT INI</small><strong>{current?.title || "Petualangan baru"}</strong></div><div><strong>{chapters.filter(node => node.visited).length}</strong><small>Bab</small></div><div><strong>{chapters.filter(node => node.ending && node.visited).length}/{chapters.filter(node => node.ending).length}</strong><small>Akhir</small></div></div><BranchMap slug={slug} nodes={chapters} edges={nav.edges} />{target && <Link className="px-button px-map-return" href={`/read/${slug}/${target.nodeKey}`}><LocateFixed size={17} />{current ? "Kembali ke bab saat ini" : "Mulai perjalanan"}</Link>}</main>;
}
