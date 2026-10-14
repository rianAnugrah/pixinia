import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ReaderNavigation from "@/components/reader/navigation";
import { canUseStudio } from "@/lib/roles";
import { readAccountProfile } from "@/lib/feature-schema";
import { BookOpen, Coins, Search } from "lucide-react";

export default async function Navbar() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  const { data: wallet } = user ? await db.from("coin_wallets").select("balance").eq("user_id", user.id).maybeSingle() : { data: null };
  const profile = user ? await readAccountProfile(db, user.id) : null;
  return <><header className="site-header"><nav className="shell nav" aria-label="Navigasi utama">
    <Link href="/" className="brand"><span className="brand-mark"><BookOpen size={23} aria-hidden /></span>Pixinia<span className="brand-period">.</span></Link>
    <div className="nav-links"><Link href="/">Beranda</Link><Link href="/explore">Jelajahi</Link>{user && <Link href="/library">Pustaka saya</Link>}{canUseStudio(profile?.role, profile?.is_active ?? false) && <Link href="/studio">Studio kreator</Link>}{profile?.role === "admin" && profile.is_active && <Link href="/admin">Admin</Link>}</div>
    <div className="nav-account"><Link href="/explore" className="nav-search" aria-label="Cari cerita"><Search size={20} /></Link><Link className="nav-action" href={user ? "/account" : "/login"}>{user ? <><Coins size={16} aria-hidden />{(wallet?.balance ?? 0).toLocaleString("id-ID")} coin</> : "Masuk"}</Link></div>
  </nav></header><ReaderNavigation /></>;
}
