"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Compass, GitBranch, Library, UserRound } from "lucide-react";
const items = [{ href: "/", label: "Beranda", icon: House }, { href: "/explore", label: "Jelajahi", icon: Compass }, { href: "/journey", label: "Perjalanan", icon: GitBranch }, { href: "/library", label: "Pustaka", icon: Library }, { href: "/profile", label: "Profil", icon: UserRound }];
export default function ReaderNavigation() {
  const path = usePathname();
  if (path.startsWith("/admin") || path.startsWith("/studio") || path.startsWith("/read/") || path === "/welcome") return null;
  return <nav className="px-bottom-nav" aria-label="Navigasi pembaca">{items.map(({ href, label, icon: Icon }) => {
    const active = href === "/" ? path === "/" : path.startsWith(href) || (href === "/profile" && ["/account", "/settings", "/achievements"].includes(path)) || (href === "/journey" && path.endsWith("/map"));
    return <Link key={href} href={href} aria-current={active ? "page" : undefined}><span><Icon size={19} strokeWidth={1.4} aria-hidden /></span>{label}</Link>;
  })}</nav>;
}
