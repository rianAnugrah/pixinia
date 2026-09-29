"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type Mode = "login" | "signup" | "forgot" | "reset";
export default function AuthForm({ mode, next = "/library" }: { mode: Mode; next?: string }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const router = useRouter();
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage(""); const db = createClient();
    if (mode === "login") {
      const result = await db.auth.signInWithPassword({ email, password });
      if (result.error) setError(result.error.message); else { router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/library"); router.refresh(); }
    } else if (mode === "signup") {
      const result = await db.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (result.error) setError(result.error.message); else setMessage("Periksa email untuk mengonfirmasi akun.");
    } else if (mode === "forgot") {
      const result = await db.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
      if (result.error) setError(result.error.message); else setMessage("Jika alamat terdaftar, tautan pemulihan telah dikirim.");
    } else {
      const result = await db.auth.updateUser({ password });
      if (result.error) setError(result.error.message); else { setMessage("Kata sandi diperbarui."); router.push("/account"); }
    }
    setBusy(false);
  }
  const titles = { login: "Masuk ke Pixinia", signup: "Buat akun", forgot: "Pulihkan akun", reset: "Kata sandi baru" };
  return <main className="shell"><form className="form-card" onSubmit={submit}><p className="eyebrow">AKUN PIXINIA</p><h1>{titles[mode]}</h1>
    {mode !== "reset" && <label className="field"><span>Email</span><input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>}
    {mode !== "forgot" && <label className="field"><span>Kata sandi</span><input type="password" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} required value={password} onChange={e => setPassword(e.target.value)} /></label>}
    {error && <p role="alert" className="form-error">{error}</p>}{message && <p role="status" className="form-success">{message}</p>}
    <button className="primary-button" disabled={busy}>{busy ? "Memproses…" : mode === "login" ? "Masuk" : mode === "signup" ? "Daftar" : mode === "forgot" ? "Kirim tautan" : "Simpan kata sandi"}</button>
    <p className="muted">{mode === "login" ? <>Belum punya akun? <Link className="text-link" href="/signup">Daftar</Link> · <Link className="text-link" href="/forgot-password">Lupa kata sandi</Link></> : <Link className="text-link" href="/login">Kembali ke login</Link>}</p>
  </form></main>;
}
