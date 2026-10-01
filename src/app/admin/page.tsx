import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { readAnalytics } from "@/lib/story-engagement";

export default async function AdminPage() {
  const { db } = await requireAdmin();
  const data = await readAnalytics(db, 30);
  return <main className="shell page"><div className="page-intro"><p className="eyebrow">ADMIN PIXINIA</p>
    <h1 className="page-title">Dashboard platform</h1><p>Aktivitas membaca 30 hari terakhir dan pengelolaan platform.</p></div>
    <div className="admin-stat-grid">
      <div className="panel"><small>Total user</small><strong>{data.users?.total ?? 0}</strong><span>{data.users?.new ?? 0} baru dalam 30 hari</span></div>
      <div className="panel"><small>Cerita</small><strong>{data.stories}</strong><span>Komik dan novel</span></div>
      <div className="panel"><small>Kali dibaca</small><strong>{data.reads}</strong><span>Sesi membaca valid</span></div>
      <div className="panel"><small>Pembaca unik</small><strong>{data.readers}</strong><span>Akun berbeda di platform</span></div>
    </div><div className="admin-grid">
      <section className="panel"><h2>User menurut role</h2><p>Reader: {data.users?.reader ?? 0}</p><p>Creator: {data.users?.creator ?? 0}</p><p>Admin: {data.users?.admin ?? 0}</p><Link className="text-link" href="/admin/users">Kelola user →</Link></section>
      <section className="panel"><h2>Pengelolaan</h2><p><Link className="text-link" href="/admin/stories">Kelola cerita dan author →</Link></p><p><Link className="text-link" href="/admin/coins">Tambah coin ke user →</Link></p><p><Link className="text-link" href="/admin/analytics">Lihat analytics →</Link></p></section>
    </div></main>;
}
