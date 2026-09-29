"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin";

function required(form: FormData, name: string, max = 200) {
  const value = String(form.get(name) || "").trim();
  if (!value || value.length > max) throw new Error(`Isian ${name} tidak valid`);
  return value;
}

export async function createStory(form: FormData) {
  const { db, user } = await requireStaff();
  const title = required(form, "title"); const slug = required(form, "slug").toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Slug harus huruf kecil, angka, atau tanda hubung");
  const { error } = await db.from("stories").insert({ title, slug, description: String(form.get("description") || "").slice(0, 3000), created_by: user.id });
  if (error) throw new Error(error.message); revalidatePath("/admin"); redirect(`/admin/stories/${slug}`);
}

export async function createNode(form: FormData) {
  const { db } = await requireStaff();
  const storyId = required(form, "story_id", 40); const slug = required(form, "slug"); const nodeKey = required(form, "node_key"); const title = required(form, "title");
  const { data: story } = await db.from("stories").select("id").eq("id", storyId).eq("slug", slug).single(); if (!story) throw new Error("Cerita tidak ditemukan");
  const nodeType = form.get("node_type") === "ending" ? "ending" : "episode";
  const isStart = form.get("is_start") === "on";
  const { error } = await db.from("story_nodes").insert({ story_id: storyId, node_key: nodeKey, title, synopsis: String(form.get("synopsis") || "").slice(0, 4000), node_type: nodeType, is_start: isStart });
  if (error) throw new Error(error.message); revalidatePath(`/admin/stories/${slug}`);
}

export async function createChoice(form: FormData) {
  const { db } = await requireStaff();
  const storyId = required(form, "story_id", 40); const slug = required(form, "slug"); const nodeId = required(form, "node_id", 40); const nextNodeId = required(form, "next_node_id", 40); const label = required(form, "label");
  const { data: nodes } = await db.from("story_nodes").select("id").eq("story_id", storyId).in("id", [nodeId, nextNodeId]); if (nodes?.length !== 2) throw new Error("Node harus berada pada cerita yang sama");
  const { error } = await db.from("story_choices").insert({ story_id: storyId, node_id: nodeId, next_node_id: nextNodeId, label });
  if (error) throw new Error(error.message); revalidatePath(`/admin/stories/${slug}`);
}

export async function beginChapterImages(form: FormData) {
  const { db } = await requireStaff();
  const nodeId = required(form, "node_id", 40);
  const slug = required(form, "slug");
  const { data: node } = await db.from("story_nodes").select("story_id,stories!inner(slug)").eq("id", nodeId).single();
  if (!node || (node.stories as unknown as { slug: string }).slug !== slug) throw new Error("Chapter tidak ditemukan");
  const { error } = await db.rpc("begin_chapter_image_draft", { p_node_id: nodeId });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/stories/${slug}/chapters/${nodeId}`);
  redirect(`/admin/stories/${slug}/chapters/${nodeId}`);
}
