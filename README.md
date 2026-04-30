# AI Learn - 智能学习辅助系统

毕业设计项目，目标是实现一个面向教师与学生的 AI 学习平台，覆盖课程组织、资料管理、作业提交评审、课程上下文聊天与学习记录沉淀。

## 项目概览

- 前端：Next.js 16（App Router）+ React 19 + TypeScript
- 后端：Next.js Route Handlers + Server Actions
- 数据层：Prisma 7 + SQLite（`better-sqlite3`）
- AI：统一从 `lib/ai.ts` 进入，支持普通对话、流式对话、作业初评
- 检索增强：LanceDB + 向量检索（RAG），用于课程资料相关问答
- 认证：Cookie Session + Bearer JWT（API 场景）

## 当前核心能力

- 双角色体系：`TEACHER` / `STUDENT`
- 统一工作台入口：登录后进入 `/dashboard`
- 课程管理：教师建课、学生通过课程码加入课程
- 课程资料库：支持资料维护与课程上下文使用
- 作业闭环：发布作业、学生提交、教师审核
- AI 作业初评：`live`（真实模型）与 `demo`（回退模式）双通道
- 课程 AI 聊天：会话级模型配置、会话重命名/删除、上下文资料计数展示
- 流式聊天接口：SSE 增量返回（`/api/chat/stream`）

## 目录结构（关键部分）

```txt
app/
  page.tsx                                # 落地页
  dashboard/page.tsx                      # 统一工作台入口
  (auth)/                                 # 登录/注册与鉴权 action
  (chat)/chat/                            # 聊天页面与 server action
  (teacher)/teacher/                      # 教师侧页面（课程/作业）
  (student)/student/                      # 学生侧页面（课程/学习）
  api/chat/route.ts                       # 非流式聊天接口
  api/chat/stream/route.ts                # 流式聊天接口（SSE）
  api/dashboard/chat/route.ts             # 会话列表、创建、更新、删除
  api/auth/session/route.ts               # 会话态探测
components/
  dashboard/                              # 工作台核心组件
  landing/                                # 落地页组件
  ui/                                     # 通用 UI 组件
lib/
  ai.ts                                   # LLM 调用统一入口（含 demo 回退）
  chat-pipeline.ts                        # 聊天主流程（写入、鉴权、回复）
  chat-rag-retrieval.ts                   # 课程 RAG 检索与注入
  rag-*.ts                                # 向量索引/检索配置
  auth.ts / authz.ts                      # 认证与权限
prisma/
  schema.prisma                           # 数据模型
docs/
  ai-chat-module-overview.md              # 聊天模块说明
```

## 快速开始

### 1) 安装依赖

```bash
npm install
```

### 2) 配置环境变量

在项目根目录新建 `.env`：

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="replace-with-at-least-32-chars"

# 可选：启用真实大模型
OPENAI_API_KEY=""
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL="deepseek-v4-flash"

# 可选：独立配置 embedding 服务
OPENAI_EMBEDDINGS_BASE_URL=""
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"

# 可选：RAG 调参
RAG_TOP_K="20"
RAG_MIN_SIMILARITY="0.72"
RAG_MAX_SNIPPETS="8"
RAG_MAX_CHARS="12000"
```

> 未配置 `OPENAI_API_KEY` 时，聊天与作业初评会自动进入演示模式（可用但不调用外部模型）。

### 3) 初始化数据库

```bash
npm run db:generate
npm run db:push
```

### 4) 启动开发服务

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 数据模型（概要）

核心模型位于 `prisma/schema.prisma`：

- 用户与身份：`User`
- 课程域：`LearningCourse`、`CourseMember`、`LearningMaterial`
- 作业域：`Assignment`
- 学习记录：`StudyRecord`
- 聊天域：`ChatSession`、`ChatMessage`
- RAG 分块：`CourseKnowledgeChunk`

## API 说明（主要）

- `POST /api/chat`：非流式聊天（写入用户消息并返回 assistant 回复）
- `POST /api/chat/stream`：流式聊天（SSE，`delta` / `done`）
- `GET|POST|PATCH|DELETE /api/dashboard/chat`：会话读取与管理
- `GET /api/auth/session`：当前登录态探测

## 常用脚本

```bash
npm run dev          # 开发环境
npm run build        # 生产构建
npm run start        # 生产启动
npm run lint         # 代码检查
npm test             # Vitest 单测
npx playwright test  # E2E（需先构建并启动）
npm run db:generate  # 生成 Prisma Client
npm run db:push      # 推送 schema 到数据库
npm run db:migrate   # 生成并执行迁移
npm run db:studio    # 打开 Prisma Studio
```

## 质量保障

- CI（GitHub Actions）执行：`lint`、`test`、`build`、`playwright test`
- 当前包含 Vitest 单测与 Playwright smoke 测试

## 相关文档

- 聊天模块说明：`docs/ai-chat-module-overview.md`
- 设计规范：`DESIGN.md`
- 协作规则：`AGENTS.md`
