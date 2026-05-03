# AI Learn 论文-项目证据映射清单

本文档用于将 `thesis.tex` 的核心论述与项目中的可验证实现建立一一映射，便于论文定稿与答辩追溯。

## 第1章 绪论

- 研究背景与项目定位
  - 证据：`README.md`（毕业设计目标、系统定位、核心能力）
- 研究内容（课程、作业、聊天、学习记录）
  - 证据：`README.md` 的“当前核心能力”与“数据模型（概要）”

## 第2章 相关研究与技术基础

- 技术选型（Next.js/TypeScript/Prisma/SQLite/RAG/LanceDB）
  - 证据：`README.md` 项目概览、`package.json` 依赖、`prisma/schema.prisma` 模型定义
- 工程化质量保障（lint/test/build/e2e）
  - 证据：`.github/workflows/ci.yml`、`package.json` scripts

## 第3章 系统需求分析

- 双角色协同需求（TEACHER/STUDENT）
  - 证据：`prisma/schema.prisma` 中 `UserRole` 与 `CourseMemberRole`
- 教学闭环功能需求（课程、资料、作业、聊天、记录）
  - 证据：`prisma/schema.prisma` 中 `LearningCourse`、`LearningMaterial`、`Assignment`、`ChatSession`、`StudyRecord`
- 非功能目标（鉴权、可用性、可维护、可测试）
  - 证据：`lib/auth.ts`（Cookie+Bearer）、`.github/workflows/ci.yml`（CI 门禁）

## 第4章 系统总体设计

- 分层架构（表示层/接口层/业务层/数据层/AI层）
  - 证据：`README.md` 目录结构与 `app/api/*`、`lib/*`、`prisma/*` 分层
- 核心接口设计
  - 证据：`app/api/chat/route.ts`、`app/api/chat/stream/route.ts`、`app/api/dashboard/chat/route.ts`
- 数据模型设计
  - 证据：`prisma/schema.prisma` 全量实体与关系
- 权限与安全设计
  - 证据：`lib/auth.ts`、`lib/chat-pipeline.ts`（`canAccessCourseChat`）

## 第5章 关键模块设计与实现

- 统一 AI 调用链路与回退机制
  - 证据：`lib/ai.ts`（`generateAssistantReply`、`streamAssistantReply`、demo 回退分支）
- 课程上下文 RAG 编排
  - 证据：`lib/chat-rag-retrieval.ts`（Top-K、阈值过滤、字符预算）、`lib/chat-pipeline.ts`（检索结果注入）
- 聊天时序与会话管理
  - 证据：`app/api/chat/route.ts`、`app/api/chat/stream/route.ts`、`lib/chat-pipeline.ts`
- 作业初评与教师审核闭环
  - 证据：`lib/ai.ts`（`generateAssignmentInitialReview`）、`prisma/schema.prisma`（`StudyRecord.reviewStatus` 等字段）

## 第6章 系统测试与结果分析

- 静态检查、单测、构建、E2E
  - 证据：`.github/workflows/ci.yml`、`package.json` scripts、`e2e/smoke.spec.ts`
- 课程聊天相关正确性与权限验证
  - 证据：`lib/chat-pipeline.ts`（会话归属、课程访问、失败回滚）
- RAG 价值验证（对比实验）
  - 证据：`lib/chat-rag-retrieval.ts` 与实验日志（后续生成于 `docs/thesis-experiment-log.md`）

## 第7章 总结与展望

- 系统成果与工程边界
  - 证据：前述模块实现、CI 能力、当前数据与部署形态（SQLite + LanceDB）
- 后续扩展方向（多模态、学习画像、自适应推荐）
  - 证据：现有模型与流程可扩展点（`StudyRecord.meta`、RAG 组件、AI pipeline）

## 答辩追溯建议

- 论文中的每个“实现性结论”旁保留一个 `证据来源`（文件路径或实验日志编号）。
- 第6章所有数值同时在 `docs/thesis-experiment-log.md` 中记录采样方法、样本数与执行时间。
- 附录接口示例与 `app/api/*` 保持一致，避免命名与参数漂移。
