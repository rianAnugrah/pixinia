import { requireStaff } from "@/lib/admin";
import { analyticsDays, readAnalytics } from "@/lib/story-engagement";
import AnalyticsView from "@/components/admin/analytics";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string; format?: string }> }) {
  const { db, user } = await requireStaff(); const p = await searchParams;
  const days = analyticsDays(p.days);
  const format = ["comic", "web_novel", "motion_comic", "video"].includes(p.format ?? "") ? p.format : undefined;
  return <AnalyticsView data={await readAnalytics(db, days, format, user.id)} days={days} format={format} />;
}
