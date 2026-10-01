export type ReaderPreferences = { font: "serif" | "sans" | "literary"; size: number; spacing: number; theme: "dark" | "paper" | "night"; brightness: number; autoScroll: number; notifications: boolean };
export const defaultPreferences: ReaderPreferences = { font: "serif", size: 18, spacing: 1.65, theme: "dark", brightness: 100, autoScroll: 0, notifications: true };
export function parseReaderPreferences(value: unknown): ReaderPreferences {
  if (!value || typeof value !== "object") return { ...defaultPreferences };
  const v = value as Partial<ReaderPreferences>;
  const bounded = (n: unknown, fallback: number, min: number, max: number) => typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  return { font: ["serif", "sans", "literary"].includes(v.font ?? "") ? v.font! : "serif", size: bounded(v.size, 18, 14, 28), spacing: bounded(v.spacing, 1.65, 1.4, 2.2), theme: ["dark", "paper", "night"].includes(v.theme ?? "") ? v.theme! : "dark", brightness: bounded(v.brightness, 100, 60, 100), autoScroll: [0, 15, 30].includes(v.autoScroll ?? -1) ? v.autoScroll! : 0, notifications: typeof v.notifications === "boolean" ? v.notifications : true };
}
