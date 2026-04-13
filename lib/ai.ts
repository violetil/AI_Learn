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

export type AssignmentInitialReview = {
  strengths: string[];
  issues: string[];
  suggestions: string[];
  scoreSuggestion: number | null;
};

export type AssignmentReviewResult = {
  review: AssignmentInitialReview;
  model: string;
  mode: "live" | "demo";
  userNotice: string;
  error?: string;
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

export async function generateAssignmentInitialReview(input: {
  courseTitle: string;
  assignmentTitle: string;
  assignmentDescription?: string | null;
  answer: string;
}): Promise<AssignmentReviewResult> {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  if (!key?.trim()) {
    return {
      review: buildDemoAssignmentReview(input.answer),
      model,
      mode: "demo",
      userNotice:
        "当前未配置 AI API，已使用本地演示评语模板完成初评。你仍可正常提交，后续可由教师人工审核。",
    };
  }

  const systemPrompt = [
    "你是教学助理，请对学生作业给出“初步评审”，必须客观、可执行、避免空泛表扬。",
    "输出必须是 JSON 对象，不要输出任何额外文本。",
    "JSON 结构：",
    "{",
    '  "strengths": string[],',
    '  "issues": string[],',
    '  "suggestions": string[],',
    '  "scoreSuggestion": number',
    "}",
    "要求：",
    "- strengths / issues / suggestions 各给 2-4 条，中文、具体、可操作；",
    "- scoreSuggestion 为 0-100 的数字；",
    "- 如果信息不足，也要基于可见内容给审慎建议，不得返回 null。",
  ].join("\n");

  const userPrompt = [
    `课程：${input.courseTitle}`,
    `作业标题：${input.assignmentTitle}`,
    `作业说明：${input.assignmentDescription?.trim() || "（无）"}`,
    "学生提交内容如下：",
    input.answer.slice(0, 16000),
  ].join("\n\n");

  try {
    const baseUrl =
      process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ?? "https://api.openai.com/v1";
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`LLM 请求失败 (${res.status}): ${errText.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    const review = parseReviewFromJsonText(raw);

    return {
      review,
      model,
      mode: "live",
      userNotice: "AI 初评已生成，你可以在教师审核后查看最终反馈。",
    };
  } catch (e) {
    return {
      review: buildDemoAssignmentReview(input.answer),
      model,
      mode: "demo",
      userNotice:
        "AI 服务暂时不可用，系统已回退到演示评语模板，不影响提交与后续教师审核。",
      error: e instanceof Error ? e.message : "AI 初评生成失败",
    };
  }
}

function formatDemoCourseReply(
  ctx: CourseContextPayload,
  userSnippet: string,
): string {
  const titles = ctx.materials.map((m) => m.title).join("、") || "（无资料条目）";
  return `（以下为未调用真实模型时的示例输出，逻辑上仍应「围绕课程」）\n\n课程：「${ctx.courseTitle}」\n可用资料标题：${titles}\n\n针对你的问题摘要：「${userSnippet.slice(0, 200)}」\n请配置 OPENAI_API_KEY 后由模型基于上方 system 中的全文资料作答。`;
}

function parseReviewFromJsonText(text: string): AssignmentInitialReview {
  const fallback: AssignmentInitialReview = {
    strengths: ["提交内容覆盖了题目要求的核心主题。"],
    issues: ["论证细节仍可补充，部分结论缺少依据。"],
    suggestions: ["建议补充关键步骤与示例，提高可验证性。"],
    scoreSuggestion: 75,
  };
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text) as Partial<AssignmentInitialReview>;
    return normalizeReview(parsed, fallback);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(text.slice(start, end + 1)) as Partial<AssignmentInitialReview>;
        return normalizeReview(parsed, fallback);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

function normalizeReview(
  parsed: Partial<AssignmentInitialReview>,
  fallback: AssignmentInitialReview,
): AssignmentInitialReview {
  const strengths = Array.isArray(parsed.strengths)
    ? parsed.strengths.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 6)
    : fallback.strengths;
  const issues = Array.isArray(parsed.issues)
    ? parsed.issues.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 6)
    : fallback.issues;
  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 6)
    : fallback.suggestions;
  const score =
    typeof parsed.scoreSuggestion === "number" && Number.isFinite(parsed.scoreSuggestion)
      ? Math.max(0, Math.min(100, Math.round(parsed.scoreSuggestion)))
      : fallback.scoreSuggestion;
  return {
    strengths: strengths.length ? strengths : fallback.strengths,
    issues: issues.length ? issues : fallback.issues,
    suggestions: suggestions.length ? suggestions : fallback.suggestions,
    scoreSuggestion: score,
  };
}

function buildDemoAssignmentReview(answer: string): AssignmentInitialReview {
  const brief = answer.trim().slice(0, 120);
  return {
    strengths: [
      "已按要求完成作答，具备基本任务完成度。",
      "回答中能看到与题目相关的关键概念。",
    ],
    issues: [
      "论据与推理链条仍可更清晰，部分结论缺少展开。",
      "结构化表达有提升空间，可补充分点与小结。",
    ],
    suggestions: [
      "按“结论-依据-示例”三段式重写核心段落。",
      `围绕当前答案摘要“${brief || "（空）"}”补充 1-2 个具体案例。`,
    ],
    scoreSuggestion: 76,
  };
}
