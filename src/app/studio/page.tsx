import { requireStaff } from "@/lib/admin";
import StudioLibrary from "@/components/studio/studio-library";

export default async function StudioPage() {
  const { db, role, user } = await requireStaff();
  let query = db.from("stories").select("id,slug,title,status,default_format,cover_path,description,genres");
  if (role !== "admin") query = query.eq("author_id", user.id);
  const { data: stories, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return <StudioLibrary stories={stories ?? []} admin={role === "admin"} />;
}
