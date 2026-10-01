export const storyFormatLabel = (format: string) => format === "web_novel" ? "Web Novel" : format === "motion_comic" ? "Motion Comic" : format === "video" ? "Video" : "Komik";
export function storyCoverUrl(coverPath: string | null): string | null {
  if (!coverPath) return null;
  if (coverPath.startsWith("/") && !coverPath.startsWith("//")) return coverPath;
  const publicPath = coverPath.replace(/^story-public\//, "");
  if (!publicPath || publicPath.includes("..")) return null;
  return `/api/reader/cover?path=${encodeURIComponent(coverPath)}`;
}
