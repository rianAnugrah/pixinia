import Link from "next/link";
import { BookOpen, ArrowUpRight } from "lucide-react";
import StudioNavigation from "@/components/studio/studio-navigation";
import { requireStaff } from "@/lib/admin";

export default async function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { role } = await requireStaff();
  return <div className="studio-root">
    <header className="studio-topbar">
      <Link href="/studio" className="studio-brand"><BookOpen size={24} aria-hidden /> Pixinia <span>Studio</span></Link>
      <StudioNavigation admin={role === "admin"} />
      <div className="studio-header-actions">{role === "admin" && <Link href="/admin" className="studio-admin-link">Admin</Link>}<Link href="/" className="studio-site-link">Lihat situs <ArrowUpRight size={15} aria-hidden /></Link></div>
    </header>
    {children}
  </div>;
}
