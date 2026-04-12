import { PrismaClient } from "@prisma/client";

/**
 * Prisma 单例，避免 Next.js 开发热重载时重复创建连接。
 * 业务代码应通过 `import { prisma } from "@/db/client"` 访问数据库。
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
