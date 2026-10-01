import { getReaderDashboard } from "@/lib/reader-dashboard";
import Achievements from "@/components/reader/achievements";
export const metadata = { title: "Pencapaian" };
export default async function Page() { const d = await getReaderDashboard(); return <Achievements discovered={d.discovered} completed={d.completed} started={d.progress.length} />; }
