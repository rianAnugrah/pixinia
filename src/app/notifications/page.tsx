import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReaderDashboard } from "@/lib/reader-dashboard";
import { getStories } from "@/lib/data";
import Notifications from "@/components/reader/notifications";
export const metadata = { title: "Notifikasi" };
export default async function Page() {
  const [d, stories] = await Promise.all([getReaderDashboard(), getStories()]);
  if (!d.user) redirect("/login?next=/notifications");
  const db = await createClient();
  const { data: transactions, error } = await db.from("coin_transactions").select("id,kind,amount,created_at").eq("user_id", d.user.id).order("created_at", { ascending: false }).limit(20);
  if (error) throw error;
  const items = [...d.progress.flatMap(row => { const story = stories.find(s => s.id === row.story_id); return story ? [{ id: `progress:${row.story_id}:${row.updated_at}`, category: "stories" as const, title: row.completed_at ? "Satu perjalanan selesai" : "Perjalananmu tersimpan", description: story.title, date: row.updated_at, href: `/stories/${story.slug}/map` }] : []; }), ...(transactions ?? []).map(row => ({ id: `coin:${row.id}`, category: "rewards" as const, title: row.amount > 0 ? "Coin masuk ke wallet" : "Transaksi coin berhasil", description: `${row.amount > 0 ? "+" : ""}${row.amount} coin · Lihat detail transaksi`, date: row.created_at, href: "/account" }))].sort((a, b) => b.date.localeCompare(a.date));
  return <Notifications items={items} accountKey={d.user.id} />;
}
