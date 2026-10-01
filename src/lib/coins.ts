import { createClient } from "@/lib/supabase/server";
import { missingFeatureFunction } from "@/lib/story-engagement";

export async function getCoinAccess(userId: string | undefined, storyId: string) {
  const db = await createClient();
  if (!userId) return { balance: 0, storyOwned: false, owned: new Set<string>(), staff: false };
  const [wallet, nodes, story, profile] = await Promise.all([
    db.from("coin_wallets").select("balance").eq("user_id", userId).single(),
    db.from("coin_node_unlocks").select("node_id").eq("user_id", userId),
    db.from("coin_story_unlocks").select("story_id").eq("user_id", userId).eq("story_id", storyId).maybeSingle(),
    db.rpc("studio_can_manage_story", { p_story_id: storyId }),
  ]);
  for (const result of [wallet, nodes, story]) if (result.error) throw result.error;
  if (profile.error && !missingFeatureFunction(profile.error, "studio_can_manage_story")) throw profile.error;
  return { balance: Number(wallet.data?.balance ?? 0), storyOwned: !!story.data, owned: new Set<string>((nodes.data ?? []).map(n => n.node_id)), staff: profile.data === true };
}

export function coinError(cause: unknown): string {
  const message = typeof cause === "object" && cause !== null && "message" in cause ? String(cause.message) : "";
  if (message.includes("Coin tidak cukup")) return "Coin tidak cukup. Hubungi admin untuk menambah saldo.";
  return "Transaksi belum berhasil. Periksa koneksi dan coba lagi.";
}
