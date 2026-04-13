/**
 * 集中调用 LLM；路由与 UI 不直接请求外部 API。
 * 支持可选「课程上下文」：注入 system prompt，使回答基于课程资料。
 */
import type { CourseContextPayload } from "@/lib/course-context";
import { buildCourseGroundedSystemPrompt } from "@/lib/course-context";

export type ChatTurn = { role: "user" | "assistant" | "system"; content: string };

export type GenerateAssistantOptions = {
  /** 有值时启用「课程 grounded」模式：首条为强约束 system，再拼接对话历史 */
  courseContext?: CourseContextPayload | null;
};

function buildMessagesForApi(
  history: ChatTurn[],
  options?: GenerateAssistantOptions,
): { role: string; content: string }[] {
  const out: { role: string; content: string }[] = [];

  if (options?.courseContext) {
    out.push({
      role: "system",
      content: buildCourseGroundedSystemPrompt(options.courseContext),
    });
  }

  for (const m of history) {
    out.push({ role: m.role, content: m.content });
  }

  return out;
}

export async function generateAssistantReply(
  history: ChatTurn[],
  options?: GenerateAssistantOptions,
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  const lastUser = history.filter((m) => m.role === "user").pop()?.content ?? "";
  const courseMode = Boolean(options?.courseContext);

  if (!key?.trim()) {
    if (courseMode && options?.courseContext) {
      const preview = formatDemoCourseReply(options.courseContext, lastUser);
      return `[演示模式] 未配置 OPENAI_API_KEY。\n\n${preview}`;
    }
    return `[演示模式] 未配置 OPENAI_API_KEY。你刚才说：「${lastUser.slice(0, 500)}」`;
  }

  const baseUrl =
    process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const messages = buildMessagesForApi(history, options);

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: courseMode ? 0.35 : 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`LLM 请求失败 (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("LLM 返回为空");
  }
  return text;
}

function formatDemoCourseReply(
  ctx: CourseContextPayload,
  userSnippet: string,
): string {
  const titles = ctx.materials.map((m) => m.title).join("、") || "（无资料条目）";
  return `（以下为未调用真实模型时的示例输出，逻辑上仍应「围绕课程」）\n\n课程：「${ctx.courseTitle}」\n可用资料标题：${titles}\n\n针对你的问题摘要：「${userSnippet.slice(0, 200)}」\n请配置 OPENAI_API_KEY 后由模型基于上方 system 中的全文资料作答。`;
}
