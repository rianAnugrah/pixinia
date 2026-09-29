"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
export default function SignOut() { const router = useRouter(); return <button className="choice" onClick={async () => { await createClient().auth.signOut(); router.push("/"); router.refresh(); }}>Keluar dari akun <span aria-hidden>→</span></button>; }
