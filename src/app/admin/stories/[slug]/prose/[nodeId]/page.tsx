import { redirect } from "next/navigation";
export default async function LegacyStudioPage({ params }: { params: Promise<{ slug: string; nodeId: string; }> }) {
  const p = await params;
  redirect(`/studio/stories/${p.slug}/prose/${p.nodeId}`);
}
