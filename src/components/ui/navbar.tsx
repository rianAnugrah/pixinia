import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Navbar() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  return <header className="site-header"><nav className="shell nav" aria-label="Navigasi utama">
    <Link href="/" className="brand"><span className="brand-mark">✦</span> Pixinia</Link>
    <div className="nav-links"><Link href="/">Cerita</Link>{user && <Link href="/library">Pustaka saya</Link>}{user && <Link href="/admin">Studio</Link>}</div>
    <Link className="nav-action" href={user ? "/account" : "/login"}>{user ? "Akun" : "Masuk"}</Link>
  </nav></header>;
}
