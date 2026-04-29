import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../node_modules/.prisma/client/default.js";

function sqliteFilePathFromDatabaseUrl(databaseUrl) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("DATABASE_URL must use file: protocol for sqlite");
  }
  const withoutScheme = databaseUrl.replace(/^file:/i, "").replace(/^\/+/, "");
  if (path.isAbsolute(withoutScheme)) return withoutScheme;
  return path.resolve(process.cwd(), withoutScheme);
}

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: sqliteFilePathFromDatabaseUrl(databaseUrl) });
const prisma = new PrismaClient({ adapter });

function normalizeReviewStatus(value) {
  return value === "APPROVED" || value === "REJECTED" ? value : null;
}

function extractLegacyScore(comment) {
  if (!comment) return null;
  const match = comment.match(/最终分数[：:]\s*(\d{1,3})/);
  if (!match) return null;
  const score = Number.parseInt(match[1], 10);
  if (Number.isNaN(score)) return null;
  return Math.max(0, Math.min(100, score));
}

async function main() {
  const assignments = await prisma.assignment.findMany({
    where: { question: null, description: { not: null } },
    select: { id: true, description: true },
  });

  for (const assignment of assignments) {
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { question: assignment.description },
    });
  }

  const records = await prisma.studyRecord.findMany({
    where: { recordType: "ASSIGNMENT_SUBMIT" },
    select: {
      id: true,
      meta: true,
      reviewStatus: true,
      reviewComment: true,
      reviewScore: true,
      reviewedAt: true,
      reviewerId: true,
    },
  });

  for (const record of records) {
    const meta = record.meta && typeof record.meta === "object" && !Array.isArray(record.meta) ? record.meta : null;
    const teacherReview =
      meta && meta.teacherReview && typeof meta.teacherReview === "object" && !Array.isArray(meta.teacherReview)
        ? meta.teacherReview
        : null;
    if (!teacherReview) continue;

    const status = normalizeReviewStatus(teacherReview.status);
    const comment = typeof teacherReview.comment === "string" ? teacherReview.comment : null;
    const reviewedAtRaw = typeof teacherReview.reviewedAt === "string" ? teacherReview.reviewedAt : null;
    const reviewedAt = reviewedAtRaw ? new Date(reviewedAtRaw) : null;
    const reviewerId = typeof teacherReview.reviewerId === "string" ? teacherReview.reviewerId : null;
    const scoreRaw = typeof teacherReview.score === "number" ? teacherReview.score : extractLegacyScore(comment);

    await prisma.studyRecord.update({
      where: { id: record.id },
      data: {
        reviewStatus: record.reviewStatus ?? status,
        reviewComment: record.reviewComment ?? comment,
        reviewScore: record.reviewScore ?? scoreRaw,
        reviewedAt: record.reviewedAt ?? (reviewedAt && !Number.isNaN(reviewedAt.getTime()) ? reviewedAt : null),
        reviewerId: record.reviewerId ?? reviewerId,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Backfill completed.");
  })
  .catch(async (error) => {
    console.error("Backfill failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
