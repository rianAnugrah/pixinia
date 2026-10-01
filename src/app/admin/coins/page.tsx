import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { CoinPrice, FulfillReward, GrantCoins, RewardForm } from "@/components/admin/coin-forms";

export default async function Page({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const { db } = await requireAdmin();
  const params = await searchParams;
  const initialUser = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.user ?? "") ? params.user : undefined;
  const [wallets, profiles, stories, nodes, rewards, claims, ledger] = await Promise.all([
    db.from("coin_wallets").select("user_id,balance").order("updated_at", { ascending: false }).limit(500),
    db.from("profiles").select("id,display_name").limit(500),
    db.from("stories").select("id,title,unlock_cost,is_premium").order("title"),
    db.from("story_nodes").select("id,story_id,title,unlock_cost,is_premium").order("title"),
    db.from("coin_rewards").select("id,title,description,cost,active").order("created_at", { ascending: false }),
    db.from("coin_reward_claims").select("id,user_id,title,cost,status,admin_note").order("created_at", { ascending: false }).limit(100),
    db.from("coin_transactions").select("id,user_id,kind,amount,note,balance_after").order("created_at", { ascending: false }).limit(50),
  ]);
  for (const result of [wallets, profiles, stories, nodes, rewards, claims, ledger]) if (result.error) throw result.error;
  const names = new Map((profiles.data ?? []).map(p => [p.id, p.display_name]));
  return <main className="shell page"><Link href="/admin">← Dashboard Admin</Link><div className="page-intro"><p className="eyebrow">ADMIN</p><h1 className="page-title">Coin & reward</h1><p>Saldo awal 100 coin · default unlock node 5 coin · reset gratis.</p></div><div className="coin-grid"><section className="panel"><h2>Tambah coin manual</h2><GrantCoins initialUser={initialUser} wallets={(wallets.data ?? []).map(w => ({ ...w, name: names.get(w.user_id) || "User" }))} /><p className="muted">500 wallet terbaru. Setiap tambahan tercatat bersama admin dan catatannya.</p></section><section className="panel"><h2>Reward baru</h2><RewardForm /></section><section className="panel coin-history"><h2>Harga komik & node</h2>{stories.data?.map(story => <details key={story.id} className="coin-item"><summary>{story.title}</summary><CoinPrice kind="story" id={story.id} cost={story.unlock_cost} premium={story.is_premium} />{nodes.data?.filter(n => n.story_id === story.id).map(node => <details key={node.id} className="coin-item"><summary>{node.title} · {node.unlock_cost} coin{node.is_premium ? " · Premium" : ""}</summary><CoinPrice kind="node" id={node.id} cost={node.unlock_cost} premium={node.is_premium} /></details>)}</details>)}</section><section className="panel"><h2>Katalog reward</h2>{rewards.data?.map(reward => <details className="coin-item" key={reward.id}><summary>{reward.title} · {reward.cost} coin · {reward.active ? "Aktif" : "Nonaktif"}</summary><RewardForm reward={reward} /></details>)}</section><section className="panel"><h2>Redeem reward</h2>{claims.data?.length ? claims.data.map(claim => <article className="coin-item" key={claim.id}><h3>{claim.title} · {claim.cost} coin</h3><p>{names.get(claim.user_id) || claim.user_id}</p>{claim.status === "pending" ? <FulfillReward id={claim.id} /> : <p>Sudah diberikan · {claim.admin_note}</p>}</article>) : <p>Belum ada redeem.</p>}</section><section className="panel coin-history"><h2>50 transaksi terbaru</h2>{ledger.data?.map(t => <div className="coin-ledger-row" key={t.id}><div><strong>{t.kind}</strong><small>{names.get(t.user_id) || t.user_id} · {t.note}</small></div><div><strong>{t.amount > 0 ? "+" : ""}{t.amount} coin</strong><small>Saldo {t.balance_after}</small></div></div>)}</section></div></main>;
}
