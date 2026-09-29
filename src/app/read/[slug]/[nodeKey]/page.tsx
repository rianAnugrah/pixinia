import { notFound } from "next/navigation";
import Link from "next/link";
import { assetUrl, getNode, getNodeContent, getStory } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import ReaderActions from "@/components/reader-actions";

export default async function ReaderPage({ params }: { params: Promise<{ slug: string; nodeKey: string }> }) {
  const { slug, nodeKey } = await params;
  const story = await getStory(slug); if (!story) notFound();
  const node = await getNode(story.id, nodeKey); if (!node) notFound();
  const db = await createClient(); const { data: { user } } = await db.auth.getUser();
  const { assets, choices, panels } = await getNodeContent(node.id);
  const targetIds = choices.map(c => c.next_node_id);
  const { data: targetRows } = targetIds.length ? await db.from("story_nodes").select("id,node_key").in("id", targetIds) : { data: [] };
  const targets = Object.fromEntries((targetRows ?? []).map(n => [n.id, n.node_key]));
  const validChoices = choices.filter(c => targets[c.next_node_id]);
  return <main className="reader"><Link className="text-link" href={`/stories/${slug}`}>← {story.title}</Link><p className="eyebrow" style={{marginTop:35}}>{node.node_type === "ending" ? "AKHIR CERITA" : "BAB CERITA"}</p><h1>{node.title}</h1>{node.synopsis && <p className="reader-description">{node.synopsis}</p>}
    {panels.length ? panels.map(panel => { const asset = assets.find(a => a.id === panel.asset_id); const url = asset ? assetUrl(asset) : null; return <article className="comic-panel" key={panel.id}>{url && <img src={url} alt={panel.caption || `Panel ${panel.panel_order}`} />}<div className="comic-panel-body">{panel.speaker && <span className="speaker">{panel.speaker}</span>}{panel.dialogue && <p>{panel.dialogue}</p>}{panel.caption && <p className="muted">{panel.caption}</p>}</div></article>; }) : <div className="empty-state"><p>Panel belum tersedia untuk bab ini.</p></div>}
    <ReaderActions storyId={story.id} slug={slug} choices={validChoices} targets={targets} signedIn={!!user} />
  </main>;
}
