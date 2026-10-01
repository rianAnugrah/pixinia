"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Coins, ShieldCheck, Unlock, BookOpen, GitBranch, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import CoinConfirmPopover from "@/components/reader/coin-confirm-popover";

type CoinActionProps = {
  rpc: string; args: Record<string, string>; label: string; cost?: number; balance?: number; signedIn?: boolean; next?: string; confirmText?: string;
};
export default function CoinAction(props: CoinActionProps) {
  return <CoinTransaction key={JSON.stringify([props.rpc, props.args])} {...props} />;
}
function CoinTransaction({ rpc, args, label, cost = 0, balance, signedIn = true, next, confirmText }: CoinActionProps) {
  const router = useRouter();
  const request = useRef<string | null>(null);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const insufficient = signedIn && balance !== undefined && balance < cost;
  function begin() {
    if (inFlight.current) return;
    if (!signedIn) { router.push(`/login?next=${encodeURIComponent(next || "/account")}`); return; }
    setMessage("");
    if (cost === 0) { void transact(); return; }
    setConfirm(true);
  }
  async function transact() {
    if (inFlight.current || insufficient) return;
    inFlight.current = true; setBusy(true); setMessage("");
    request.current ??= crypto.randomUUID();
    try {
      // start_story is idempotent by the user's existing progress row.
      const rpcArgs = rpc === "start_story" ? args : { ...args, p_request_id: request.current };
      const { error } = await createClient().rpc(rpc, rpcArgs).abortSignal(AbortSignal.timeout(15000));
      if (error) throw error;
      request.current = null; setConfirm(false);
      if (rpc === "coin_unlock_node" && next) { setUnlocked(true); return; }
      if (next && (typeof window === "undefined" || next !== window.location.pathname)) { router.push(next); return; }
      setMessage("Berhasil."); router.refresh();
    } catch (cause) {
      const text = typeof cause === "object" && cause !== null && "message" in cause ? String(cause.message) : "";
      setMessage(text.includes("Coin tidak cukup") ? "Coin tidak cukup. Buka wallet untuk mengecek saldo terbaru." : "Belum mendapat konfirmasi transaksi. Coba lagi; transaksi yang sama tidak akan ditagih dua kali.");
    } finally { inFlight.current = false; setBusy(false); }
  }
  if (unlocked && next) return <section className="px-unlock-success" aria-label="Jalur berhasil dibuka"><div className="px-unlock-art" aria-hidden><Unlock size={28} /></div><p className="px-kicker px-gold">JALUR BARU</p><h2>Jalur cerita terbuka</h2><p role="status">Bab ini sekarang menjadi bagian dari perjalananmu. Baca ulang kapan saja tanpa biaya.</p><div className="px-unlock-discovery"><Sparkles size={23} /><div><strong>Satu kemungkinan baru</strong><small>Unlock berhasil · Akses permanen</small></div></div><button className="px-button" onClick={() => { router.push(next); router.refresh(); }}><BookOpen size={18} />Lanjutkan cerita</button><Link className="px-secondary" href={`/stories/${next.split("/")[2]}/map`}><GitBranch size={18} />Lihat peta cerita</Link></section>;
  return <div className="coin-action"><button className="primary-button" onClick={begin} disabled={busy} aria-busy={busy}>{busy ? "Memproses…" : `${label}${cost > 0 ? ` · ${cost} coin` : ""}`}</button>
    {!confirm && message && <p role="status">{message}</p>}
    {confirm && <CoinConfirmPopover title={insufficient ? "Coin belum cukup" : "Buka jalur ini?"} onClose={() => setConfirm(false)} busy={busy}>
      <p>{confirmText || label}</p>
      <div className="reader-purchase-price"><Coins size={28} /><strong>{cost}</strong><span>coin</span></div>
      {balance !== undefined && <dl className="reader-purchase-summary"><div><dt>Saldo kamu</dt><dd>{balance} coin</dd></div><div><dt>{insufficient ? "Kekurangan" : "Sisa setelah transaksi"}</dt><dd>{insufficient ? cost - balance : balance - cost} coin</dd></div></dl>}
      {insufficient ? <p>Hubungi admin untuk menambah coin, lalu coba lagi.</p> : <p className="reader-unlock-assurance"><ShieldCheck size={17} />{rpc === "coin_redeem_reward" ? "Reward masuk ke daftar klaim setelah konfirmasi." : "Unlock tetap dimiliki. Membaca ulang dan reset gratis."}</p>}
      {message && <p role="alert" className="form-error">{message}</p>}
      <div className="reader-dialog-actions">{insufficient ? <Link className="reader-primary" href="/account">Buka wallet</Link> : <button className="reader-primary" disabled={busy} onClick={transact}>{busy ? "Membuka…" : `Buka · ${cost} coin`}</button>}<button className="reader-secondary" disabled={busy} onClick={() => setConfirm(false)}>Batal</button></div>
    </CoinConfirmPopover>}
  </div>;
}
