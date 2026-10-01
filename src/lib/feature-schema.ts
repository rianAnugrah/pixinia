import type { SupabaseClient } from "@supabase/supabase-js";

type DatabaseError = { code?: string; message?: string } | null;

export function missingFeatureColumn(error: DatabaseError, table: string, column: string) {
  return !!error && ["42703", "PGRST204"].includes(error.code ?? "")
    && (error.message ?? "").includes(table) && (error.message ?? "").includes(column);
}

export type AccountProfile = { display_name: string | null; role: string; is_active: boolean };

// During a staged release, reader pages still work against the preceding schema.
// Missing activation support must never enable the new privileged interfaces.
export async function readAccountProfile(db: SupabaseClient, userId: string): Promise<AccountProfile | null> {
  const profile = await db.from("profiles").select("display_name,role,is_active").eq("id", userId).maybeSingle();
  if (!profile.error) return profile.data as AccountProfile | null;
  if (!missingFeatureColumn(profile.error, "profiles", "is_active")) throw profile.error;
  const legacy = await db.from("profiles").select("display_name,role").eq("id", userId).maybeSingle();
  if (legacy.error) throw legacy.error;
  return legacy.data ? { ...legacy.data, is_active: false } : null;
}
