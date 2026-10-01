import { readFile, mkdir, writeFile } from 'node:fs/promises';
const source = JSON.parse(await readFile(new URL('./figma-assets.json', import.meta.url), 'utf8'));
const directory = new URL('../public/figma/', import.meta.url);
await mkdir(directory, { recursive: true });
const assets = {};
const jobs = [];
for (const [screen, entries] of Object.entries(source)) {
  assets[screen] = {};
  for (const [name, url] of Object.entries(entries)) {
    if (/Ios/.test(name)) continue;
    const filename = `${screen.replace(':', '-')}-${name}.${url.split('.').at(-1)}`;
    assets[screen][name] = `/figma/${filename}`;
    jobs.push(async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${filename}: ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length) throw new Error(`Empty asset: ${filename}`);
      await writeFile(new URL(filename, directory), bytes);
    });
  }
}
let cursor = 0;
await Promise.all(Array.from({ length: 8 }, async () => { while (cursor < jobs.length) await jobs[cursor++](); }));
await writeFile(new URL('../src/components/reader/figma-assets.json', import.meta.url), JSON.stringify(assets, null, 2));
console.log(`Downloaded ${jobs.length} Figma assets.`);
