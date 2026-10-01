export function novelParagraphs(body: string | null | undefined): string[] {
  return (body ?? "").replace(/\r\n/g, "\n").trim().split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
}
