import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export default async function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return <div className="admin-root">
    <header className="studio-topbar">
      <Link href="/admin" className="studio-brand">Pixinia <span>Admin</span></Link>
      <nav aria-label="Navigasi Admin" className="studio-top-links">
        <Link href="/admin">Dashboard</Link><Link href="/admin/users">User</Link>
        <Link href="/admin/stories">Cerita</Link><Link href="/admin/analytics">Analytics</Link><Link href="/admin/coins">Coin</Link>
      </nav>
      <Link href="/studio" className="studio-site-link">Studio saya ↗</Link>
    </header>
    {children}
  </div>;
}
