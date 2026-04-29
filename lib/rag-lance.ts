import { mkdir } from "node:fs/promises";
import type { Connection, Table } from "@lancedb/lancedb";
import * as lancedb from "@lancedb/lancedb";
import { getLanceDbDirectory, LANCE_COURSE_CHUNKS_TABLE } from "@/lib/rag-config";

export type LanceChunkRecord = {
  chunk_id: string;
  course_id: string;
  material_id: string;
  material_title: string;
  vector: Float32Array;
};

function sqlQuote(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

let dbPromise: Promise<Connection> | null = null;

async function connectDb(): Promise<Connection> {
  if (!dbPromise) {
    const uri = getLanceDbDirectory();
    await mkdir(uri, { recursive: true });
    dbPromise = lancedb.connect(uri);
  }
  return dbPromise;
}

async function openChunksTable(): Promise<Table | null> {
  try {
    const db = await connectDb();
    const names = await db.tableNames();
    if (!names.includes(LANCE_COURSE_CHUNKS_TABLE)) return null;
    const table = await db.openTable(LANCE_COURSE_CHUNKS_TABLE);
    return table;
  } catch {
    return null;
  }
}

/** 是否存在向量表（用于判断是否可走向量检索） */
export async function hasChunksVectorTable(): Promise<boolean> {
  const db = await connectDb();
  const names = await db.tableNames();
  return names.includes(LANCE_COURSE_CHUNKS_TABLE);
}

/** 删除某资料在 Lance 中的向量行（幂等） */
export async function deleteLanceVectorsForMaterial(
  materialId: string,
): Promise<void> {
  const table = await openChunksTable();
  if (!table) return;
  await table.delete(`material_id = ${sqlQuote(materialId)}`);
}

/** 批量写入向量；若表不存在则用首批数据建表 */
export async function upsertLanceChunkVectors(
  rows: LanceChunkRecord[],
): Promise<void> {
  if (rows.length === 0) return;

  const db = await connectDb();
  const names = await db.tableNames();
  const payload = rows.map((r) => ({
    chunk_id: r.chunk_id,
    course_id: r.course_id,
    material_id: r.material_id,
    material_title: r.material_title,
    vector: r.vector,
  }));

  if (!names.includes(LANCE_COURSE_CHUNKS_TABLE)) {
    await db.createTable(LANCE_COURSE_CHUNKS_TABLE, payload);
    return;
  }

  const table = await db.openTable(LANCE_COURSE_CHUNKS_TABLE);
  await table.add(payload);
}

export type VectorHit = {
  chunk_id: string;
  /** Lance cosine distance：similarity ≈ 1 - distance */
  distance: number;
};

/**
 * 课程范围内向量检索。
 * 使用 cosine distance；下游将 similarity = 1 - distance 与阈值比较。
 */
export async function vectorSearchCourseChunks(params: {
  courseId: string;
  queryEmbedding: number[];
  topK: number;
}): Promise<VectorHit[]> {
  const table = await openChunksTable();
  if (!table) return [];

  const vec = Float32Array.from(params.queryEmbedding);
  const q = table
    .vectorSearch(vec)
    .where(`course_id = ${sqlQuote(params.courseId)}`)
    .distanceType("cosine")
    .limit(params.topK);

  const rows = (await q.toArray()) as Array<{
    chunk_id?: string;
    _distance?: number;
  }>;

  return rows
    .map((r) => ({
      chunk_id: String(r.chunk_id ?? ""),
      distance: Number(r._distance ?? 0),
    }))
    .filter((r) => r.chunk_id.length > 0);
}
