type GeneratedImage = { bytes: Buffer; reportedCost: number | null };

// Add future providers here; Higgsfield needs its own API contract and pricing check.
export type ImageProvider = "openrouter" | "kie";

export async function generateWithOpenRouter(prompt: string, aspectRatio: string): Promise<GeneratedImage> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OpenRouter belum dikonfigurasi");
  const response = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "bytedance-seed/seedream-4.5", prompt, n: 1, resolution: "1K", aspect_ratio: aspectRatio, output_format: "png" }),
    signal: AbortSignal.timeout(45_000), cache: "no-store",
  });
  if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}`);
  const result = await response.json();
  const encoded = result?.data?.[0]?.b64_json;
  if (typeof encoded !== "string" || result.data[0].media_type === "image/svg+xml")
    throw new Error("OpenRouter tidak mengembalikan gambar raster");
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > 20 * 1024 * 1024) throw new Error("Ukuran hasil OpenRouter tidak valid");
  return { bytes, reportedCost: typeof result?.usage?.cost === "number" ? result.usage.cost : null };
}

export async function submitToKie(prompt: string, aspectRatio: string): Promise<string> {
  const key = process.env.KIE_API_KEY;
  if (!key) throw new Error("kie.ai belum dikonfigurasi");
  const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "flux1-kontext", input: { prompt, aspect_ratio: aspectRatio, output_format: "png" } }),
    signal: AbortSignal.timeout(20_000), cache: "no-store",
  });
  if (!response.ok) throw new Error(`kie.ai HTTP ${response.status}`);
  const result = await response.json();
  if (result?.code !== 200 || typeof result?.data?.taskId !== "string") throw new Error("kie.ai tidak menerima tugas");
  return result.data.taskId;
}

export async function pollKie(taskId: string): Promise<{ state: "processing" | "failed" | "success"; url?: string }> {
  const key = process.env.KIE_API_KEY;
  if (!key) throw new Error("kie.ai belum dikonfigurasi");
  const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15_000), cache: "no-store",
  });
  if (!response.ok) throw new Error(`kie.ai HTTP ${response.status}`);
  const result = await response.json();
  const state = result?.data?.state;
  if (state === "fail") return { state: "failed" };
  if (state !== "success") return { state: "processing" };
  let parsed: unknown;
  try { parsed = JSON.parse(result.data.resultJson); } catch { throw new Error("Hasil kie.ai tidak valid"); }
  const url = (parsed as { resultUrls?: unknown[] })?.resultUrls?.[0];
  if (typeof url !== "string") throw new Error("URL hasil kie.ai hilang");
  return { state: "success", url };
}

export async function downloadKieResult(value: string): Promise<Buffer> {
  const url = new URL(value);
  const allowed = (process.env.KIE_RESULT_HOSTS || "").split(",").map(host => host.trim().toLowerCase()).filter(Boolean);
  if (url.protocol !== "https:" || url.port || !allowed.includes(url.hostname.toLowerCase()))
    throw new Error("Host hasil kie.ai belum diizinkan");
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(20_000), cache: "no-store" });
  if (!response.ok || Number(response.headers.get("content-length") || 0) > 20 * 1024 * 1024)
    throw new Error("Gagal mengunduh hasil kie.ai");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 20 * 1024 * 1024) throw new Error("Ukuran hasil kie.ai tidak valid");
  return bytes;
}
