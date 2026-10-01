import type { Metadata } from "next";
import Navbar from "@/components/ui/navbar";
import "./globals.css";
import "./reader-design.css";
import { Inter, Lora } from "next/font/google";
import ReaderPreferencesProvider from "@/components/reader/preferences";
import { getReaderDashboard } from "@/lib/reader-dashboard";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });

export const metadata: Metadata = { title: { default: "Pixinia — Cerita Interaktif", template: "%s | Pixinia" }, description: "Baca komik interaktif dan tentukan jalan ceritamu sendiri." };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = await getReaderDashboard();
  return <html lang="id" className={`${inter.variable} ${lora.variable}`}><body><ReaderPreferencesProvider accountKey={user?.id ?? "guest"}><a className="px-skip-link" href="#main-content">Lewati navigasi</a><Navbar /><div id="main-content">{children}</div><footer className="footer"><div className="shell">© {new Date().getFullYear()} Pixinia · Setiap pilihan berarti.</div></footer></ReaderPreferencesProvider></body></html>;
}
