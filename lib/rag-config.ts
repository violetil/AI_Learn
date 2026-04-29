import path from "node:path";

/** LanceDB 表名：课程 chunk 向量 */
export const LANCE_COURSE_CHUNKS_TABLE = "course_chunks";

export function getLanceDbDirectory(): string {
  return path.join(process.cwd(), "data", "lancedb");
}

/** 向量检索候选上限（先召回再按阈值过滤） */
export function getRagTopK(): number {
  const raw = process.env.RAG_TOP_K;
  const n = raw ? Number.parseInt(raw, 10) : 20;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100) : 20;
}

/**
 * 最小余弦相似度（基于 Lance cosine distance：similarity ≈ 1 - _distance）。
 * 阈值越高，注入片段越少但越相关。
 */
export function getRagMinSimilarity(): number {
  const raw = process.env.RAG_MIN_SIMILARITY;
  const x = raw ? Number.parseFloat(raw) : 0.72;
  if (!Number.isFinite(x)) return 0.72;
  return Math.min(1, Math.max(0, x));
}

/** 注入 Prompt 的检索片段条数上限 */
export function getRagMaxSnippets(): number {
  const raw = process.env.RAG_MAX_SNIPPETS;
  const n = raw ? Number.parseInt(raw, 10) : 8;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 30) : 8;
}

/** 检索知识块总字符上限 */
export function getRagMaxChars(): number {
  const raw = process.env.RAG_MAX_CHARS;
  const n = raw ? Number.parseInt(raw, 10) : 12_000;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 48_000) : 12_000;
}

export const CHAT_PROMPT_VERSION = "course-grounded-v3-role-split";
