import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma CLI（Migrate / Studio 等）使用的连接配置。
 * Prisma 7 起连接 URL 放在此处，schema.prisma 的 datasource 仅声明 provider。
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
