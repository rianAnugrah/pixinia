import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const sourceRoot = "C:/Users/Rian anugrah/.codex/generated_images/01a0f175-196e-73f1-a44a-729cfd3e8195";
const covers = [
  ["exec-82be834f-2096-492e-98f1-65ea560cc2a3.png", "atlas-musim-terakhir"],
  ["exec-d96b8268-a2fc-41c0-afe0-812262556e6b.png", "arsip-dari-tahun-lalu"],
  ["exec-50f35dff-62c6-45ef-b93e-3cf7e842bddb.png", "algoritma-fajar-buatan"],
  ["exec-e0f19dd5-4a59-4035-b427-179b60653210.png", "bayangan-pukul-dua-belas"],
  ["exec-842216c2-a212-4b67-acb9-ce15ea567859.png", "hujan-di-jendela-timur"],
];
const outputRoot = resolve("public/novel-covers");
mkdirSync(outputRoot, { recursive: true });
for (const [inputName, slug] of covers) {
  const output = resolve(outputRoot, `${slug}.webp`);
  await sharp(resolve(sourceRoot, inputName)).resize(1200, 1800, { fit: "cover", position: "attention" }).webp({ quality: 84 }).toFile(output);
  console.log(`${output} ${((await sharp(output).metadata()).width)}x${(await sharp(output).metadata()).height}`);
}
