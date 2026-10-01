import { getStories } from "@/lib/data";
import Explore from "@/components/reader/explore";
export const metadata = { title: "Jelajahi cerita" };
export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ genre?: string; format?: string; tag?: string }> }) {
  const [stories, filters] = await Promise.all([getStories(), searchParams]);
  return <Explore stories={stories} initial={filters} />;
}
