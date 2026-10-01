export function novelParagraphs(body: string | null | undefined): string[] {
  return (body ?? "").replace(/\r\n/g, "\n").trim().split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
}

const PROSE_INLINE_TAGS: Record<string, string> = { b: "strong", strong: "strong", i: "em", em: "em", u: "u", s: "s", strike: "s" };
const PROSE_BLOCK_TAG = "p";

/** Strips naskah HTML down to paragraphs plus a small set of inline marks (bold/italic/underline/strike). No attributes survive, so pasted markup can't carry scripts or links. */
export function sanitizeProseHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, closing: string, rawTag: string) => {
      const tag = rawTag.toLowerCase();
      if (tag === "br") return closing ? "" : "<br>";
      if (tag === "div" || tag === PROSE_BLOCK_TAG) return closing ? `</${PROSE_BLOCK_TAG}>` : `<${PROSE_BLOCK_TAG}>`;
      const mapped = PROSE_INLINE_TAGS[tag];
      if (!mapped) return "";
      return closing ? `</${mapped}>` : `<${mapped}>`;
    })
    .replace(/(<p>(\s|&nbsp;)*<\/p>\s*){2,}/g, "<p></p>");
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Converts a legacy plain-text draft (paragraphs separated by blank lines) into the paragraph HTML the rich editor expects. */
export function legacyProseToHtml(body: string): string {
  const paragraphs = novelParagraphs(body);
  if (!paragraphs.length) return "<p></p>";
  return paragraphs.map(part => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`).join("");
}

/** Normalizes a stored naskah body (legacy plain text or sanitized HTML) into editable paragraph HTML. */
export function proseBodyToEditableHtml(body: string | null | undefined): string {
  const value = (body ?? "").trim();
  if (!value) return "<p></p>";
  return /<[a-z][\s\S]*>/i.test(value) ? sanitizeProseHtml(value) : legacyProseToHtml(value);
}

/** Splits sanitized naskah HTML into one inner-HTML string per paragraph, for readers' per-paragraph progress tracking. */
export function splitProseBlocks(html: string): string[] {
  return [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => match[1].trim()).filter(part => part && part !== "<br>");
}

/** Returns the paragraph blocks (as inner HTML) for a stored naskah body, legacy plain text included. */
export function renderableProseBlocks(body: string | null | undefined): string[] {
  const value = (body ?? "").trim();
  if (!value) return [];
  if (/<[a-z][\s\S]*>/i.test(value)) return splitProseBlocks(sanitizeProseHtml(value));
  return novelParagraphs(value).map(part => escapeHtml(part).replace(/\n/g, "<br>"));
}

export function prosePlainLength(html: string): number {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim().length;
}
