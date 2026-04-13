/**
 * 课程上下文：用于构造「仅基于课程内容」的 system prompt。
 * 与 Prisma 类型解耦，便于单测与在 lib/ai 中复用。
 */
export type CourseMaterialInput = {
  title: string;
  kind: string;
  url: string | null;
  content: string | null;
  position: number;
};

export type CourseContextPayload = {
  courseTitle: string;
  courseDescription: string;
  materials: CourseMaterialInput[];
};

const DEFAULT_MAX_MATERIAL_CHARS = 24_000;

/** 将资料列表格式化为可注入模型的纯文本块（按 position 已假定排好序） */
export function formatMaterialsContextBlock(
  materials: CourseMaterialInput[],
  maxChars = DEFAULT_MAX_MATERIAL_CHARS,
): string {
  if (materials.length === 0) {
    return "（当前课程暂无结构化资料条目。请仅依据下方课程标题与说明作答；无法从课程信息中推断的内容请明确说明「课程资料中未提供」。）";
  }

  const parts: string[] = [];
  let used = 0;
  for (let i = 0; i < materials.length; i++) {
    const m = materials[i];
    const header = `\n### 资料 ${i + 1}：${m.title}（类型：${m.kind}）\n`;
    const body = [
      m.url ? `链接：${m.url}\n` : "",
      m.content ? `正文：\n${m.content}\n` : "",
    ].join("");
    const chunk = header + body;
    if (used + chunk.length > maxChars) {
      parts.push(
        `\n（后续资料因长度限制已截断，共 ${materials.length} 条，仅展示前 ${i} 条完整内容及部分第 ${i + 1} 条。）`,
      );
      break;
    }
    parts.push(chunk);
    used += chunk.length;
  }
  return parts.join("\n---\n");
}

/**
 * 构造强制「基于课程内容」的系统提示词。
 * 模型必须优先且主要依据此处给出的课程信息与资料；不得编造资料中不存在的事实。
 */
export function buildCourseGroundedSystemPrompt(
  ctx: CourseContextPayload,
  maxMaterialChars = DEFAULT_MAX_MATERIAL_CHARS,
): string {
  const materialsBlock = formatMaterialsContextBlock(
    ctx.materials,
    maxMaterialChars,
  );

  return `你是「智能学习辅助系统」中的课程助教，正在辅导一门具体课程。

## 行为准则（必须遵守）
1. 你的回答必须**主要依据**下面「课程信息」与「课程资料」中的内容；用户的问题应结合这些材料解释、归纳或举例。
2. 若问题在提供的资料与课程说明中**找不到依据**，请明确说明「根据当前课程资料无法回答该问题」或「资料中未涉及」，并说明缺什么信息；**禁止**凭常识编造本课程专属事实（如分数规则、考试范围）除非资料中确有记载。
3. 可以作一般性的学习方法建议，但若涉及**本课程政策、知识点结论、作业要求**等，必须以资料为准。
4. 引用资料时请用自然语言概括，无需虚构页码；若多条资料相关，可简要合并表述。

## 课程信息
**标题**：${ctx.courseTitle}
**说明**：${ctx.courseDescription.trim() || "（无补充说明）"}

## 课程资料（权威上下文）
${materialsBlock}
`;
}
