"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

function RpcForm({ rpc, build, children, label }: { rpc: string; build: (data: FormData) => Record<string, unknown>; children: ReactNode; label: string }) {
  const router = useRouter();
  const request = useRef<{ id: string; payload: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const args = build(new FormData(event.currentTarget));
    const payload = JSON.stringify(args);
    if (rpc === "admin_grant_coins") {
      if (request.current?.payload !== payload) request.current = { id: crypto.randomUUID(), payload };
      args.p_request_id = request.current.id;
    }
    setBusy(true); setMessage("");
    try {
      const { error } = await createClient().rpc(rpc, args);
      if (error) throw error;
      request.current = null; setMessage("Tersimpan."); router.refresh();
    } catch { setMessage("Belum tersimpan. Periksa nilai, izin admin, dan koneksi."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="coin-form" aria-busy={busy}><fieldset disabled={busy}>{children}<button className="primary-button" type="submit">{busy ? "Menyimpan…" : label}</button></fieldset>{message && <p role="status">{message}</p>}</form>;
}

export function GrantCoins({ wallets }: { wallets: { user_id: string; balance: number; name: string }[] }) {
  return <RpcForm rpc="admin_grant_coins" label="Tambah coin" build={d => ({ p_user_id: d.get("user"), p_amount: Number(d.get("amount")), p_note: String(d.get("note")).trim() })}><label className="field"><span>User</span><input name="user" list="coin-users" required pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" placeholder="Pilih user atau masukkan UUID" /><datalist id="coin-users">{wallets.map(w => <option key={w.user_id} value={w.user_id}>{w.name} · {w.balance} coin</option>)}</datalist></label><label className="field"><span>Jumlah coin</span><input name="amount" type="number" min="1" max="1000000" step="1" required /></label><label className="field"><span>Catatan audit</span><input name="note" minLength={3} maxLength={500} required /></label></RpcForm>;
}

export function CoinPrice({ kind, id, cost, premium }: { kind: "node" | "story"; id: string; cost: number; premium: boolean }) {
  return <RpcForm rpc="admin_set_coin_price" label="Simpan harga" build={d => ({ p_kind: kind, p_id: id, p_cost: Number(d.get("cost")), p_premium: d.get("premium") === "on" })}><label className="field"><span>{kind === "story" ? "Harga seluruh komik premium" : "Harga unlock bab"}</span><input name="cost" type="number" min="0" max="1000000" step="1" defaultValue={cost} required /></label><label><input type="checkbox" name="premium" defaultChecked={premium} /> {kind === "story" ? "Komik premium (bisa dibeli seluruhnya)" : "Node premium"}</label><p className="muted">Harga 0 membuat konten gratis. Kepemilikan yang sudah dibeli tetap berlaku.</p></RpcForm>;
}

export function RewardForm({ reward }: { reward?: { id: string; title: string; description: string; cost: number; active: boolean } }) {
  return <RpcForm rpc="admin_save_coin_reward" label={reward ? "Simpan reward" : "Buat reward"} build={d => ({ p_id: reward?.id ?? null, p_title: String(d.get("title")), p_description: String(d.get("description")), p_cost: Number(d.get("cost")), p_active: d.get("active") === "on" })}><label className="field"><span>Nama reward</span><input name="title" required maxLength={120} defaultValue={reward?.title} /></label><label className="field"><span>Deskripsi & cara menerima</span><textarea name="description" maxLength={2000} defaultValue={reward?.description} /></label><label className="field"><span>Harga coin</span><input name="cost" type="number" min="1" max="1000000" step="1" required defaultValue={reward?.cost} /></label><label><input type="checkbox" name="active" defaultChecked={reward?.active} /> Tampilkan untuk user</label></RpcForm>;
}

export function FulfillReward({ id }: { id: string }) {
  return <RpcForm rpc="admin_fulfill_coin_reward" label="Tandai sudah diberikan" build={d => ({ p_claim_id: id, p_note: String(d.get("note")) })}><label className="field"><span>Catatan pemberian reward</span><input name="note" required minLength={3} maxLength={500} /></label></RpcForm>;
}
