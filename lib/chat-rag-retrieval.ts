import type { CourseContextPayload } from "@/lib/course-context";
import type { RagSnippet } from "@/lib/chat-prompt-orchestrator";
import { embedQuery } from "@/lib/embeddings";
import { prisma } from "@/lib/db";
import {
  getRagMaxChars,
  getRagMaxSnippets,
  getRagMinSimilarity,
  getRagTopK,
} from "@/lib/rag-config";
import { hasChunksVectorTable, vectorSearchCourseChunks } from "@/lib/rag-lance";

export type CourseRagRetrievalResult = {
  ragMode: "rag" | "fallback";
  snippets: RagSnippet[];
  retrievalChunkIds: string[];
};

/**
 * 基于用户问题做向量检索；嵌入不可用或无命中则 ragMode=fallback（由编排层注入全文资料）。
 */
export async function retrieveCourseKnowledgeForChat(params: {
  courseId: string;
  userQuestion: string;
}): Promise<CourseRagRetrievalResult> {
  const empty: CourseRagRetrievalResult = {
    ragMode: "fallback",
    snippets: [],
    retrievalChunkIds: [],
  };

  const q = params.userQuestion.trim();
  if (!q) return empty;

  const hasTable = await hasChunksVectorTable();
  if (!hasTable) return empty;

  const queryEmbedding = await embedQuery(q.slice(0, 8000));
  if (!queryEmbedding) return empty;

  const hits = await vectorSearchCourseChunks({
    courseId: params.courseId,
    queryEmbedding,
    topK: getRagTopK(),
  });

  const minSim = getRagMinSimilarity();
  const scored = hits
    .map((h) => ({
      chunkId: h.chunk_id,
      similarity: 1 - h.distance,
    }))
    .filter((h) => h.similarity >= minSim)
    .sort((a, b) => b.similarity - a.similarity);

  const ids = scored.map((s) => s.chunkId);
  if (ids.length === 0) {
    return empty;
  }

  const chunks = await prisma.courseKnowledgeChunk.findMany({
    where: {
      id: { in: ids },
      courseId: params.courseId,
    },
    include: {
      material: { select: { title: true } },
    },
  });

  const chunkMap = new Map(chunks.map((c) => [c.id, c]));
  const ordered = ids
    .map((id) => chunkMap.get(id))
    .filter(Boolean) as typeof chunks;

  const maxSnippets = getRagMaxSnippets();
  let usedChars = 0;
  const maxChars = getRagMaxChars();
  const snippets: RagSnippet[] = [];

  for (const row of ordered) {
    if (snippets.length >= maxSnippets) break;
    const sim = scored.find((s) => s.chunkId === row.id)?.similarity ?? 0;
    const title = row.material?.title?.trim() || "课程资料";
    let piece = row.content.trim();
    if (!piece) continue;
    const remaining = maxChars - usedChars;
    if (remaining <= 0 && snippets.length > 0) break;
    if (piece.length > remaining && remaining > 0) {
      piece = piece.slice(0, remaining);
    }
    if (!piece) continue;
    snippets.push({
      chunkId: row.id,
      materialTitle: title,
      content: piece,
      similarity: sim,
    });
    usedChars += piece.length;
  }

  if (snippets.length === 0) return empty;

  return {
    ragMode: "rag",
    snippets,
    retrievalChunkIds: snippets.map((s) => s.chunkId),
  };
}

/** 用于演示模式文案：说明当前是否有 RAG */
export function describeRagSummary(
  ctx: CourseContextPayload,
  retrieval: CourseRagRetrievalResult,
): string {
  const matCount = ctx.materials.length;
  if (retrieval.ragMode === "rag" && retrieval.snippets.length > 0) {
    return `RAG：已注入 ${retrieval.snippets.length} 条高相似片段（课程资料条目共 ${matCount}）。`;
  }
  return `RAG：全文资料降级上下文（课程资料条目 ${matCount}）。`;
}
