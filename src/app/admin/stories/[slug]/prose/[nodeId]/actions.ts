"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin";

export async function saveProse(form: FormData) {
  const { db, role } = await requireStaff();
  const storyId = String(form.get("story_id") ?? "");
  const nodeId = String(form.get("node_id") ?? "");
  const slug = String(form.get("slug") ?? "");
  const body = String(form.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  const publish = form.get("intent") === "publish";
  if (body.length > 200000 || (publish && !body)) throw new Error("Naskah harus berisi 1–200.000 karakter.");
  if (publish && role !== "admin") throw new Error("Hanya admin dapat menerbitkan naskah.");
  const [{ data: story, error: storyError }, { data: node, error: nodeError }] = await Promise.all([
    db.from("stories").select("id").eq("id", storyId).eq("slug", slug).eq("default_format", "web_novel").maybeSingle(),
    db.from("story_nodes").select("id").eq("id", nodeId).eq("story_id", storyId).maybeSingle(),
  ]);
  if (storyError || nodeError || !story || !node) throw new Error("Bab Web Novel tidak ditemukan.");
  const { error } = await db.from("story_node_prose_drafts").upsert({ node_id: nodeId, body }, { onConflict: "node_id" });
  if (error) throw new Error(error.message);
  if (publish) {
    const { error: publishError } = await db.from("story_node_prose_publications").upsert({ node_id: nodeId, body, published_at: new Date().toISOString() }, { onConflict: "node_id" });
    if (publishError) throw new Error(publishError.message);
  }
  revalidatePath(`/admin/stories/${slug}/prose/${nodeId}`);
  revalidatePath(`/admin/stories/${slug}`);
  revalidatePath(`/read/${slug}`);
}
