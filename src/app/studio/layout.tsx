import Link from "next/link";
import { BookOpen, LayoutDashboard } from "lucide-react";
import { requireStaff } from "@/lib/admin";

export default async function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireStaff();
  return <div className="studio-root">
    <header className="studio-topbar">
      <Link href="/studio" className="studio-brand"><BookOpen size={24} aria-hidden /> Pixinia <span>Studio</span></Link>
      <nav aria-label="Navigasi Studio" className="studio-top-links">
        <Link href="/studio/analytics"><LayoutDashboard size={17} aria-hidden /> Analytics</Link>
        <Link href="/studio" className="is-active"><BookOpen size={17} aria-hidden /> Komik</Link>
      </nav>
      <Link href="/" className="studio-site-link">Lihat situs ↗</Link>
    </header>
    {children}
  </div>;
}
