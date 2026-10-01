"use client";

import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dagre from "@dagrejs/dagre";
import { Background, Controls, Handle, MarkerType, MiniMap, Position, ReactFlow, useEdgesState, useNodesState, type Connection, type NodeProps } from "@xyflow/react";
import { ArrowLeft, BookOpen, Check, ChevronRight, CirclePlus, Expand, Image as ImageIcon, LayoutDashboard, List, Maximize2, Plus, Redo2, RotateCcw, Save, Search, Sparkles, Trash2, Waypoints } from "lucide-react";
import BusyStatus from "@/components/busy-status";
import NodePanelEditor from "@/components/studio/node-panel-editor";
import { parseGraph, validatePublication, type StudioChoice, type StudioGraph, type StudioNode } from "@/lib/studio/graph";

type Props = {
  story: { id: string; title: string; slug: string; status: string; default_format: string };
  initialGraph: StudioGraph; initialVersion: number; publicationVersion: number; admin: boolean;
  thumbnails: Record<string, string>; panelCounts: Record<string, number>;
  publishedNodeIds: string[]; publishedMediaIds: string[];
};
type CardData = { key: string; title: string; thumbnail: string; count: number; start: boolean; ending: boolean; published: boolean; novel: boolean };
type View = "graph" | "overview" | "episodes" | "scenes" | "media" | "ai" | "publish";

function GraphCard({ data, selected }: NodeProps) {
  const card = data as CardData;
  return <div className={`studio-graph-card ${selected ? "selected" : ""} ${card.ending ? "ending" : ""}`}>
    <Handle type="target" position={Position.Top} />
    <div className="studio-graph-card-head"><b>{card.key}</b><span>{card.start ? "Mulai" : card.ending ? "Akhir" : card.published ? "Terbit" : "Draft"}</span></div>
    <div className="studio-graph-image">{card.thumbnail ? <Image src={card.thumbnail} alt="" fill unoptimized sizes="220px" /> : <ImageIcon size={30} aria-hidden />}</div>
    <strong>{card.title}</strong><small>{card.novel ? "Naskah" : `${card.count} panel`}</small>
    <Handle type="source" position={Position.Bottom} />
  </div>;
}
const nodeTypes = { card: GraphCard };
const colors: Record<StudioChoice["color"], string> = { blue: "#52a5ff", pink: "#f47791", purple: "#a471f8" };

function layoutGraph(graph: StudioGraph): StudioGraph {
  const layout = new dagre.graphlib.Graph();
  layout.setGraph({ rankdir: "TB", nodesep: 58, ranksep: 104, marginx: 40, marginy: 40 });
  layout.setDefaultEdgeLabel(() => ({}));
  graph.nodes.forEach(node => layout.setNode(node.id, { width: 230, height: 148 }));
  graph.choices.forEach(choice => layout.setEdge(choice.source, choice.target));
  dagre.layout(layout);
  return { ...graph, nodes: graph.nodes.map(node => {
    const position = layout.node(node.id);
    return { ...node, x: node.x ?? (position?.x ?? 0) - 115, y: node.y ?? (position?.y ?? 0) - 74 };
  }) };
}

export default function StoryWorkspace({ story, initialGraph, initialVersion, publicationVersion, admin, thumbnails, panelCounts, publishedNodeIds, publishedMediaIds }: Props) {
  const router = useRouter();
  const [graph, setGraph] = useState<StudioGraph>(() => layoutGraph(parseGraph(initialGraph)));
  const graphRef = useRef(graph);
  const [view, setView] = useState<View>("graph");
  const [episode, setEpisode] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(() => graph.nodes.find(node => node.start)?.id ?? graph.nodes[0]?.id ?? null);
  const [inspectorTab, setInspectorTab] = useState<"detail" | "panels" | "preview">("detail");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Tersimpan");
  const [errors, setErrors] = useState<string[]>([]);
  const [pendingChoice, setPendingChoice] = useState<{ source: string; target: string } | null>(null);
  const [choiceLabel, setChoiceLabel] = useState("");
  const [mobileInspector, setMobileInspector] = useState(false);
  const [publishedVersion, setPublishedVersion] = useState(publicationVersion);
  const [publishing, setPublishing] = useState(false);
  const versionRef = useRef(initialVersion);
  const revisionRef = useRef(0);
  const savedRef = useRef(0);
  const savingRef = useRef(false);
  const stoppedRef = useRef(false);
  const historyRef = useRef<StudioGraph[]>([]);
  const redoRef = useRef<StudioGraph[]>([]);
  const pendingSaveRef = useRef<{ revision: number; id: string } | null>(null);
  const pendingPublishRef = useRef<{ version: number; id: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (window.innerWidth < 720) setView("scenes"); }, []);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("node");
    if (id && graphRef.current.nodes.some(node => node.id === id)) { setSelected(id); setMobileInspector(true); }
  }, []);

  function selectNode(id: string) {
    setSelected(id); setMobileInspector(true); setInspectorTab("detail");
    const url = new URL(window.location.href); url.searchParams.set("node", id);
    window.history.replaceState(window.history.state, "", url);
  }

  const change = useCallback((next: StudioGraph | ((current: StudioGraph) => StudioGraph)) => {
    const previous = graphRef.current;
    const updated = typeof next === "function" ? next(previous) : next;
    if (updated === previous) return;
    historyRef.current.push(previous);
    if (historyRef.current.length > 30) historyRef.current.shift();
    redoRef.current = [];
    graphRef.current = updated; setGraph(updated); revisionRef.current += 1;
    setStatus("Belum tersimpan"); setErrors([]);
  }, []);

  const saveNow = useCallback(async (): Promise<boolean> => {
    if (savingRef.current || stoppedRef.current) return false;
    if (revisionRef.current === savedRef.current) return true;
    savingRef.current = true; setStatus("Menyimpan…");
    const revision = revisionRef.current;
    if (pendingSaveRef.current?.revision !== revision) pendingSaveRef.current = { revision, id: crypto.randomUUID() };
    const mutationId = pendingSaveRef.current.id;
    let saved = false;
    try {
      const response = await fetch("/api/studio/graph", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", storyId: story.id, version: versionRef.current, graph: graphRef.current, mutationId }) });
      const raw = await response.text();
      let result: { error?: string; version?: number };
      try { result = JSON.parse(raw); } catch { throw new Error("Server tidak merespons. Periksa draft sebelum mencoba lagi."); }
      if (!response.ok) {
        if (response.status === 409) stoppedRef.current = true;
        throw new Error(result.error || "Gagal menyimpan graph.");
      }
      if (typeof result.version !== "number") throw new Error("Respons penyimpanan tidak lengkap.");
      versionRef.current = result.version; savedRef.current = revision;
      if (pendingSaveRef.current?.id === mutationId) pendingSaveRef.current = null;
      saved = true;
      setStatus(revision === revisionRef.current ? "Tersimpan" : "Belum tersimpan");
      return true;
    } catch (error) { setStatus("Gagal menyimpan"); setErrors([error instanceof Error ? error.message : "Koneksi gagal."]); return false; }
    finally {
      savingRef.current = false;
      if (saved && revisionRef.current !== savedRef.current) window.setTimeout(() => { void saveNow(); }, 800);
    }
  }, [story.id]);

  useEffect(() => {
    if (revisionRef.current === savedRef.current || stoppedRef.current) return;
    const timer = window.setTimeout(() => { if (!savingRef.current) void saveNow(); }, 1500);
    return () => window.clearTimeout(timer);
  }, [graph, saveNow]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (revisionRef.current !== savedRef.current) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const current = graph.nodes.find(node => node.id === selected) ?? null;
  const visibleNodes = useMemo(() => graph.nodes.filter(node => (episode === "all" || node.episodeId === episode) && (!search || `${node.title} ${node.key}`.toLowerCase().includes(search.toLowerCase()))), [graph.nodes, episode, search]);
  const visibleIds = useMemo(() => new Set(visibleNodes.map(node => node.id)), [visibleNodes]);
  const flowNodes = useMemo(() => visibleNodes.map(node => ({ id: node.id, type: "card", position: { x: node.x ?? 0, y: node.y ?? 0 }, data: { key: node.key, title: node.title, thumbnail: thumbnails[node.id] ?? "", count: panelCounts[node.id] ?? 0, start: node.start, ending: node.type === "ending", published: publishedNodeIds.includes(node.id), novel: story.default_format === "web_novel" } satisfies CardData })), [visibleNodes, thumbnails, panelCounts, publishedNodeIds, story.default_format]);
  const flowEdges = useMemo(() => graph.choices.filter(choice => visibleIds.has(choice.source) && visibleIds.has(choice.target)).map(choice => ({ id: choice.id, source: choice.source, target: choice.target, type: "smoothstep", label: choice.label, markerEnd: { type: MarkerType.ArrowClosed, color: colors[choice.color] }, style: { stroke: colors[choice.color], strokeWidth: 2 }, labelStyle: { fill: "#f3f6fa", fontSize: 12 }, labelBgStyle: { fill: "#172536", stroke: colors[choice.color], strokeWidth: 1 }, labelBgPadding: [12, 7] as [number, number], labelBgBorderRadius: 12 })), [graph.choices, visibleIds]);
  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);
  useEffect(() => { setNodes(flowNodes); }, [flowNodes, setNodes]);
  useEffect(() => { setEdges(flowEdges); }, [flowEdges, setEdges]);

  function editNode(id: string, patch: Partial<StudioNode>) { change(g => ({ ...g, nodes: g.nodes.map(node => node.id === id ? { ...node, ...patch } : node) })); }
  function editChoice(id: string, patch: Partial<StudioChoice>) { change(g => ({ ...g, choices: g.choices.map(choice => choice.id === id ? { ...choice, ...patch } : choice) })); }
  function moveChoice(id: string, direction: -1 | 1) {
    change(g => {
      const choice = g.choices.find(item => item.id === id);
      if (!choice) return g;
      const ordered = g.choices.filter(item => item.source === choice.source).sort((a,b) => a.sortOrder-b.sortOrder);
      const index = ordered.findIndex(item => item.id === id);
      const other = ordered[index + direction];
      if (!other) return g;
      return { ...g, choices: g.choices.map(item => item.id === id ? { ...item, sortOrder: other.sortOrder } : item.id === other.id ? { ...item, sortOrder: choice.sortOrder } : item) };
    });
  }
  function addNode() {
    const id = crypto.randomUUID();
    const used = new Set(graph.nodes.map(node => node.key)); let index = graph.nodes.length + 1;
    while (used.has(`node-${index}`)) index++;
    const first = graph.episodes[0]?.id;
    change(g => ({ ...g, nodes: [...g.nodes, { id, key: `node-${index}`, title: "Adegan baru", synopsis: "", type: "episode", start: g.nodes.length === 0, episodeId: episode === "all" ? first : episode, x: 80 + (g.nodes.length % 3) * 270, y: 80 + Math.floor(g.nodes.length / 3) * 240, tags: [], notes: "" }] }));
    selectNode(id); setInspectorTab("detail"); setView("graph");
  }
  function addEpisode() {
    const id = crypto.randomUUID();
    change(g => ({ ...g, episodes: [...g.episodes, { id, title: `Episode ${g.episodes.length + 1}`, sortOrder: g.episodes.length + 1 }] }));
    setEpisode(id); setView("episodes");
  }
  function removeNode(id: string) {
    if (publishedNodeIds.includes(id)) { setErrors(["Node terbit tidak dapat dihapus karena progres pembaca harus tetap valid."]); return; }
    if (!window.confirm("Hapus node draft dan semua pilihan yang terhubung?")) return;
    change(g => ({ ...g, nodes: g.nodes.filter(node => node.id !== id), choices: g.choices.filter(choice => choice.source !== id && choice.target !== id) }));
    setSelected(null);
  }
  function undo() {
    const previous = historyRef.current.pop(); if (!previous) return;
    redoRef.current.push(graphRef.current); graphRef.current = previous; setGraph(previous); revisionRef.current++; setStatus("Belum tersimpan");
  }
  function redo() {
    const next = redoRef.current.pop(); if (!next) return;
    historyRef.current.push(graphRef.current); graphRef.current = next; setGraph(next); revisionRef.current++; setStatus("Belum tersimpan");
  }
  async function publish() {
    setErrors([]);
    if (revisionRef.current !== savedRef.current && !(await saveNow())) return;
    const issues = validatePublication(graphRef.current);
    const withoutMedia = graphRef.current.nodes.filter(node => !publishedMediaIds.includes(node.id));
    if (withoutMedia.length) issues.push(`${withoutMedia.length} node belum memiliki ${story.default_format === "web_novel" ? "naskah" : "panel"} terbit. Terbitkan isi tiap node dahulu.`);
    if (issues.length) { setErrors(issues); return; }
    if (!window.confirm("Terbitkan struktur cerita ini untuk pembaca? Panel gambar memiliki publikasi terpisah.")) return;
    setPublishing(true); setStatus("Menerbitkan…");
    if (pendingPublishRef.current?.version !== versionRef.current) pendingPublishRef.current = { version: versionRef.current, id: crypto.randomUUID() };
    const mutationId = pendingPublishRef.current.id;
    try {
      const response = await fetch("/api/studio/graph", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "publish", storyId: story.id, version: versionRef.current, mutationId }) });
      const raw = await response.text();
      let result: { error?: string; errors?: string[]; version?: number; publicationVersion?: number };
      try { result = JSON.parse(raw); } catch { throw new Error("Server tidak merespons. Periksa status publikasi sebelum mencoba lagi."); }
      if (!response.ok) throw new Error([result.error, ...(result.errors ?? [])].filter(Boolean).join(" "));
      if (typeof result.version !== "number" || typeof result.publicationVersion !== "number") throw new Error("Respons publikasi tidak lengkap.");
      versionRef.current = result.version; setPublishedVersion(result.publicationVersion);
      if (pendingPublishRef.current?.id === mutationId) pendingPublishRef.current = null;
      setStatus("Struktur terbit"); router.refresh();
    } catch (error) { setStatus("Publikasi gagal"); setErrors([error instanceof Error ? error.message : "Publikasi gagal."]); }
    finally { setPublishing(false); }
  }
  async function openPanels(id: string) {
    if (revisionRef.current !== savedRef.current && !(await saveNow())) return;
    if (story.default_format === "web_novel") { router.push(`/admin/stories/${story.slug}/prose/${id}`); return; }
    selectNode(id); setInspectorTab("panels"); setView("graph");
  }
  async function openPreview(id: string) {
    if (revisionRef.current !== savedRef.current && !(await saveNow())) return;
    router.push(`/admin/stories/${story.slug}/preview/${id}`);
  }

  const nav: { id: View; title: string; icon: typeof BookOpen }[] = [
    { id: "overview", title: "Ringkasan", icon: LayoutDashboard }, { id: "episodes", title: "Episode", icon: BookOpen },
    { id: "graph", title: "Story Graph", icon: Waypoints }, { id: "scenes", title: "Adegan", icon: List },
    { id: "media", title: "Media", icon: ImageIcon }, { id: "ai", title: "Generasi AI", icon: Sparkles },
    { id: "publish", title: "Publikasi", icon: Check },
  ];

  return <div className={`studio-workspace ${inspectorTab === "detail" ? "" : "studio-workspace-wide"}`}>
    <aside className="studio-sidebar">
      <Link href="/admin" className="studio-back"><ArrowLeft size={16} aria-hidden /> Kembali ke Komik</Link>
      <div className="studio-story-identity"><div className="studio-story-cover"><BookOpen size={32} aria-hidden /></div><div><strong>{story.title}</strong><span className="studio-badge">{story.status === "published" ? "● Terbit" : "● Draft"}</span></div></div>
      <nav className="studio-side-nav" aria-label="Bagian cerita">{nav.map(item => <button type="button" key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><item.icon size={18} aria-hidden />{item.title}</button>)}</nav>
      <div className="studio-sidebar-section"><div><strong>Episode</strong><button type="button" onClick={addEpisode} aria-label="Tambah episode"><Plus size={18} /></button></div>{graph.episodes.slice().sort((a,b) => a.sortOrder-b.sortOrder).map((item,index) => <button type="button" key={item.id} className={episode === item.id ? "active" : ""} onClick={() => { setEpisode(item.id); setView("graph"); }}>{index + 1}. &nbsp;{item.title}</button>)}<button type="button" className={episode === "all" ? "active" : ""} onClick={() => { setEpisode("all"); setView("graph"); }}>Semua episode</button></div>
    </aside>

    <main className="studio-center">
      <div className="studio-workspace-toolbar"><div><p>STUDIO / {view === "graph" ? "STORY GRAPH" : nav.find(item => item.id === view)?.title.toUpperCase()}</p><h1>{episode === "all" ? story.title : graph.episodes.find(item => item.id === episode)?.title ?? story.title} <span className="studio-badge">{story.status === "published" ? "Terbit" : "Draft"}</span></h1></div><div className="studio-toolbar-actions"><span className="studio-save-state" role="status" aria-live="polite">{status === "Menyimpan…" || status === "Menerbitkan…" ? <BusyStatus>{status}</BusyStatus> : status}</span><button type="button" onClick={undo} title="Urungkan" aria-label="Urungkan" disabled={!historyRef.current.length}><RotateCcw size={17} /></button><button type="button" onClick={redo} title="Ulangi" aria-label="Ulangi" disabled={!redoRef.current.length}><Redo2 size={17} /></button><button type="button" onClick={() => void saveNow()} title="Simpan" aria-label="Simpan" disabled={revisionRef.current === savedRef.current}><Save size={17} /></button><button type="button" className="studio-add" onClick={addNode}><CirclePlus size={17} /> Tambah Node</button></div></div>
      {errors.length > 0 && <div className="studio-errors" role="alert"><strong>Perlu diperbaiki</strong><ul>{errors.map((message,index) => <li key={index}>{message}</li>)}</ul>{stoppedRef.current && <button type="button" onClick={() => window.location.reload()}>Muat versi terbaru</button>}{!stoppedRef.current && <button type="button" onClick={() => void saveNow()}>Coba simpan lagi</button>}</div>}
      {view === "graph" && <><div className="studio-graph-tools"><label><Search size={16} aria-hidden /><input aria-label="Cari node" value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari node…" /></label><button type="button" onClick={() => change(layoutGraph({ ...graph, nodes: graph.nodes.map(node => ({ ...node, x: null, y: null })) }))}><Expand size={16} /> Tata otomatis</button><button type="button" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void canvasRef.current?.requestFullscreen(); }}><Maximize2 size={16} /> Layar penuh</button><span>{visibleNodes.length} node · {flowEdges.length} pilihan</span></div><div ref={canvasRef} className="studio-canvas" aria-label="Canvas graph cerita"><ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} fitView minZoom={0.25} maxZoom={1.6} onNodeClick={(_,node) => selectNode(node.id)} onNodeDragStop={(_,node) => editNode(node.id, { x: node.position.x, y: node.position.y })} onConnect={(connection: Connection) => { if (connection.source && connection.target) { setPendingChoice({ source: connection.source, target: connection.target }); setChoiceLabel(""); selectNode(connection.source); } }} proOptions={{ hideAttribution: false }}><Background color="#263444" gap={20} size={1} /><Controls position="top-right" /><MiniMap nodeColor={node => node.id === selected ? "#5e91ff" : "#536478"} pannable zoomable /></ReactFlow>{visibleNodes.length === 0 && <div className="studio-canvas-empty">Tidak ada node pada tampilan ini. Tambah node atau ubah pencarian.</div>}</div></>}
      {view === "overview" && <div className="studio-view"><h2>Ringkasan cerita</h2><div className="studio-stats"><div><strong>{graph.episodes.length}</strong> episode</div><div><strong>{graph.nodes.length}</strong> node</div><div><strong>{graph.choices.length}</strong> pilihan</div><div><strong>{graph.nodes.filter(node => node.type === "ending").length}</strong> ending</div></div><p>Versi struktur terbit: {publishedVersion}. Perubahan draft akan terlihat pembaca setelah diterbitkan.</p><button onClick={() => setView("graph")}>Buka Story Graph <ChevronRight size={16} /></button></div>}
      {view === "episodes" && <div className="studio-view"><h2>Episode</h2>{graph.episodes.slice().sort((a,b) => a.sortOrder-b.sortOrder).map((item,index) => <div className="studio-list-row" key={item.id}><span>{index + 1}</span><input aria-label={`Judul episode ${index+1}`} value={item.title} maxLength={120} onChange={event => change(g => ({ ...g, episodes: g.episodes.map(e => e.id === item.id ? { ...e, title: event.target.value } : e) }))} /><small>{graph.nodes.filter(node => node.episodeId === item.id).length} node</small><button onClick={() => { setEpisode(item.id); setView("graph"); }}>Buka</button><button title="Naik" disabled={index===0} onClick={() => change(g => ({ ...g, episodes: g.episodes.map(e => e.id === item.id ? { ...e, sortOrder: index } : e.id === graph.episodes.slice().sort((a,b)=>a.sortOrder-b.sortOrder)[index-1]?.id ? { ...e, sortOrder: index+1 } : e) }))}>↑</button><button title="Turun" disabled={index===graph.episodes.length-1} onClick={() => change(g => ({ ...g, episodes: g.episodes.map(e => e.id === item.id ? { ...e, sortOrder: index+2 } : e.id === graph.episodes.slice().sort((a,b)=>a.sortOrder-b.sortOrder)[index+1]?.id ? { ...e, sortOrder: index+1 } : e) }))}>↓</button><button title="Hapus episode kosong" disabled={graph.episodes.length===1 || graph.nodes.some(node=>node.episodeId===item.id)} onClick={() => { if (!window.confirm(`Hapus ${item.title}?`)) return; change(g => ({ ...g, episodes: g.episodes.filter(e => e.id !== item.id) })); if (episode===item.id) setEpisode("all"); }}><Trash2 size={15} /></button></div>)}<button className="studio-add" onClick={addEpisode}><Plus size={16} /> Tambah episode</button></div>}
      {view === "scenes" && <div className="studio-view"><h2>Daftar adegan</h2>{graph.nodes.map(node => <button className="studio-scene-row" key={node.id} onClick={() => { selectNode(node.id); setView("graph"); setEpisode("all"); }}><span>{node.key}</span><strong>{node.title}</strong><small>{graph.episodes.find(e=>e.id===node.episodeId)?.title} · {panelCounts[node.id] ?? 0} panel</small><ChevronRight size={16} /></button>)}</div>}
      {view === "media" && <div className="studio-view"><h2>{story.default_format === "web_novel" ? "Naskah cerita" : "Media cerita"}</h2><p>{story.default_format === "web_novel" ? "Tulis dan terbitkan naskah tiap node." : "Panel gambar dikelola pada tiap node. Pilih node untuk upload, mengurutkan, atau membuat gambar AI."}</p><div className="studio-media-grid">{graph.nodes.map(node => <button key={node.id} onClick={() => void openPanels(node.id)}><div>{thumbnails[node.id] ? <Image src={thumbnails[node.id]} alt="" fill unoptimized sizes="180px" /> : <ImageIcon aria-hidden />}</div><strong>{node.title}</strong><small>{panelCounts[node.id] ?? 0} panel · {publishedMediaIds.includes(node.id) ? "Terbit" : "Belum terbit"}</small></button>)}</div></div>}
      {view === "ai" && <div className="studio-view"><h2>Generasi AI</h2><p>Pilih node lalu buka editor panel untuk membuat gambar dengan kie.ai atau OpenRouter yang telah dikonfigurasi. Hasil masuk ke draft dan perlu ditinjau.</p><label className="field"><span>Node tujuan</span><select value={selected ?? ""} onChange={event => setSelected(event.target.value)}>{graph.nodes.map(node => <option key={node.id} value={node.id}>{node.title}</option>)}</select></label><button className="studio-add" disabled={!selected} onClick={() => selected && void openPanels(selected)}><Sparkles size={16} /> Buka generator gambar</button></div>}
      {view === "publish" && <div className="studio-view"><h2>Publikasi struktur cerita</h2><p>Versi terbit {publishedVersion}. {story.default_format === "web_novel" ? "Naskah" : "Panel gambar"} diterbitkan terpisah dari struktur pilihan.</p><ul className="studio-validation">{validatePublication(graph).map((issue,index) => <li key={index}>{issue}</li>)}{graph.nodes.filter(node => !publishedMediaIds.includes(node.id)).map(node => <li key={node.id}>{node.title}: {story.default_format === "web_novel" ? "naskah" : "panel"} belum terbit.</li>)}</ul><button className="studio-add" disabled={!admin || publishing || revisionRef.current !== savedRef.current} onClick={() => void publish()}>{publishing ? <BusyStatus>Menerbitkan…</BusyStatus> : "Terbitkan struktur cerita"}</button>{!admin && <p>Hanya admin yang dapat menerbitkan.</p>}</div>}
    </main>

    <aside className={`studio-inspector ${mobileInspector ? "mobile-open" : ""}`}><div className="studio-inspector-tabs"><button className={inspectorTab === "detail" ? "active" : ""} onClick={() => setInspectorTab("detail")}>Detail Node</button><button className={inspectorTab === "panels" ? "active" : ""} onClick={() => current && void openPanels(current.id)}>{story.default_format === "web_novel" ? "Naskah" : "Panel Editing"}</button><button className={inspectorTab === "preview" ? "active" : ""} onClick={() => setInspectorTab("preview")}>Preview</button><button className="studio-mobile-close" onClick={() => setMobileInspector(false)} aria-label="Tutup detail">×</button></div>{current ? <div className="studio-inspector-body">{inspectorTab === "detail" && <><div className="studio-inspector-image">{thumbnails[current.id] ? <Image src={thumbnails[current.id]} alt="" fill unoptimized sizes="320px" /> : <ImageIcon size={36} aria-hidden />}</div><p className="studio-node-meta"><strong>{current.key}</strong><span className="studio-badge">{current.start ? "Node Awal" : current.type === "ending" ? "Ending" : "Adegan"}</span></p></>}{inspectorTab === "detail" ? <><label className="field"><span>Judul</span><input value={current.title} maxLength={200} onChange={event => editNode(current.id, { title: event.target.value })} /></label><label className="field"><span>Kunci URL</span><input value={current.key} disabled={publishedNodeIds.includes(current.id)} onChange={event => editNode(current.id, { key: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} /></label><label className="field"><span>Ringkasan</span><textarea rows={3} value={current.synopsis} maxLength={4000} onChange={event => editNode(current.id, { synopsis: event.target.value })} /></label><label className="field"><span>Episode</span><select value={current.episodeId} onChange={event => editNode(current.id, { episodeId: event.target.value })}>{graph.episodes.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><div className="studio-inline-fields"><label><input type="checkbox" checked={current.start} onChange={() => change(g => ({ ...g, nodes: g.nodes.map(node => ({ ...node, start: node.id === current.id })) }))} /> Node awal</label><label><input type="checkbox" checked={current.type === "ending"} onChange={event => editNode(current.id, { type: event.target.checked ? "ending" : "episode" })} /> Ending</label></div><div className="studio-inspector-section"><div className="studio-section-head"><strong>Panel</strong><button onClick={() => void openPanels(current.id)}>Edit Panel →</button></div><p>{panelCounts[current.id] ?? 0} panel · {publishedMediaIds.includes(current.id) ? "versi terbit tersedia" : "belum terbit"}</p></div><div className="studio-inspector-section"><div className="studio-section-head"><strong>Pilihan</strong><button onClick={() => { setPendingChoice({ source: current.id, target: graph.nodes.find(node => node.id !== current.id)?.id ?? current.id }); setChoiceLabel(""); }}><Plus size={15} /> Tambah</button></div>{graph.choices.filter(choice => choice.source === current.id).sort((a,b)=>a.sortOrder-b.sortOrder).map(choice => <div className="studio-choice-edit" key={choice.id}><input aria-label="Teks pilihan" value={choice.label} maxLength={200} onChange={event => editChoice(choice.id, { label: event.target.value })} /><select aria-label="Tujuan pilihan" value={choice.target} onChange={event => editChoice(choice.id, { target: event.target.value })}>{graph.nodes.filter(node => node.id !== current.id).map(node => <option key={node.id} value={node.id}>{node.title}</option>)}</select><button aria-label="Naikkan pilihan" title="Naikkan pilihan" onClick={() => moveChoice(choice.id, -1)}>↑</button><button aria-label="Turunkan pilihan" title="Turunkan pilihan" onClick={() => moveChoice(choice.id, 1)}>↓</button><button aria-label="Hapus pilihan" onClick={() => change(g => ({ ...g, choices: g.choices.filter(item => item.id !== choice.id) }))}><Trash2 size={15} /></button></div>)}{pendingChoice?.source === current.id && <div className="studio-new-choice"><label className="field"><span>Pilihan baru</span><input value={choiceLabel} onChange={event => setChoiceLabel(event.target.value)} placeholder="Teks pilihan" /></label><select aria-label="Tujuan baru" value={pendingChoice.target} onChange={event => setPendingChoice({ ...pendingChoice, target: event.target.value })}>{graph.nodes.filter(node => node.id !== current.id).map(node => <option key={node.id} value={node.id}>{node.title}</option>)}</select><button disabled={!choiceLabel.trim() || pendingChoice.target === current.id} onClick={() => { const link = pendingChoice; change(g => ({ ...g, choices: [...g.choices, { id: crypto.randomUUID(), source: link.source, target: link.target, label: choiceLabel.trim(), description: "", sortOrder: g.choices.filter(c => c.source === link.source).length + 1, color: "blue", condition: {} }] })); setPendingChoice(null); setChoiceLabel(""); }}>Simpan pilihan</button></div>}</div><label className="field"><span>Tag (pisahkan dengan koma)</span><input value={current.tags.join(", ")} onChange={event => editNode(current.id, { tags: event.target.value.split(",").map(tag=>tag.trim()).filter(Boolean).slice(0,15) })} /></label><label className="field"><span>Catatan internal</span><textarea rows={3} value={current.notes} maxLength={4000} onChange={event => editNode(current.id, { notes: event.target.value })} /></label>{!publishedNodeIds.includes(current.id) && <button className="studio-danger" onClick={() => removeNode(current.id)}><Trash2 size={16} /> Hapus node draft</button>}</> : inspectorTab === "panels" ? <NodePanelEditor key={current.id} storyId={story.id} nodeId={current.id} /> : <><p>Pratinjau vertikal memakai komponen panel yang sama dengan reader. Perubahan draft belum terlihat pembaca sebelum diterbitkan.</p><iframe key={current.id} title={`Preview ${current.title}`} className="studio-reader-iframe" src={`/admin/stories/${story.slug}/preview/${current.id}?embedded=1`} /><button onClick={() => void openPreview(current.id)}>Buka preview penuh →</button>{publishedNodeIds.includes(current.id) && <p><Link href={`/read/${story.slug}/${current.key}`} target="_blank">Lihat versi pembaca ↗</Link></p>}</>}</div> : <div className="studio-inspector-body"><p>Pilih node untuk melihat detail.</p></div>}</aside>
  </div>;
}





