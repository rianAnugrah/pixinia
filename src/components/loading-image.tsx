"use client";

import { useEffect, useRef, useState } from "react";
import BusyStatus from "@/components/busy-status";

export default function LoadingImage({ src, alt, width, height, className, priority = false, reloadOnRetry = false }: { src: string; alt: string; width?: number; height?: number; className?: string; priority?: boolean; reloadOnRetry?: boolean }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete) setState(image.naturalWidth > 0 ? "ready" : "error");
  }, [src]);
  return <div className={`image-loading ${className ?? ""}`} style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}>
    {state === "loading" && <div className="image-loading-status"><BusyStatus>Memuat gambar…</BusyStatus></div>}
    {state === "error" && <div className="image-loading-status" role="alert"><p>Gambar gagal dimuat.</p><button type="button" onClick={() => { if (reloadOnRetry) { window.location.reload(); return; } setState("loading"); if (imageRef.current) imageRef.current.src = src; }}>Coba lagi</button></div>}
    {/* The image stays mounted so its load event can end the visible placeholder. */}
    <img ref={imageRef} src={src} alt={alt} width={width} height={height} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} onLoad={() => setState("ready")} onError={() => setState("error")} className={state === "ready" ? "image-ready" : "image-pending"} />
  </div>;
}
