import Link from "next/link";
import { Coins, Settings, Award, History, Compass, BookOpen, GitBranch, Crown, LogIn, PenTool } from "lucide-react";
import { getReaderDashboard } from "@/lib/reader-dashboard";
import { PageHeading, MenuLink, SectionHeading, ProgressBar } from "@/components/reader/design-ui";
import SignOut from "@/components/sign-out";
export const metadata = { title: "Profil pembaca" };
export default async function Profile() {
  const d = await getReaderDashboard();
  const level = Math.floor(d.discovered / 10) + 1;
  return <main className="px-page"><PageHeading title="Profil"><Link href="/settings" className="px-icon-button" aria-label="Pengaturan"><Settings size={20} /></Link></PageHeading><div className="px-content"><section className="px-profile-identity"><span className="px-avatar px-avatar-large">{d.name.slice(0, 1).toUpperCase()}</span><h2>{d.name}</h2><p>LEVEL {level} · PENJELAJAH CERITA</p><Link className="px-coin-pill" href="/account"><Coins size={17} />{d.balance.toLocaleString("id-ID")} Coin</Link></section>
    <div className="px-stats"><div><strong>{d.completed}</strong><small>Cerita selesai</small></div><div><strong>{d.discovered}</strong><small>Bab dijelajahi</small></div><div><strong>{d.progress.length}</strong><small>Cerita dimulai</small></div></div>
    <SectionHeading title="Lencana perjalanan" href="/achievements" /><div className="px-badge-row">{[{ icon: Compass, name: "Perintis", earned: d.progress.length > 0 }, { icon: GitBranch, name: "Penjelajah", earned: d.discovered >= 10 }, { icon: Crown, name: "Penamat", earned: d.completed > 0 }, { icon: BookOpen, name: "Kutu buku", earned: d.discovered >= 100 }].map(({ icon: Icon, name, earned }) => <Link href="/achievements" key={name} className={earned ? "is-earned" : ""}><span><Icon size={24} strokeWidth={1.2} /></span><small>{name}</small></Link>)}</div>
    <section className="px-level"><div><strong>Progres level {level}</strong><span>{d.discovered % 10} / 10 bab</span></div><ProgressBar value={d.discovered % 10 * 10} label="Progres level" /><small>Jelajahi {10 - d.discovered % 10} bab lagi di perjalanan aktifmu.</small></section>
    <MenuLink href="/achievements" icon={<Award size={18} />} title="Pencapaian" /><MenuLink href="/library" icon={<History size={18} />} title="Riwayat membaca" /><MenuLink href="/account" icon={<Coins size={18} />} title="Wallet & reward" /><MenuLink href="/settings" icon={<Settings size={18} />} title="Pengaturan baca" />{["admin", "editor"].includes(d.role) && <MenuLink href="/admin" icon={<PenTool size={18} />} title="Studio penulis" />}
    {d.user ? <div className="px-signout"><SignOut /></div> : <Link className="px-button" href="/login?next=/profile"><LogIn size={18} />Masuk untuk menyimpan perjalanan</Link>}
    <p className="px-footnote">Statistik dihitung dari perjalanan aktif. Reset bab dapat mengubah progres.</p>
  </div></main>;
}
