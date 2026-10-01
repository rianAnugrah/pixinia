"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="px-page"><div className="px-content"><section className="empty-state"><h1>Halaman belum bisa dimuat</h1><p>Periksa koneksi lalu coba lagi. Progres membaca yang sudah tersimpan tetap aman.</p><button className="px-button" onClick={reset}>Coba lagi</button><Link className="px-secondary" href="/">Kembali ke beranda</Link></section></div></main>; }
