import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { ManageUser } from "@/components/admin/account-forms";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { db, user } = await requireAdmin();
  const params = await searchParams;
  const q = (params.q || "").replace(/[%_]/g, "").trim().slice(0, 100);
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page || "1", 10) || 1));
  let query = db.from("profiles").select("id,display_name,role,is_active,created_at", { count: "exact" }).order("created_at", { ascending: false }).order("id").range((page - 1) * 25, page * 25 - 1);
  if (q) query = query.ilike("display_name", `%${q}%`);
  const { data: users, error, count } = await query;
  if (error) throw error;
  const ids = (users ?? []).map(p => p.id);
  const { data: wallets, error: walletError } = ids.length ? await db.from("coin_wallets").select("user_id,balance").in("user_id", ids) : { data: [], error: null };
  if (walletError) throw walletError;
  return <main className="shell page"><div className="page-intro"><p className="eyebrow">ADMIN / USER</p><h1 className="page-title">Kelola user</h1><p>{count ?? 0} user ditemukan. Perubahan role dan status dicatat.</p></div>
    <form className="admin-filter"><label className="field"><span>Cari nama user</span><input name="q" defaultValue={q} maxLength={100} /></label><button className="primary-button">Cari</button></form>
    <div className="admin-grid">{users?.map(p => <section className="panel" key={p.id}><h2>{p.display_name || "User"}</h2><p className="admin-user-id">{p.id}</p><p>{Number(wallets?.find(w => w.user_id === p.id)?.balance ?? 0).toLocaleString("id-ID")} coin · {p.is_active ? "Aktif" : "Nonaktif"}</p>
      <ManageUser id={p.id} role={p.role} active={p.is_active} self={p.id === user.id} /><Link className="text-link" href={`/admin/coins?user=${p.id}`}>Tambah coin →</Link></section>)}</div>
    {!users?.length && <p>Tidak ada user yang sesuai.</p>}
    <nav className="admin-pagination" aria-label="Halaman user">{page > 1 && <Link href={`/admin/users?q=${encodeURIComponent(q)}&page=${page - 1}`}>← Sebelumnya</Link>}<span>Halaman {page}</span>{page * 25 < (count ?? 0) && <Link href={`/admin/users?q=${encodeURIComponent(q)}&page=${page + 1}`}>Berikutnya →</Link>}</nav>
  </main>;
}
