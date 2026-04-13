import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
/** 从生成客户端直接导入，避免 `@prisma/client` 的 `default.d.ts` 对 `.prisma/client` 的类型解析失败 */
import { PrismaClient } from "../node_modules/.prisma/client/default";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function sqliteFilePathFromDatabaseUrl(databaseUrl: string): string {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("DATABASE_URL 须为 SQLite 的 file: 协议地址");
  }
  const withoutScheme = databaseUrl.replace(/^file:/i, "").replace(/^\/+/, "");
  if (path.isAbsolute(withoutScheme)) {
    return withoutScheme;
  }
  // 与当前 Prisma CLI 的 file:./dev.db 解析保持一致：相对项目根目录
  return path.resolve(process.cwd(), withoutScheme);
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("缺少环境变量 DATABASE_URL");
  }
  const filePath = sqliteFilePathFromDatabaseUrl(databaseUrl);
  const adapter = new PrismaBetterSqlite3({ url: filePath });
  return new PrismaClient({ adapter });
}

let prisma: PrismaClient;
prisma = globalForPrisma.prisma ?? createPrismaClient();

export { prisma };

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
