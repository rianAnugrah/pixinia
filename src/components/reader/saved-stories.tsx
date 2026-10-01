"use client";
import { useEffect, useState } from "react";
import { Bookmark, Check } from "lucide-react";
export function savedStoryKey(accountKey: string) { return `pixinia:saved:${accountKey}`; }
export function readSavedStories(accountKey: string): string[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(savedStoryKey(accountKey)) || "[]"); return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; } catch { return []; }
}
export default function SaveStory({ storyId, accountKey }: { storyId: string; accountKey: string }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { const update = () => setSaved(readSavedStories(accountKey).includes(storyId)); update(); window.addEventListener("storage", update); window.addEventListener("pixinia:saved", update); return () => { window.removeEventListener("storage", update); window.removeEventListener("pixinia:saved", update); }; }, [accountKey, storyId]);
  function toggle() { try { const ids = readSavedStories(accountKey); const next = ids.includes(storyId) ? ids.filter(id => id !== storyId) : [...ids, storyId]; localStorage.setItem(savedStoryKey(accountKey), JSON.stringify(next)); setSaved(next.includes(storyId)); setError(""); window.dispatchEvent(new Event("pixinia:saved")); } catch { setError("Penyimpanan browser tidak tersedia."); } }
  return <div><button className="px-secondary" aria-pressed={saved} onClick={toggle}>{saved ? <Check size={17} /> : <Bookmark size={17} />}{saved ? "Tersimpan" : "Simpan"}</button>{error && <small role="alert">{error}</small>}</div>;
}
