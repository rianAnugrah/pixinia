import Link from "next/link";
import { redirect } from "next/navigation";
import { Coins, Gift, Sparkles, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CoinAction from "@/components/coin-action";
import { PageHeading, SectionHeading, MenuLink } from "@/components/reader/design-ui";
const names: Record<string, string> = { welcome: "Saldo awal", admin_credit: "Tambahan coin", unlock_node: "Bab dibuka", unlock_story: "Cerita dibuka", reset_chapter: "Reset gratis", redeem_reward: "Penukaran reward" };
export const metadata = { title: "Wallet coin" };
export default async function Wallet() {
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
  return <main className="px-page px-wallet"><PageHeading title="Wallet coin" back="/profile"><Link className="px-icon-button" href="#coin-help" aria-label="Tentang coin"><HelpCircle size={20} /></Link></PageHeading><div className="px-content"><section className="px-wallet-balance"><div><small>SALDO KAMU</small><Coins size={20} /></div><p><span className="px-gold-dot" /><strong>{balance.toLocaleString("id-ID")}</strong><span>Coin</span></p></section>
    <div className="px-wallet-info"><span><Gift size={22} /></span><div><strong>Lebih banyak jalan, lebih banyak cerita</strong><small>Coin membuka bab secara permanen.</small></div></div>
    <SectionHeading title="Tukar coin dengan reward" /><div className="px-reward-grid">{rewards.data?.length ? rewards.data.map(reward => <article key={reward.id}><h3><Coins size={17} />{reward.title}</h3><p>{reward.description}</p><CoinAction rpc="coin_redeem_reward" args={{ p_reward_id: reward.id }} label="Tukar reward" cost={reward.cost} balance={balance} /></article>) : <p className="px-muted">Belum ada reward tersedia. Coin kamu tetap bisa digunakan untuk membuka bab.</p>}</div>
    {!!claims.data?.length && <section><SectionHeading title="Reward kamu" />{claims.data.map(claim => <article className="px-reward-claim" key={claim.id}><Gift size={18} /><div><strong>{claim.title}</strong><small>{claim.cost} coin · {claim.status === "fulfilled" ? "Sudah diberikan" : "Menunggu admin"}</small>{claim.admin_note && <p>{claim.admin_note}</p>}</div></article>)}</section>}
    <MenuLink href="/explore" icon={<Sparkles size={20} />} title="Temukan cerita berikutnya" detail="Satu pilihan dapat membuka dunia baru" />
    <section id="coin-help" className="px-coin-help"><h2>Tentang coin</h2><p>Harga selalu ditampilkan sebelum konfirmasi. Membaca ulang dan reset bab gratis. Untuk tambahan coin, hubungi admin Pixinia.</p></section>
    <section><SectionHeading title="Riwayat transaksi" /><p className="px-footnote">30 transaksi terbaru</p>{ledger.data?.length ? ledger.data.map(item => <div key={item.id} className="coin-ledger-row"><div><strong>{names[item.kind] ?? item.kind}</strong><small>{new Date(item.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}{item.note ? ` · ${item.note}` : ""}</small></div><div><strong className={item.amount > 0 ? "px-success" : "px-gold"}>{item.amount > 0 ? "+" : ""}{item.amount}</strong><small>Saldo {item.balance_after}</small></div></div>) : <p className="px-muted">Belum ada transaksi.</p>}</section>
  </div></main>;
}
