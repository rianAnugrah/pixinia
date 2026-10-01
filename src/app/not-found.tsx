import Link from "next/link";
export default function NotFound() { return <main className="px-page"><div className="px-content"><section className="empty-state"><h1>Jalur ini belum ditemukan</h1><p>Cerita atau bab mungkin belum diterbitkan.</p><Link className="px-button" href="/explore">Jelajahi cerita lain</Link></section></div></main>; }
