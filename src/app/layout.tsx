import type { Metadata } from "next";
import Navbar from "@/components/ui/navbar";
import "./globals.css";

export const metadata: Metadata = { title: { default: "Pixinia — Cerita Interaktif", template: "%s | Pixinia" }, description: "Baca komik interaktif dan tentukan jalan ceritamu sendiri." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><Navbar />{children}<footer className="footer"><div className="shell">© {new Date().getFullYear()} Pixinia · Setiap pilihan berarti.</div></footer></body></html>;
}
