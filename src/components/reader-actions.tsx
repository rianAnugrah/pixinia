"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import type { Choice } from "@/lib/data";
import BusyStatus from "@/components/busy-status";
import { Coins, LockKeyhole, ChevronRight, Check, Trophy } from "lucide-react";
import CoinConfirmPopover from "@/components/reader/coin-confirm-popover";

type ReaderActionProps = {
  nodeId: string; progressVersion: string | null;
  storyId: string; slug: string; choices: Choice[]; targets: Record<string, string>; costs?: Record<string, number>; balance?: number; signedIn: boolean; isEnding?: boolean;
};

export default function ReaderActions(props: ReaderActionProps) {
  // Next.js may reuse this client component between dynamic chapter routes.
  // A new chapter or reset must get fresh mutation/error state.
  return <ReaderChoices key={JSON.stringify([props.storyId, props.nodeId, props.progressVersion])} {...props} />;
}

function ReaderChoices({ storyId, slug, choices, targets, costs = {}, balance = 0, signedIn, isEnding = false }: ReaderActionProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState<Choice | null>(null);
  const inFlight = useRef(false);
  const router = useRouter();
  function requestChoice(choice: Choice) {
    if (inFlight.current || busyId) return;
    if (!signedIn) { router.push(`/login?next=${encodeURIComponent(`/read/${slug}/${targets[choice.node_id] || ""}`)}`); return; }
    if ((costs[choice.next_node_id] ?? 0) > 0) { setError(""); setPending(choice); }
    else return choose(choice);
  }
  async function choose(choice: Choice) {
    if (inFlight.current || busyId) return;
    const cost = costs[choice.next_node_id] ?? 0;
    if (signedIn && cost > balance) { setError("Coin tidak cukup. Hubungi admin untuk menambah saldo."); return; }
    inFlight.current = true;
    setBusyId(choice.id); setError(""); setConflict(false);
    if (!signedIn) { router.push(`/login?next=${encodeURIComponent(`/stories/${slug}`)}`); return; }
    try {
      const { error: rpcError } = await createClient().rpc("apply_story_choice", { p_story_id: storyId, p_choice_id: choice.id }).abortSignal(AbortSignal.timeout(15000));
      if (rpcError) throw rpcError;
      router.push(`/read/${slug}/${targets[choice.next_node_id]}`);
    } catch (cause) {
      const isConflict = typeof cause === "object" && cause !== null && "code" in cause && cause.code === "40001";
      setConflict(isConflict);
      const insufficient = typeof cause === "object" && cause !== null && "message" in cause && String(cause.message).includes("Coin tidak cukup");
      setError(isConflict ? "Posisi ceritamu berubah di tab lain. Muat ulang progres untuk melanjutkan." : insufficient ? "Coin tidak cukup. Hubungi admin untuk menambah saldo." : "Pilihan belum tersimpan. Periksa koneksi dan coba lagi.");
      setBusyId(null);
      inFlight.current = false;
    }
  }
  return <section className="choices" id="pilihan-bab" aria-busy={!!busyId}>
    <p className="reader-choice-kicker">{isEnding ? "PERJALANAN SELESAI" : "TENTUKAN ARAH CERITA"}</p>
    <h2>{isEnding ? "Tamat" : choices.length ? "Apa yang kamu pilih?" : "Lanjutan belum tersedia"}</h2>
    {isEnding && <p className="reader-ending-note"><Trophy size={22} /> Kamu mencapai satu akhir. Buka peta bab untuk menjelajahi jalur lain.</p>}
    {signedIn && choices.length > 0 && <p className="reader-choice-balance"><Coins size={17} /> Saldo {balance} coin <span>· unlock permanen</span></p>}
    {choices.map(choice => <button className={`choice ${(costs[choice.next_node_id] ?? 0) > 0 ? "choice-locked" : "choice-open"}`} type="button" key={choice.id} disabled={!!busyId} onClick={() => requestChoice(choice)}><span>{busyId === choice.id ? <BusyStatus>Menyimpan pilihan…</BusyStatus> : choice.label}<small className="coin-choice-cost">{(costs[choice.next_node_id] ?? 0) > 0 ? <><Coins size={14} />{costs[choice.next_node_id]} coin</> : <><Check size={14} />Terbuka · Gratis</>}</small></span>{(costs[choice.next_node_id] ?? 0) > 0 ? <LockKeyhole size={20} /> : <ChevronRight size={21} />}</button>)}
    {pending && <CoinConfirmPopover title={balance < (costs[pending.next_node_id] ?? 0) ? "Coin belum cukup" : "Buka jalur ini?"} onClose={() => setPending(null)} busy={!!busyId}><p>{pending.label}</p><div className="reader-purchase-price"><Coins size={20} /><strong>{costs[pending.next_node_id]}</strong><span>coin</span></div><dl className="reader-purchase-summary"><div><dt>Saldo kamu</dt><dd>{balance} coin</dd></div><div><dt>{balance < costs[pending.next_node_id] ? "Kekurangan" : "Sisa setelah unlock"}</dt><dd>{Math.abs(balance - costs[pending.next_node_id])} coin</dd></div></dl>{error && <p role="alert">{error}</p>}<div className="reader-dialog-actions">{balance < costs[pending.next_node_id] ? <Link className="reader-primary" href="/account">Tambah coin</Link> : <button className="reader-primary" disabled={!!busyId} onClick={() => choose(pending)}>{busyId ? "Membuka…" : `Buka · ${costs[pending.next_node_id]} coin`}</button>}<button className="reader-secondary" disabled={!!busyId} onClick={() => setPending(null)}>Batal</button></div></CoinConfirmPopover>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {conflict && <button className="reader-reload" type="button" onClick={() => window.location.reload()}>Muat ulang progres</button>}
    {!choices.length && <Link className="reader-back-story" href={`/stories/${slug}`}>{isEnding ? "Kembali ke cerita" : "Lihat detail cerita"} →</Link>}
    {!signedIn && choices.length > 0 && <p className="reader-choice-note">Masuk untuk menyimpan pilihan dan melanjutkan cerita.</p>}
  </section>;
}
