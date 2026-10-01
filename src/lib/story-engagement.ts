import type { SupabaseClient } from "@supabase/supabase-js";

export function missingFeatureFunction(error: { code?: string; message?: string } | null, name: string) {
  return !!error && ["42883", "PGRST202"].includes(error.code ?? "")
    && (error.message ?? "").includes(name);
}

export type StoryMetrics = {
  story_id: string; author_id: string | null; author_name: string;
  rating_average: number | null; rating_count: number; read_count: number; reader_count: number;
};
export type Analytics = {
  reads: number; readers: number; stories: number; ratings: number;
  users: null | { total: number; reader: number; creator: number; admin: number; new: number };
  top_stories: { id: string; slug: string; title: string; status: string; default_format: string; read_count: number; reader_count: number; rating_average: number | null; rating_count: number }[];
  daily: { day: string; reads: number; readers: number }[];
};
export function ratingLabel(average: number | null | undefined, count: number | undefined) {
  return count && average != null ? `${Number(average).toLocaleString("id-ID", { maximumFractionDigits: 1 })} / 5 · ${count.toLocaleString("id-ID")} rating` : "Belum ada rating";
}
export function analyticsDays(value: string | undefined) {
  const days = Number(value);
  return [7, 30, 90, 365].includes(days) ? days : 30;
}
export async function getStoryMetrics(db: SupabaseClient, ids: string[]): Promise<StoryMetrics[]> {
  const result: StoryMetrics[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await db.rpc("story_public_metrics", { p_story_ids: ids.slice(i, i + 200) });
    if (missingFeatureFunction(error, "story_public_metrics")) return [];
    if (error) throw error;
    result.push(...(data ?? []));
  }
  return result;
}
export async function readAnalytics(db: SupabaseClient, days: number, format?: string, authorId?: string): Promise<Analytics> {
  const { data, error } = await db.rpc("story_analytics", { p_days: days, p_format: format || null, p_author_id: authorId || null });
  if (error) throw error;
  return data as Analytics;
}
