export function visibleChapterSections<T extends { id: string; isStart: boolean; owned: boolean }>(chapters: T[], activeId?: string) {
  const continuation = chapters.find(chapter => chapter.id === activeId) ?? null;
  const start = chapters.find(chapter => chapter.isStart) ?? null;
  const unlocked = chapters.filter(chapter => chapter.owned && chapter.id !== continuation?.id && chapter.id !== start?.id);
  return { continuation, start, unlocked };
}
