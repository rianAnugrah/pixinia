import { redirect } from "next/navigation";
export default async function LegacyStudioPage({ params }: { params: Promise<{ slug: string;  }> }) {
  const p = await params;
  redirect(`/studio/stories/${p.slug}`);
}
