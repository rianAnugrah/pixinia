"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCheck, BookOpen, Gift, Bell } from "lucide-react";
import { PageHeading } from "./design-ui";
import { useReaderPreferences } from "./preferences";
type Item = { id: string; category: "stories" | "rewards"; title: string; description: string; date: string; href: string };
export default function Notifications({ items, accountKey }: { items: Item[]; accountKey: string }) {
  const [filter, setFilter] = useState("all"); const [read, setRead] = useState<string[]>([]); const [error, setError] = useState("");
  const key = `pixinia:notifications:v1:${accountKey}`;
  const { preferences } = useReaderPreferences();
  useEffect(() => { try { const ids: unknown = JSON.parse(localStorage.getItem(key) || "[]"); if (Array.isArray(ids)) setRead(ids.filter((id): id is string => typeof id === "string")); } catch { /* Read state is optional. */ } }, [key]);
  function mark(ids: string[]) { const next = [...new Set([...read, ...ids])].slice(-200); setRead(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch { setError("Status dibaca hanya disimpan selama halaman ini terbuka."); } }
  const visible = items.filter(item => (filter === "all" || item.category === filter) && (preferences.notifications || item.category !== "stories"));
  return <main className="px-page"><PageHeading title="Notifikasi" back="/"><button className="px-icon-button" onClick={() => mark(items.map(item => item.id))} aria-label="Tandai semua dibaca"><CheckCheck size={20} /></button></PageHeading><div className="px-content"><div className="px-chips">{[["all", "Semua"], ["stories", "Cerita"], ["rewards", "Coin"]].map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div><p className="px-kicker">AKTIVITAS TERBARU</p><div className="px-notifications">{visible.map(item => <Link key={item.id} href={item.href} onClick={() => mark([item.id])} className={read.includes(item.id) ? "" : "is-unread"}><span className="px-menu-icon">{item.category === "stories" ? <BookOpen size={18} /> : <Gift size={18} />}</span><div><h2>{item.title}</h2><p>{item.description}</p><time dateTime={item.date}>{new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" })}</time></div>{!read.includes(item.id) && <span className="px-unread-dot" aria-label="Belum dibaca" />}</Link>)}</div>{!visible.length && <div className="empty-state"><Bell size={28} /><h2>Belum ada kabar baru</h2><p>Aktivitas membaca dan transaksi coin akan muncul di sini.</p></div>}{!preferences.notifications && <p className="px-footnote">Notifikasi cerita dimatikan. <Link href="/settings">Ubah pengaturan</Link></p>}{error && <p role="status">{error}</p>}</div></main>;
}
