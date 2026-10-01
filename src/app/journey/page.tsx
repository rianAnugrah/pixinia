import Link from "next/link";
import { redirect } from "next/navigation";
import { GitBranch } from "lucide-react";
import { getStories } from "@/lib/data";
import { getReaderDashboard } from "@/lib/reader-dashboard";
import { PageHeading, MenuLink } from "@/components/reader/design-ui";
export const metadata = { title: "Perjalananmu" };
export default async function Journey() {
  const [d, stories] = await Promise.all([getReaderDashboard(), getStories()]);
  const current = d.progress.map(row => stories.find(story => story.id === row.story_id)).find(Boolean);
  if (current) redirect(`/stories/${current.slug}/map`);
  return <main className="px-page"><PageHeading title="Perjalananmu" /><div className="px-content"><section className="empty-state"><GitBranch size={36} /><h2>Setiap pilihan adalah awal</h2><p>Pilih cerita untuk melihat peta cabang dan kemungkinan akhir.</p><Link href="/explore" className="px-button">Temukan cerita</Link></section>{stories.map(story => <MenuLink key={story.id} href={`/stories/${story.slug}/map`} title={story.title} detail="Lihat peta cerita" icon={<GitBranch size={18} />} />)}</div></main>;
}
