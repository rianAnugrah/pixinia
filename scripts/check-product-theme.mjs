import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tokens = JSON.parse(readFileSync(new URL("../tokens/product-theme.json", import.meta.url), "utf8"));
const css = readFileSync(new URL("../src/app/product-design.css", import.meta.url), "utf8");
const color = name => {
  const reference = tokens.semantic[name].$value.match(/^\{primitive\.(.+)\}$/)?.[1];
  assert.ok(reference, `Invalid token alias: ${name}`);
  return tokens.primitive[reference].$value;
};
function luminance(hex) {
  const channels = hex.slice(1).match(/../g).slice(0, 3).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
const pairs = [
  ["text", "bg", 4.5], ["text", "surface", 4.5], ["muted", "surface", 4.5],
  ["muted", "surface-raised", 4.5], ["quiet", "surface", 4.5],
  ["accent", "bg", 4.5], ["accent", "accent-soft", 4.5],
  ["on-accent", "accent", 4.5], ["on-accent", "accent-hover", 4.5],
  ["success", "success-soft", 4.5], ["danger", "danger-soft", 4.5],
  ["border-strong", "surface", 3], ["accent", "surface-raised", 3],
  ["reading-paper-text", "reading-paper-bg", 4.5], ["reading-night-text", "reading-night-bg", 4.5],
];
for (const [foreground, background, minimum] of pairs) {
  const values = [luminance(color(foreground)), luminance(color(background))].sort((a, b) => b - a);
  const ratio = (values[0] + .05) / (values[1] + .05);
  console.log(`${ratio >= minimum ? "PASS" : "FAIL"} ${foreground} on ${background}: ${ratio.toFixed(2)}:1 (minimum ${minimum})`);
  assert.ok(ratio >= minimum, `${foreground} on ${background} has insufficient contrast`);
}
for (const [name, token] of Object.entries(tokens.primitive)) {
  assert.ok(css.includes(`--palette-${name}: ${token.$value};`), `CSS palette drift: ${name}`);
}
for (const [name, token] of Object.entries(tokens.semantic)) {
  const reference = token.$value.match(/^\{primitive\.(.+)\}$/)[1];
  assert.ok(css.includes(`--${name}: var(--palette-${reference});`), `CSS alias drift: ${name}`);
}
console.log(`${pairs.length}/${pairs.length} contrast pairs pass; CSS matches the token source.`);
