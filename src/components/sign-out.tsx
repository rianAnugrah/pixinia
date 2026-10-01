"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import BusyStatus from "@/components/busy-status";

export default function SignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.push("/"); router.refresh();
    } catch { setError("Gagal keluar. Coba lagi."); setBusy(false); }
  }
  return <><button className="choice" disabled={busy} aria-busy={busy} onClick={signOut}>{busy ? <BusyStatus>Keluar dari akun…</BusyStatus> : "Keluar dari akun"}<span aria-hidden>→</span></button>{error && <p role="alert" className="form-error">{error}</p>}</>;
}
