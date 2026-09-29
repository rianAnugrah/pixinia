"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function StoryStart({ storyId, slug, startKey, currentKey, signedIn }: { storyId: string; slug: string; startKey: string; currentKey?: string; signedIn: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function begin() {
    if (!signedIn) { router.push(`/login?next=${encodeURIComponent(`/stories/${slug}`)}`); return; }
    if (currentKey) { router.push(`/read/${slug}/${currentKey}`); return; }
    setBusy(true); setError("");
    const { error } = await createClient().rpc("start_story", { p_story_id: storyId });
    if (error) { setError(error.message); setBusy(false); return; }
    router.push(`/read/${slug}/${startKey}`); router.refresh();
  }
  return <><button className="primary-button" disabled={busy} onClick={begin}>{busy ? "Memulai…" : currentKey ? "Lanjutkan membaca →" : "Mulai membaca →"}</button>{error && <p role="alert" className="form-error">{error}</p>}</>;
}
