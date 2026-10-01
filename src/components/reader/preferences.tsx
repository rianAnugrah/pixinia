"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { defaultPreferences, parseReaderPreferences, type ReaderPreferences } from "@/lib/reader-preferences";
const Context = createContext<{ preferences: ReaderPreferences; update: (value: Partial<ReaderPreferences>) => void; error: string }>({ preferences: defaultPreferences, update: () => {}, error: "" });
export function useReaderPreferences() { return useContext(Context); }
export default function ReaderPreferencesProvider({ children, accountKey }: { children: React.ReactNode; accountKey: string }) {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [error, setError] = useState("");
  const path = usePathname();
  const key = `pixinia:reader:v1:${accountKey}`;
  useEffect(() => {
    const read = () => { try { setPreferences(parseReaderPreferences(JSON.parse(localStorage.getItem(key) || "null"))); } catch { setPreferences(defaultPreferences); } };
    read(); window.addEventListener("storage", read); return () => window.removeEventListener("storage", read);
  }, [key]);
  function update(value: Partial<ReaderPreferences>) {
    const next = parseReaderPreferences({ ...preferences, ...value }); setPreferences(next);
    try { localStorage.setItem(key, JSON.stringify(next)); setError(""); } catch { setError("Pengaturan berlaku saat ini, tetapi browser tidak mengizinkan penyimpanan."); }
  }
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.readerTheme = preferences.theme;
    root.style.setProperty("--reading-size", `${preferences.size}px`);
    root.style.setProperty("--reading-spacing", String(preferences.spacing));
    root.style.setProperty("--reading-font", preferences.font === "sans" ? "var(--font-inter), Arial, sans-serif" : preferences.font === "literary" ? 'Georgia, "Times New Roman", serif' : "var(--font-lora), Georgia, serif");
    root.style.setProperty("--reading-brightness", String(preferences.brightness / 100));
  }, [preferences]);
  useEffect(() => {
    if (!path.startsWith("/read/") || !preferences.autoScroll || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0, previous = 0, carry = 0, paused = false;
    const stop = () => { paused = true; };
    const tick = (time: number) => {
      const choices = document.getElementById("akhir-bab");
      if (document.querySelector("dialog[open]") || document.hidden) { previous = time; frame = requestAnimationFrame(tick); return; }
      if (paused || (choices && choices.getBoundingClientRect().top < innerHeight - 80)) return;
      if (previous) { carry += Math.min(time - previous, 100) / 1000 * preferences.autoScroll; const pixels = Math.floor(carry); if (pixels) { window.scrollBy({ top: pixels, behavior: "instant" }); carry -= pixels; } }
      previous = time; frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener("pointerdown", stop, { passive: true }); window.addEventListener("wheel", stop, { passive: true }); window.addEventListener("keydown", stop);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("pointerdown", stop); window.removeEventListener("wheel", stop); window.removeEventListener("keydown", stop); };
  }, [path, preferences.autoScroll]);
  return <Context.Provider value={{ preferences, update, error }}>{children}</Context.Provider>;
}
