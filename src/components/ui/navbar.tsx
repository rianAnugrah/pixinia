import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, House, UserRound } from "lucide-react";

export default async function Navbar() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  const { data: wallet } = user ? await db.from("coin_wallets").select("balance").eq("user_id", user.id).maybeSingle() : { data: null };
  return <><header className="site-header"><nav className="shell nav" aria-label="Navigasi utama">
    <Link href="/" className="brand"><span className="brand-mark">✦</span> Pixinia</Link>
    <div className="nav-links"><Link href="/">Cerita</Link>{user && <Link href="/library">Pustaka saya</Link>}{user && <Link href="/admin">Studio</Link>}</div>
    <Link className="nav-action" href={user ? "/account" : "/login"}>{user ? `${wallet?.balance ?? 0} coin · Akun` : "Masuk"}</Link>
  </nav></header><nav className="reader-mobile-nav" aria-label="Navigasi mobile"><Link href="/"><House size={20} aria-hidden />Beranda</Link><Link href={user ? "/library" : "/login?next=/library"}><BookOpen size={20} aria-hidden />Pustaka</Link><Link href={user ? "/account" : "/login"}><UserRound size={20} aria-hidden />Akun</Link></nav></>;
}
