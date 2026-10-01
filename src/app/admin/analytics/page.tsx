import { requireAdmin } from "@/lib/admin";
import { analyticsDays, readAnalytics } from "@/lib/story-engagement";
import AnalyticsView from "@/components/admin/analytics";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string; format?: string; author?: string }> }) {
  const { db } = await requireAdmin(); const p = await searchParams;
  const days = analyticsDays(p.days);
  const format = ["comic", "web_novel", "motion_comic", "video"].includes(p.format ?? "") ? p.format : undefined;
  const author = /^[0-9a-f-]{36}$/i.test(p.author ?? "") ? p.author : undefined;
  const [data, authors] = await Promise.all([readAnalytics(db, days, format, author), db.from("profiles").select("id,display_name").in("role", ["creator", "admin"]).order("display_name")]);
  if (authors.error) throw authors.error;
  return <AnalyticsView data={data} days={days} format={format} authorId={author} authors={authors.data ?? []} />;
}
