"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Check, LockKeyhole, Trophy, BookOpen } from "lucide-react";
import { layoutReaderMap, type ReaderMapNode, type ReaderMapEdge } from "@/lib/reader-map";

export default function BranchMap({ slug, nodes, edges, onNavigate }: { slug: string; nodes: ReaderMapNode[]; edges: ReaderMapEdge[]; onNavigate?: () => void }) {
  const graph = layoutReaderMap(nodes, edges);
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentId = nodes.find(node => node.current)?.id;
  useEffect(() => { const scroller = scrollRef.current; const current = scroller?.querySelector<HTMLElement>('[aria-current="page"]'); if (scroller && current) scroller.scrollTo({ top: Math.max(0, current.offsetTop - scroller.clientHeight / 3), left: Math.max(0, current.offsetLeft - scroller.clientWidth / 2 + 66) }); }, [currentId]);
  return <><div className="reader-map-legend"><span><Check size={14} /> Terbuka</span><span><LockKeyhole size={14} /> Terkunci</span><span><Trophy size={14} /> Akhir</span></div><div ref={scrollRef} className="reader-map-scroll" tabIndex={0} role="region" aria-label="Peta cabang, geser untuk menjelajah"><div className="reader-map-canvas" style={{ width: graph.width, height: graph.height }}>
    <svg width={graph.width} height={graph.height} aria-hidden className="reader-map-lines">{graph.edges.map(edge => { const from = byId.get(edge.node_id)!, to = byId.get(edge.next_node_id)!; const x1 = from.x + 66, x2 = to.x + 66, y1 = from.y + 112, y2 = to.y; return <path key={`${from.id}-${to.id}`} className={from.visited && to.visited ? "is-travelled" : ""} d={`M${x1},${y1} C${x1},${y1 + 22} ${x2},${y2 - 22} ${x2},${y2}`} />; })}</svg>
    {graph.nodes.map(node => <Link key={node.id} href={`/read/${slug}/${node.nodeKey}`} onClick={onNavigate} className={`reader-map-node ${node.owned ? "is-owned" : "is-locked"} ${node.current ? "is-current" : ""}`} style={{ left: node.x, top: node.y }} aria-current={node.current ? "page" : undefined}><span className="reader-map-node-top">{node.ending ? <Trophy size={17} /> : <BookOpen size={17} />}{node.owned ? <Check size={17} /> : <LockKeyhole size={17} />}</span><strong>{node.title}</strong><small>{node.current ? node.owned ? "Sedang dibaca" : `${node.cost} coin · Dipilih` : node.active ? "Lanjutkan perjalanan" : node.owned ? node.visited ? "Baca lagi · Gratis" : "Terbuka" : `${node.cost} coin`}</small></Link>)}
  </div></div><p className="reader-map-help">Ketuk bab untuk membaca atau melihat biaya unlock. Membaca ulang gratis.</p></>;
}
