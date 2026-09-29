import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOut from "@/components/sign-out";
export default async function Page() { const db = await createClient(); const { data: { user } } = await db.auth.getUser(); if (!user) redirect("/login?next=/account"); return <main className="shell page"><div className="page-intro"><p className="eyebrow">AKUN</p><h1 className="page-title">Akun saya</h1><p>{user.email}</p></div><div style={{maxWidth:460}}><SignOut /></div></main>; }
