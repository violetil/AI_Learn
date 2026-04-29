# AI 聊天功能介绍（课程上下文版）

## 1. AI 聊天如何基于课程上下文

工作台右侧聊天的每个会话都绑定 `courseId`。用户发送消息时，服务端会先根据 `sessionId` 查到该会话，再由 `courseId` 读取对应课程信息与课程资料，最后把这些内容拼装为 system prompt 注入给大模型。

核心链路：
- 前端发送消息：`app/api/chat/route.ts`
- 聊天主流程（鉴权、上下文装配、写入消息）：`lib/chat-pipeline.ts`
- 课程资料上下文转换：`lib/chat-course-context.ts`
- 课程 system prompt 构建：`lib/course-context.ts`

因此，AI 回答不是“裸聊”，而是会优先围绕当前课程资料和课程目标进行回答。

## 2. AI 会话如何基于课程资料（新增资料是否自动加入）

当前方案是“实时查库注入”而不是离线缓存：

1. 每次聊天请求都会重新查询该课程下的资料（`LearningMaterial`）。
2. 查询结果会在当次请求中转成 prompt 上下文。
3. 模型基于这个最新上下文作答。

这意味着：**新增资料会在后续聊天请求中自动进入上下文**，不需要手工刷新 embedding 或重建索引。

补充：右侧栏会显示“上下文资料数量”，用于让用户感知当前上下文规模。

## 3. 大语言模型 API 放在哪里，应用如何调用

### API 放置位置

模型调用统一放在服务端：
- 统一入口：`lib/ai.ts`
- 模型白名单与默认模型：`lib/ai-models.ts`

前端组件不会直接调用第三方大模型 API，避免泄露 key。

### 调用方式（应用内部）

1. 前端右侧栏调用内部接口（`/api/chat`、`/api/dashboard/chat`）。
2. `/api/chat` 把消息交给 `appendUserMessageAndGetAssistantReply()`。
3. pipeline 读取会话模型（`ChatSession.model`）+ 课程上下文，调用 `generateAssistantReply()`。
4. 生成结果后写入 `ChatMessage`（assistant），并返回给前端。

### 输入与输出

- 输入：
  - 用户消息文本
  - 会话 ID（决定使用哪个课程、哪个模型）
  - 历史消息（最多保留窗口内历史）
  - 课程资料上下文（由服务端实时查库注入）
- 输出：
  - assistant 文本回复
  - 会话元信息（当前模型、会话列表、上下文资料数量）通过 `/api/dashboard/chat` 返回

### 前端展示方式

右侧栏按角色渲染消息气泡（USER/ASSISTANT），并展示：
- 当前会话标题
- 当前会话模型
- 上下文资料数量
- 历史会话列表（可切换/重命名/删除）

## 4. 本次优化后新增能力（摘要）

- 会话级模型切换（每个会话可独立设置模型）
- 历史会话重命名
- 历史会话硬删除（会话与消息一并删除）
- 聊天接口统一支持 `GET/POST/PATCH/DELETE` 管理会话
- 课程资料上下文可视化（资料数量 + 当前模型）
