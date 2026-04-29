const DEFAULT_MAX = 900;
const STRIDE = 780;

/** 将课程资料正文拆成若干 chunk（贪心按段落，超长段按固定窗口切片） */
export function splitTextIntoChunks(text: string, maxChunkChars = DEFAULT_MAX): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  let buf = "";

  const flush = () => {
    const t = buf.trim();
    if (t) out.push(t);
    buf = "";
  };

  const pushSlice = (p: string) => {
    if (p.length <= maxChunkChars) {
      if (buf && buf.length + p.length + 2 > maxChunkChars) flush();
      buf = buf ? `${buf}\n\n${p}` : p;
      if (buf.length >= maxChunkChars * 0.85) flush();
      return;
    }
    for (let i = 0; i < p.length; i += STRIDE) {
      const slice = p.slice(i, i + maxChunkChars);
      if (buf && buf.length + slice.length + 2 > maxChunkChars) flush();
      buf = buf ? `${buf}\n\n${slice}` : slice;
      if (buf.length >= maxChunkChars * 0.85) flush();
    }
  };

  for (const para of paragraphs) {
    pushSlice(para);
  }
  flush();

  if (out.length === 0 && normalized.length > 0) {
    for (let i = 0; i < normalized.length; i += STRIDE) {
      out.push(normalized.slice(i, i + maxChunkChars));
    }
  }

  return out;
}
