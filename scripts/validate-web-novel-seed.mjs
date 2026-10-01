export function validateSeed(novel) {
  const chapters = novel.chapters;
  if (chapters.length < 20 || chapters.length > 200) throw new Error("Expected dozens of chapters");
  if (novel.episodes.length !== 5) throw new Error("Expected five acts");
  const keys = new Set(chapters.map(chapter => chapter.key));
  if (keys.size !== chapters.length) throw new Error("Duplicate chapter key");
  if (chapters.filter(chapter => chapter.number === 1).length !== 1) throw new Error("Expected one start chapter");
  const endings = new Set(chapters.filter(chapter => chapter.choices.length === 0).map(chapter => chapter.key));
  if (endings.size < 3) throw new Error("Expected three endings");
  for (const [index, chapter] of chapters.entries()) {
    if (chapter.number !== index + 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(chapter.key)) throw new Error(`Invalid order/key: ${chapter.key}`);
    if (chapter.body.trim().split(/\s+/u).length < 85) throw new Error(`Chapter too short: ${chapter.key}`);
    if (chapter.body.length > 200000 || !chapter.body.includes("\n\n")) throw new Error(`Invalid prose: ${chapter.key}`);
    if (chapter.choices.length > 3 || new Set(chapter.choices.map(choice => choice[0])).size !== chapter.choices.length) throw new Error(`Invalid choices: ${chapter.key}`);
    for (const [target, label] of chapter.choices) if (!keys.has(target) || !label || chapters.find(item => item.key === target).number <= chapter.number) throw new Error(`Bad edge ${chapter.key} -> ${target}`);
  }
  const visited = new Set();
  const visit = key => { if (visited.has(key)) return; visited.add(key); chapters.find(chapter => chapter.key === key).choices.forEach(([target]) => visit(target)); };
  visit(chapters[0].key);
  if (visited.size !== chapters.length) throw new Error(`Unreachable chapters: ${chapters.filter(chapter => !visited.has(chapter.key)).map(chapter => chapter.key).join(", ")}`);
  const canEnd = new Set(endings);
  for (let i = chapters.length - 1; i >= 0; i--) if (chapters[i].choices.some(([target]) => canEnd.has(target))) canEnd.add(chapters[i].key);
  if (canEnd.size !== chapters.length) throw new Error("A path cannot reach an ending");
  return { chapters: chapters.length, choices: chapters.reduce((sum, chapter) => sum + chapter.choices.length, 0), endings: endings.size };
}
