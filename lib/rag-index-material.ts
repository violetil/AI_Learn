/**
 * 将课程资料写入 Prisma chunk + Lance 向量（供 chat RAG）。
 */
import { logStructured } from "@/lib/app-log";
import { embedTexts } from "@/lib/embeddings";
import { prisma } from "@/lib/db";
import {
  deleteLanceVectorsForMaterial,
  upsertLanceChunkVectors,
} from "@/lib/rag-lance";
import { splitTextIntoChunks } from "@/lib/text-chunk";

function materialToSearchText(m: {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
}): string {
  const parts = [
    `标题：${m.title.trim()}`,
    m.description?.trim() ? `说明：${m.description.trim()}` : "",
    m.content?.trim() ? `正文：\n${m.content.trim()}` : "",
    m.url?.trim() ? `链接：${m.url.trim()}` : "",
  ].filter(Boolean);
  return parts.join("\n\n");
}

/** 资料变更后重建 chunk 与向量索引（失败则仅记录日志，不抛错阻塞业务） */
export async function syncMaterialKnowledgeIndex(
  materialId: string,
): Promise<void> {
  try {
    const material = await prisma.learningMaterial.findUnique({
      where: { id: materialId },
    });
    if (!material?.courseId) return;

    await prisma.courseKnowledgeChunk.deleteMany({ where: { materialId } });
    await deleteLanceVectorsForMaterial(materialId);

    const corpus = materialToSearchText(material);
    const pieces = splitTextIntoChunks(corpus);
    if (pieces.length === 0) return;

    await prisma.courseKnowledgeChunk.createMany({
      data: pieces.map((content, chunkIndex) => ({
        courseId: material.courseId!,
        materialId,
        sourceKind: "material",
        chunkIndex,
        content,
      })),
    });

    const chunks = await prisma.courseKnowledgeChunk.findMany({
      where: { materialId },
      orderBy: { chunkIndex: "asc" },
      select: { id: true, content: true },
    });

    const embeddings = await embedTexts(chunks.map((c) => c.content));
    if (!embeddings || embeddings.length !== chunks.length) {
      await prisma.courseKnowledgeChunk.deleteMany({ where: { materialId } });
      logStructured("rag_index_embed_failed", { materialId });
      return;
    }

    await upsertLanceChunkVectors(
      chunks.map((c, i) => ({
        chunk_id: c.id,
        course_id: material.courseId!,
        material_id: materialId,
        material_title: material.title,
        vector: Float32Array.from(embeddings[i]),
      })),
    );

    logStructured("rag_index_ok", {
      materialId,
      chunkCount: chunks.length,
    });
  } catch (e) {
    logStructured("rag_index_error", {
      materialId,
      err: e instanceof Error ? e.message : String(e),
    });
  }
}
