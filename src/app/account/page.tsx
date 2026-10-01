import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOut from "@/components/sign-out";
import CoinAction from "@/components/coin-action";

const names: Record<string, string> = { welcome: "Saldo awal", admin_credit: "Tambahan admin", unlock_node: "Unlock bab", unlock_story: "Unlock komik", reset_chapter: "Reset gratis", redeem_reward: "Redeem reward" };
export default async function Page() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login?next=/account");
  const [wallet, ledger, rewards, claims] = await Promise.all([
    db.from("coin_wallets").select("balance").eq("user_id", user.id).single(),
    db.from("coin_transactions").select("id,kind,amount,balance_after,note,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
    db.from("coin_rewards").select("id,title,description,cost").eq("active", true).order("created_at"),
    db.from("coin_reward_claims").select("id,title,cost,status,admin_note").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
  ]);
  for (const result of [wallet, ledger, rewards, claims]) if (result.error) throw result.error;
  const balance = Number(wallet.data?.balance ?? 0);
  return <main className="shell page"><div className="page-intro"><p className="eyebrow">AKUN</p><h1 className="page-title">Akun saya</h1><p>{user.email}</p></div><div className="coin-grid"><section className="panel"><h2>Wallet coin</h2><p className="coin-balance">{balance} <small>coin</small></p><p>Saldo awal 100 coin. Unlock default 5 coin per bab, berlaku permanen. Reset chapter gratis.</p><p className="muted">Untuk tambahan coin, hubungi admin.</p><SignOut /></section><section className="panel"><h2>Reward</h2>{rewards.data?.length ? rewards.data.map(reward => <article className="coin-item" key={reward.id}><h3>{reward.title}</h3><p>{reward.description}</p><CoinAction rpc="coin_redeem_reward" args={{ p_reward_id: reward.id }} label="Redeem reward" cost={reward.cost} balance={balance} /></article>) : <p className="muted">Belum ada reward tersedia.</p>}{!!claims.data?.length && <><h3>Reward saya</h3>{claims.data.map(claim => <p key={claim.id}>{claim.title} · {claim.cost} coin · {claim.status === "fulfilled" ? "Sudah diberikan" : "Menunggu admin"}{claim.admin_note && <small className="coin-choice-cost">{claim.admin_note}</small>}</p>)}</>}</section><section className="panel coin-history"><h2>Riwayat transaksi</h2><p className="muted">30 transaksi terbaru</p>{ledger.data?.map(item => <div key={item.id} className="coin-ledger-row"><div><strong>{names[item.kind] ?? item.kind}</strong><small>{new Date(item.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}{item.note ? ` · ${item.note}` : ""}</small></div><div><strong>{item.amount > 0 ? "+" : ""}{item.amount} coin</strong><small>Saldo {item.balance_after}</small></div></div>)}</section></div></main>;
}
