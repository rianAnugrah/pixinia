import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { readAccountProfile } from "@/lib/feature-schema";

export async function requireStaff() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login?next=/studio");
  const profile = await readAccountProfile(db, user.id);
  if (!profile?.is_active || (profile.role !== "creator" && profile.role !== "admin")) redirect("/");
  return { db, user, role: profile.role };
}

export async function requireAdmin() {
  const session = await requireStaff();
  if (session.role !== "admin") redirect("/studio");
  return session;
}

export async function requireStoryAccess(slug: string) {
  const session = await requireStaff();
  const { data: story, error } = await session.db.from("stories")
    .select("id,title,slug,status,default_format,genres,tags,author_id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!story || (session.role !== "admin" && story.author_id !== session.user.id)) notFound();
  return { ...session, story };
}
