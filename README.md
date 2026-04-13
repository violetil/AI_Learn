# AI Learn - 智能学习辅助系统

毕业设计项目：面向教师与学生双角色的智能学习辅助平台。  
核心目标是构建“课程管理 + 作业闭环 + AI 辅助学习与评审”的可运行系统。

## 技术栈

- Next.js 16（App Router）+ TypeScript
- Prisma 7 + SQLite（`better-sqlite3` adapter）
- Tailwind CSS
- 认证：Server Actions + Cookie Session
- AI：统一由 `lib/ai.ts` 调用（页面/组件不直接调用外部模型）

## 项目结构

```txt
app/
  (chat)/chat/                          # 聊天页面与 server action
  (student)/student/                    # 学生端页面
  (teacher)/teacher/                    # 教师端页面
  api/chat/route.ts                     # 聊天 route handler（与 action 复用 pipeline）
components/
  ui/                                   # 通用 UI 组件
lib/
  ai.ts                                 # AI 统一调用入口（含演示回退）
  auth.ts / authz.ts                    # 会话与权限
  chat-pipeline.ts                      # 聊天写入与回复生成
  course-access.ts                      # 课程访问控制
prisma/
  schema.prisma                         # 数据模型定义
```

## 本地运行

1. 安装依赖

```bash
npm install
```

2. 配置环境变量（参考下文）

3. 生成 Prisma Client 并同步数据库

```bash
npm run db:generate
npm run db:push
```

4. 启动开发环境

```bash
npm run dev
```

5. 访问 [http://localhost:3000](http://localhost:3000)

## 环境变量

`.env` 至少需要：

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="your-session-secret"
```

可选（启用真实 AI）：

```env
OPENAI_API_KEY="..."
OPENAI_MODEL="gpt-4o-mini"
OPENAI_BASE_URL="https://api.openai.com/v1"
```

> 未配置 `OPENAI_API_KEY` 时，系统会自动进入演示模式：流程可正常完成，不会报错，并给出明确提示。

## 核心功能现状

### 1. 角色与权限

- 用户角色：`TEACHER` / `STUDENT`
- 注册可选角色，登录后按角色跳转：
  - 教师：`/teacher`
  - 学生：`/student`
- 权限工具：`lib/authz.ts`（`requireRole`）

### 2. 课程加入闭环

- 教师创建课程（`LearningCourse`，含 `courseCode`）
- 学生用课程码加入课程（`CourseMember`）
- 教师/学生均可查看自己的课程

### 3. 作业闭环（最小可用）

- 教师在课程详情发布作业（`Assignment`）
- 学生查看已发布作业并提交
- 提交写入 `StudyRecord`（`recordType=ASSIGNMENT_SUBMIT`）

### 4. AI 作业初评（双模式）

- 学生提交后触发 AI 初评，写入 `StudyRecord.meta.aiReview`
- 结构字段：`strengths`、`issues`、`suggestions`、`scoreSuggestion`
- 模式：
  - `live`：配置 API key 后调用真实模型
  - `demo`：未配置或调用失败时自动回退，不影响提交

### 5. 教师审核页

- 路径：`/teacher/courses/[courseId]/assignments/[assignmentId]`
- 可查看学生提交与 AI 初评
- 可确认/驳回并写入评语，保存到 `StudyRecord.meta.teacherReview`

### 6. 课程聊天与权限

- 聊天页支持课程上下文：`/chat?courseId=...`
- 权限已收口：仅课程 owner 或课程成员可进入课程上下文聊天

## 数据模型（核心）

位于 `prisma/schema.prisma`：

- `User`（含 `role`）
- `LearningCourse`
- `CourseMember`
- `LearningMaterial`
- `Assignment`
- `StudyRecord`
- `ChatSession` / `ChatMessage`

## 常用脚本

```bash
npm run dev          # 启动开发服务
npm run build        # 生产构建
npm run lint         # ESLint 检查
npm run db:generate  # Prisma Client 生成
npm run db:push      # 同步 schema 到数据库
npm run db:studio    # 打开 Prisma Studio
```

## 当前里程碑与下一步

已完成：

- 角色权限、课程加入、资料管理、作业提交闭环
- 课程聊天上下文与权限校验
- AI 作业初评双模式
- 教师审核页最小闭环

下一步建议：

- 教师审核结果在学生端可见（结果回传）
- 作业维度的提交历史筛选与分页
- 课程学习分析面板（基于 `StudyRecord` 聚合）
