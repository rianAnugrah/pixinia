import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ReaderNavigation from "@/components/reader/navigation";

export default async function Navbar() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  const { data: wallet } = user ? await db.from("coin_wallets").select("balance").eq("user_id", user.id).maybeSingle() : { data: null };
  return <><header className="site-header"><nav className="shell nav" aria-label="Navigasi utama">
    <Link href="/" className="brand"><span className="brand-mark">✦</span> Pixinia</Link>
    <div className="nav-links"><Link href="/">Cerita</Link>{user && <Link href="/library">Pustaka saya</Link>}{user && <Link href="/admin">Studio</Link>}</div>
    <Link className="nav-action" href={user ? "/account" : "/login"}>{user ? `${wallet?.balance ?? 0} coin · Akun` : "Masuk"}</Link>
  </nav></header><ReaderNavigation /></>;
}
