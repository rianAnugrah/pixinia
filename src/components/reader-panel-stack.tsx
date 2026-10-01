import LoadingImage from "@/components/loading-image";
import type { ReactNode } from "react";

export type ReaderPanel = {
  id: string;
  url: string | null;
  alt: string;
  width?: number;
  height?: number;
  speaker?: string | null;
  dialogue?: string | null;
  caption?: string | null;
};

export default function ReaderPanelStack({ panels, renderActions, renderAfter, className = "", reloadOnImageRetry = false }: { panels: ReaderPanel[]; renderActions?: (panel: ReaderPanel, index: number) => ReactNode; renderAfter?: (panel: ReaderPanel, index: number) => ReactNode; className?: string; reloadOnImageRetry?: boolean }) {
  if (!panels.length) return <div className="empty-state"><p>Panel belum tersedia untuk bab ini.</p></div>;
  return <div className={`reader-panel-stack ${className}`}>{panels.map((panel, index) => <article className="comic-panel" data-reader-panel={panel.id} key={panel.id}>
    {panel.url ? <LoadingImage src={panel.url} alt={panel.alt} width={panel.width} height={panel.height} priority={index === 0} reloadOnRetry={reloadOnImageRetry} /> : <p className="form-error">Gambar tidak dapat dimuat.</p>}
    {renderActions?.(panel, index)}
    {(panel.speaker || panel.dialogue || panel.caption) && <div className="comic-panel-body">
      {panel.speaker && <span className="speaker">{panel.speaker}</span>}
      {panel.dialogue && <p>{panel.dialogue}</p>}
      {panel.caption && <p className="muted">{panel.caption}</p>}
    </div>}
    {renderAfter?.(panel, index)}
  </article>)}</div>;
}
