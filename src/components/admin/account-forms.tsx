"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { userRoles } from "@/lib/roles";

function useSave() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(rpc: string, args: Record<string, unknown>) {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await createClient().rpc(rpc, args);
      if (error) throw error;
      setMessage("Tersimpan."); router.refresh();
    } catch { setMessage("Belum tersimpan. Periksa izin dan data. Akun Admin sendiri tidak dapat dinonaktifkan atau diturunkan role-nya."); }
    finally { setBusy(false); }
  }
  return { busy, message, save };
}
export function ManageUser({ id, role, active, self }: { id: string; role: string; active: boolean; self: boolean }) {
  const { busy, message, save } = useSave();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    void save("admin_manage_user", { p_user_id: id, p_role: data.get("role"), p_active: data.get("active") === "on" });
  }
  return <form onSubmit={submit} className="coin-form" aria-busy={busy}><fieldset disabled={busy || self}>
    <label className="field"><span>Role</span><select name="role" defaultValue={role}>{userRoles.map(r => <option value={r} key={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}</select></label>
    <label><input type="checkbox" name="active" defaultChecked={active} /> Akun aktif</label>
    <button className="primary-button" type="submit">{busy ? "Menyimpan…" : "Simpan user"}</button>
  </fieldset>{self && <p className="muted">Ini akun Admin Anda.</p>}{message && <p role="status">{message}</p>}</form>;
}
export function AssignAuthor({ storyId, authorId, authors }: { storyId: string; authorId: string | null; authors: { id: string; display_name: string | null }[] }) {
  const { busy, message, save } = useSave();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    void save("admin_assign_author", { p_story_id: storyId, p_author_id: data.get("author") });
  }
  return <form onSubmit={submit} className="coin-form" aria-busy={busy}><fieldset disabled={busy || !authors.length}>
    <label className="field"><span>Author</span><select name="author" defaultValue={authorId ?? ""} required>
      <option value="" disabled>Pilih author</option>{authors.map(a => <option value={a.id} key={a.id}>{a.display_name || "Creator"} · {a.id.slice(0, 8)}</option>)}
    </select></label><button className="primary-button" type="submit">{busy ? "Menyimpan…" : "Tetapkan author"}</button>
  </fieldset>{message && <p role="status">{message}</p>}</form>;
}
