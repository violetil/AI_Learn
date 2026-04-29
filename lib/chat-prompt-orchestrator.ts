import type { CourseContextPayload } from "@/lib/course-context";
import { formatMaterialsContextBlock } from "@/lib/course-context";

export type RagSnippet = {
  chunkId: string;
  materialTitle: string;
  content: string;
  similarity: number;
};

/** 对话发起者在系统中的角色（用于 Prompt 分流） */
export type CourseChatViewerRole = "TEACHER" | "STUDENT";

export type CourseChatOrchestration = {
  viewerRole: CourseChatViewerRole;
  ragSnippets: RagSnippet[];
  /** 学生个人学习概况（仅学生端展示） */
  studentStateSummary: string | null;
  /** 班级/课程运营概况（仅教师端且有管理权限时） */
  teacherCourseSummary: string | null;
  ragMode: "rag" | "fallback";
};

const DEFAULT_FALLBACK_MATERIAL_CHARS = 24_000;

const TONE_CLOSER =
  "## 表达风格\n使用自然、易懂的书面中文；称呼对方为「你」。不要用公文腔或客服模板句；不要刻意每条回复都以「根据课程资料」开头或收尾。";

const STUDENT_INTRO = `你是「智能学习辅助系统」中的**课程助教**，当前谈话对象为**本课程的在读学生**。
你的侧重点：讲清知识点与思路、给出可操作的练习/复习步骤、鼓励学生提问；语气友好、清晰，像面对面的助教而非宣读条文。`;

const TEACHER_INTRO = `你是「智能学习辅助系统」中的**课程教学助理**，当前谈话对象为**本课程的任课/管理教师**。
你的侧重点：协助梳理课程资料与大纲结构、作业与教学活动的设计建议、结合下方统计数据观察班级活跃度与风险点；语气专业、简洁，像同事的教研助手。
你不要代替教师做最终成绩评定或官方政策裁决；涉及敏感结论时请提示「需教师自行确认」。`;

const STUDENT_RULES = `## 行为准则（必须遵守）
1. 回答应**实质性地利用**下方课程信息与资料内容；融入叙述即可，**避免**机械重复「根据课程资料」「如上所述」等套话。
2. 若资料中**确实没有**与用户问题相关的依据：简短说明「这门课现有资料里还没写到这一点」，并可提示缺什么信息；不要编造本课程专属规则（分数、考试范围等）。
3. 涉及**本课程政策、知识点结论、作业要求**等高风险表述时，若资料有提及可自然带过一句依据；若不确定请承认不确定并建议查看大纲/公告。
4. 引用资料时用自然语言概括即可，不必标注虚构页码或逐条汇报「片段编号」。`;

const TEACHER_RULES = `## 行为准则（必须遵守）
1. 回答应结合下方**班级概况统计**、课程信息与资料；用简洁要点与可操作建议组织内容，避免空话与模板式免责声明。
2. 统计数据不足以支撑细粒度结论时，明确说明「统计仅为抽样/聚合」，避免臆测个别学生行为。
3. **不要编造**系统未提供的明细（如具体学生姓名、逐人分数）；资料未载明的事项请如实说明。
4. 协助优化教学管理与课程运营时，保持中立、专业；最终决策权始终在教师。`;

function formatRagSection(snippets: RagSnippet[]): string {
  if (snippets.length === 0) {
    return "（本次检索未命中足够相关的片段；请结合下方全文课程资料作答，或说明资料缺口。）";
  }
  const lines = snippets.map((s, i) => {
    return `### ${i + 1}. ${s.materialTitle}\n${s.content}`;
  });
  return lines.join("\n\n---\n\n");
}

function formatStudentContextSection(summary: string | null): string {
  if (!summary?.trim()) {
    return "（暂无结构化个人学习摘要；结合课程资料与对话作答即可。）";
  }
  return summary.trim();
}

function formatTeacherContextSection(summary: string | null): string {
  if (!summary?.trim()) {
    return "（暂无班级聚合统计（可能无管理权限或尚无学习记录）。）";
  }
  return summary.trim();
}

/**
 * 编排课程助教 system prompt：按师生角色分流准则与概况区块。
 */
export function buildOrchestratedCourseSystemPrompt(input: {
  ctx: CourseContextPayload;
  viewerRole: CourseChatViewerRole;
  ragSnippets: RagSnippet[];
  studentStateSummary: string | null;
  teacherCourseSummary: string | null;
  ragMode: "rag" | "fallback";
  fallbackMaterialMaxChars?: number;
}): string {
  const maxMat =
    input.fallbackMaterialMaxChars ?? DEFAULT_FALLBACK_MATERIAL_CHARS;

  const materialsSection =
    input.ragMode === "rag" && input.ragSnippets.length > 0
      ? `## 检索到的课程片段（按语义相关性筛选）
${formatRagSection(input.ragSnippets)}`
      : `## 课程资料（全文上下文，可能截断）
${formatMaterialsContextBlock(input.ctx.materials, maxMat)}`;

  const intro = input.viewerRole === "TEACHER" ? TEACHER_INTRO : STUDENT_INTRO;
  const rules = input.viewerRole === "TEACHER" ? TEACHER_RULES : STUDENT_RULES;

  const contextSection =
    input.viewerRole === "TEACHER"
      ? `## 班级与课程活动概况（仅供参考）
${formatTeacherContextSection(input.teacherCourseSummary)}`
      : `## 个人学习概况（仅供参考）
${formatStudentContextSection(input.studentStateSummary)}`;

  return `${intro}

${rules}

${TONE_CLOSER}

## 课程信息
**标题**：${input.ctx.courseTitle}
**说明**：${input.ctx.courseDescription.trim() || "（无补充说明）"}

${contextSection}

${materialsSection}
`;
}
