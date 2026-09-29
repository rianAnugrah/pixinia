"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import type { Choice } from "@/lib/data";

export default function ReaderActions({ storyId, slug, choices, targets, signedIn }: { storyId: string; slug: string; choices: Choice[]; targets: Record<string,string>; signedIn: boolean }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function choose(choice: Choice) {
    if (!signedIn) { router.push(`/login?next=${encodeURIComponent(`/stories/${slug}`)}`); return; }
    setBusy(true); setError("");
    const { error } = await createClient().rpc("apply_story_choice", { p_story_id: storyId, p_choice_id: choice.id });
    if (error) { setError("Pilihan tidak dapat disimpan. Muat ulang cerita dan coba lagi."); setBusy(false); return; }
    router.push(`/read/${slug}/${targets[choice.next_node_id]}`); router.refresh();
  }
  return <div className="choices"><h2>{choices.length ? "Apa yang kamu pilih?" : "Tamat"}</h2>{choices.map(choice => <button className="choice" key={choice.id} disabled={busy} onClick={() => choose(choice)}><span>{choice.label}</span><span aria-hidden>→</span></button>)}{error && <p className="form-error" role="alert">{error}</p>}{!choices.length && <a className="text-link" href={`/stories/${slug}`}>Kembali ke cerita</a>}</div>;
}
