import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { visitedNodeIds } from "@/lib/reader-state";
export const getReaderDashboard = cache(async () => {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { user: null, name: "Pembaca", balance: 0, progress: [], discovered: 0, completed: 0, role: "reader" };
  const [profile, wallet, progress] = await Promise.all([
    db.from("profiles").select("display_name,role").eq("id", user.id).maybeSingle(),
    db.from("coin_wallets").select("balance").eq("user_id", user.id).maybeSingle(),
    db.from("user_story_progress").select("story_id,current_node_id,choices_history,completed_at,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }),
  ]);
  for (const result of [profile, wallet, progress]) if (result.error) throw result.error;
  const rows = progress.data ?? [];
  return { user, name: profile.data?.display_name || user.email?.split("@")[0] || "Pembaca", role: profile.data?.role || "reader", balance: Number(wallet.data?.balance ?? 0), progress: rows, discovered: new Set(rows.flatMap(row => visitedNodeIds(row.current_node_id, row.choices_history))).size, completed: rows.filter(row => row.completed_at).length };
});
