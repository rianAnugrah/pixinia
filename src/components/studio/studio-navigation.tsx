"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesCombined } from "lucide-react";

export default function StudioNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Navigasi Studio" className="studio-top-links">
    {[{ href: "/studio", label: "Cerita saya", icon: BookOpen }, { href: "/studio/analytics", label: "Analytics", icon: ChartNoAxesCombined }].map(item => {
      const active = item.href === "/studio" ? !pathname.startsWith("/studio/analytics") : pathname.startsWith(item.href);
      return <Link key={item.href} href={item.href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}><item.icon size={16} aria-hidden /><span>{item.label}</span></Link>;
    })}
  </nav>;
}
