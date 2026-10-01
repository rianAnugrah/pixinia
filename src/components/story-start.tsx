"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import BusyStatus from "@/components/busy-status";
import CoinAction from "@/components/coin-action";
import Link from "next/link";

export default function StoryStart({ storyId, slug, startKey, currentKey, signedIn, cost = 0, balance = 0 }: { storyId: string; slug: string; startKey: string; currentKey?: string; signedIn: boolean; cost?: number; balance?: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function begin() {
    if (busy) return;
    setBusy(true); setError("");
    if (!signedIn) { router.push(`/login?next=${encodeURIComponent(`/stories/${slug}`)}`); return; }
    if (currentKey) { router.push(`/read/${slug}/${currentKey}`); return; }
    try {
      const { error } = await createClient().rpc("start_story", { p_story_id: storyId }).abortSignal(AbortSignal.timeout(15000));
      if (error) throw error;
      router.push(`/read/${slug}/${startKey}`);
    } catch (cause) { setError(typeof cause === "object" && cause !== null && "message" in cause && String(cause.message).includes("Coin tidak cukup") ? "Coin tidak cukup. Hubungi admin untuk menambah saldo." : "Cerita belum dapat dimulai. Coba lagi."); setBusy(false); }
  }
  if (currentKey) return <Link className="primary-button" href={`/read/${slug}/${currentKey}`}>Lanjutkan membaca →</Link>;
  if (cost > 0) return <CoinAction rpc="start_story" args={{ p_story_id: storyId }} label="Mulai membaca" cost={cost} balance={balance} signedIn={signedIn} next={`/read/${slug}/${startKey}`} />;
  return <><button className="primary-button" disabled={busy} aria-busy={busy} onClick={begin}>{busy ? <BusyStatus>Memulai cerita…</BusyStatus> : "Mulai membaca →"}</button>{error && <p role="alert" className="form-error">{error}</p>}</>;
}
