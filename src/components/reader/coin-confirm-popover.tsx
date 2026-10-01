"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export default function CoinConfirmPopover({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [busy, onClose]);
  return <div ref={ref} className="reader-coin-popover" role="dialog" aria-modal="false" aria-labelledby={titleId} tabIndex={-1}>
    <div className="reader-coin-popover-head"><h2 id={titleId}>{title}</h2><button type="button" onClick={onClose} disabled={busy} aria-label="Tutup"><X size={17} /></button></div>
    {children}
  </div>;
}
