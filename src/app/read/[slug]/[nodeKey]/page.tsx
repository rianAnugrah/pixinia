import { notFound } from "next/navigation";
import Link from "next/link";
import { LockKeyhole, Coins, ShieldCheck, GitBranch } from "lucide-react";
import { assetUrl, getNode, getNodeContent, getPublishedChapterImages, getStory } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { getReaderNavigation } from "@/lib/reader-navigation";
import ReaderActions from "@/components/reader-actions";
import ReaderPanelStack, { type ReaderPanel } from "@/components/reader-panel-stack";
import ReaderControls from "@/components/reader/reader-controls";
import CoinAction from "@/components/coin-action";
import { novelParagraphs } from "@/lib/web-novel";

export default async function ReaderPage({ params }: { params: Promise<{ slug: string; nodeKey: string }> }) {
  const { slug, nodeKey } = await params;
  const db = await createClient();
  const userPromise = db.auth.getUser();
  const story = await getStory(slug); if (!story) notFound();
  const node = await getNode(story.id, nodeKey); if (!node) notFound();
  const { data: { user } } = await userPromise;
  const [navigation, readAccess] = await Promise.all([
    getReaderNavigation(story, user?.id, node.id),
    db.rpc("coin_can_read_node", { p_node: node.id }),
  ]);
  const { chapters, edges, progress, access } = navigation;
  const { data: allowed, error } = readAccess;
  if (error) throw error;
  const contentPromise = allowed ? getNodeContent(node.id) : Promise.resolve({ assets: [], choices: [], panels: [] });
  const chapterImagesPromise = allowed && story.default_format !== "web_novel" ? getPublishedChapterImages(node.id) : Promise.resolve(null);
  const prosePromise = allowed && story.default_format === "web_novel"
    ? db.from("story_node_prose_publications").select("body").eq("node_id", node.id).maybeSingle()
    : Promise.resolve({ data: null, error: null });
  const [content, chapterImages, { data: prose, error: proseError }] = await Promise.all([contentPromise, chapterImagesPromise, prosePromise]);
  if (proseError) throw proseError;
  const paragraphs = novelParagraphs(prose?.body);
  const proseIds = paragraphs.map((_, index) => `${node.id}:paragraph:${index}`);
  const publishedPanels: ReaderPanel[] = chapterImages
    ? chapterImages.map(image => ({ id: image.id, url: image.url, alt: image.alt_text, width: image.width, height: image.height, speaker: image.speaker, dialogue: image.dialogue, caption: image.caption }))
    : content.panels.map(panel => { const asset = content.assets.find(item => item.id === panel.asset_id); return { id: panel.id, url: asset ? assetUrl(asset) : null, alt: panel.caption || `Panel ${panel.panel_order}`, speaker: panel.speaker, dialogue: panel.dialogue, caption: panel.caption }; });
  const targets = Object.fromEntries(chapters.map(chapter => [chapter.id, chapter.nodeKey]));
  const costs = Object.fromEntries(chapters.map(chapter => [chapter.id, chapter.owned ? 0 : chapter.cost]));
  const choices = content.choices.filter(choice => targets[choice.next_node_id]);
  const activeChapter = chapters.find(chapter => chapter.active);
  const canChoose = !user || progress?.current_node_id === node.id;
  const resetLabel = !progress ? "Mulai dari bab ini · Gratis" : "Pilih jalur dari bab ini · Gratis";
  return <main className="reader-experience" id="konten-baca">
    <ReaderControls key={`${user?.id ?? "guest"}:${node.id}`} slug={slug} title={node.title} nodeId={node.id} panelIds={story.default_format === "web_novel" ? proseIds : publishedPanels.map(panel => panel.id)} chapters={chapters} edges={edges} accountKey={user?.id ?? "guest"} balance={access.balance} signedIn={!!user} hasChoices={allowed && choices.length > 0 && canChoose} contentLabel={story.default_format === "web_novel" ? "Paragraf" : "Panel"} />
    <div className="reader-content">
      {allowed ? <>
        <div className="reader-chapter-intro"><p>{node.node_type === "ending" ? "AKHIR CERITA" : story.title}</p><h1>{node.title}</h1>{node.synopsis && <span>{node.synopsis}</span>}</div>
        {story.default_format === "web_novel" ? <article className="web-novel-text" aria-label={`Naskah ${node.title}`}>
          {paragraphs.length ? paragraphs.map((paragraph, index) => <p key={proseIds[index]} data-reader-panel={proseIds[index]}>{paragraph}</p>) : <p>Naskah bab belum diterbitkan.</p>}
        </article> : <ReaderPanelStack panels={publishedPanels} reloadOnImageRetry />}
        <div className="reader-ending" id="akhir-bab">
          {canChoose ? <ReaderActions nodeId={node.id} progressVersion={progress?.updated_at ?? null} storyId={story.id} slug={slug} choices={choices} targets={targets} costs={costs} balance={access.balance} signedIn={!!user} isEnding={node.node_type === "ending"} />
            : <section className="reader-replay"><GitBranch size={28} /><h2>{progress ? "Jelajahi jalur lain" : "Mulai perjalananmu"}</h2><p>Bab ini sudah terbuka. Aktifkan bab ini untuk memilih kelanjutannya. Semua unlock tetap dimiliki.</p><CoinAction key={node.id} rpc="coin_reset_chapter" args={{ p_node_id: node.id }} label={resetLabel} confirmText="Mulai jalur baru dari bab ini? Riwayat jalur aktif akan dimulai ulang. Semua bab yang sudah dibeli tetap terbuka, tanpa biaya." />{activeChapter && <Link href={`/read/${slug}/${activeChapter.nodeKey}`}>Lanjutkan perjalanan: {activeChapter.title} →</Link>}</section>}
          {user && canChoose && <details className="reader-reset-details"><summary>Ulangi pilihan dari bab ini</summary><p>Reset gratis. Riwayat jalur aktif dimulai ulang; pembelian tetap dimiliki.</p><CoinAction rpc="coin_reset_chapter" args={{ p_node_id: node.id }} label="Reset bab · Gratis" confirmText="Ulangi pilihan dari bab ini? Riwayat jalur aktif dimulai ulang. Semua unlock tetap dimiliki." /></details>}
        </div>
      </> : <section className="reader-unlock-gate">
        <div className="reader-lock-art"><LockKeyhole size={42} /></div><p className="reader-choice-kicker">{node.is_premium || story.is_premium ? "BAB PREMIUM" : "JALUR BARU MENUNGGU"}</p><h1>{node.title}</h1><p>{node.synopsis}</p>
        <div className="reader-unlock-price"><Coins size={24} /><strong>{node.unlock_cost}</strong><span>coin untuk unlock</span></div>
        <CoinAction rpc="coin_unlock_node" args={{ p_node_id: node.id }} label="Unlock & baca bab" cost={node.unlock_cost} balance={access.balance} signedIn={!!user} next={`/read/${slug}/${nodeKey}`} />
        <p className="reader-unlock-assurance"><ShieldCheck size={17} /> Sekali unlock, baca ulang selamanya. Reset gratis.</p>
        {story.is_premium && <div className="reader-premium-offer"><h2>Buka seluruh cerita</h2><p>Semua cabang dalam {story.title}.</p><CoinAction rpc="coin_unlock_story" args={{ p_story_id: story.id }} label="Unlock cerita premium" cost={story.unlock_cost} balance={access.balance} signedIn={!!user} next={`/read/${slug}/${nodeKey}`} /></div>}
        <Link className="reader-back-story" href={`/stories/${slug}`}>← Kembali ke daftar bab</Link>
      </section>}
    </div>
  </main>;
}
