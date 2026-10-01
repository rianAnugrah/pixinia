"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

// The database measures elapsed time and serializes all tabs/devices for one story.
// No browser timestamp or claimed duration is accepted by the RPC.
export default function ReadTracker({ nodeId }: { nodeId: string }) {
  useEffect(() => {
    const db = createClient(); let pending = false; let stopped = false;
    async function touch() {
      if (stopped || pending || document.visibilityState !== "visible" || !document.hasFocus()) return;
      pending = true;
      try { await db.rpc("reader_touch_session", { p_node_id: nodeId }); }
      catch { /* Tracking retries on the next heartbeat without interrupting reading. */ }
      finally { pending = false; }
    }
    void touch();
    const timer = window.setInterval(() => { void touch(); }, 5_000);
    const pause = () => { void db.rpc("reader_pause_session", { p_node_id: nodeId }).then(() => {}, () => {}); };
    const visible = () => {
      if (document.visibilityState !== "visible" || !document.hasFocus()) pause();
      else void touch();
    };
    document.addEventListener("visibilitychange", visible); window.addEventListener("focus", visible); window.addEventListener("blur", pause);
    return () => { stopped = true; window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); window.removeEventListener("focus", visible); window.removeEventListener("blur", pause); pause(); };
  }, [nodeId]);
  return null;
}
