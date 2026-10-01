"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export default function StoryRating({ storyId, slug, score, signedIn, eligible, ownStory }: { storyId: string; slug: string; score: number | null; signedIn: boolean; eligible: boolean; ownStory: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(score ?? 0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy || !value) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await createClient().rpc("rate_story", { p_story_id: storyId, p_score: value });
      if (error) throw error;
      setMessage("Rating tersimpan. Terima kasih!"); router.refresh();
    } catch { setMessage("Rating belum tersimpan. Baca cerita minimal 30 detik aktif, lalu coba lagi."); }
    finally { setBusy(false); }
  }
  if (!signedIn) return <p className="px-muted"><Link href={`/login?next=${encodeURIComponent(`/stories/${slug}`)}`}>Masuk untuk memberikan rating</Link></p>;
  if (ownStory) return <p className="px-muted">Rating diberikan oleh pembaca karya Anda.</p>;
  if (!eligible) return <p className="px-muted">Baca cerita minimal 30 detik aktif untuk memberikan rating.</p>;
  return <form onSubmit={submit} className="story-rating" aria-busy={busy}><fieldset disabled={busy}>
    <legend>{score ? "Perbarui rating Anda" : "Beri rating cerita"}</legend>
    <div className="story-rating-options">{[1, 2, 3, 4, 5].map(n => <label key={n}><input type="radio" name="rating" value={n} checked={value === n} onChange={() => setValue(n)} required /><Star size={25} fill={value >= n ? "currentColor" : "none"} aria-hidden /><span className="sr-only">{n} bintang</span></label>)}</div>
    <button className="px-secondary" disabled={!value || busy}>{busy ? "Menyimpan…" : "Simpan rating"}</button>
  </fieldset>{message && <p role="status">{message}</p>}</form>;
}
