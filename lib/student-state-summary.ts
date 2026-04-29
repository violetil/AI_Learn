import {
  StudyRecordType,
  UserRole,
} from "../node_modules/.prisma/client/default";
import { prisma } from "@/lib/db";

/**
 * 聚合 StudyRecord 生成简短「学生状态」块；教师返回 null。
 */
export async function buildStudentChatStateSummary(params: {
  userId: string;
  courseId: string;
  role: UserRole;
}): Promise<string | null> {
  if (params.role !== UserRole.STUDENT) return null;

  const rows = await prisma.studyRecord.findMany({
    where: { userId: params.userId, courseId: params.courseId },
    orderBy: { createdAt: "desc" },
    take: 35,
    select: {
      recordType: true,
      eventName: true,
      score: true,
      reviewScore: true,
      reviewComment: true,
      meta: true,
      note: true,
    },
  });

  if (rows.length === 0) {
    return "近期暂无结构化学习记录；可按作业与资料使用情况继续学习。";
  }

  let submissionCount = 0;
  let aiChatHints = 0;
  const weakScores: number[] = [];
  const feedbackHints: string[] = [];

  for (const r of rows) {
    if (r.recordType === StudyRecordType.ASSIGNMENT_SUBMIT) {
      submissionCount++;
      if (typeof r.reviewScore === "number") {
        weakScores.push(r.reviewScore);
      }
      const hint =
        typeof r.reviewComment === "string" && r.reviewComment.trim()
          ? r.reviewComment.trim().slice(0, 120)
          : null;
      if (hint && feedbackHints.length < 3) {
        feedbackHints.push(hint);
      }
    }
    if (r.recordType === StudyRecordType.AI_SESSION && r.eventName === "ai_chat") {
      aiChatHints++;
    }
  }

  const avgReview =
    weakScores.length > 0
      ? Math.round(
          weakScores.reduce((a, b) => a + b, 0) / weakScores.length,
        )
      : null;

  const lines: string[] = [];
  lines.push(`- 近期学习记录条数（抽样）：${rows.length}`);
  if (submissionCount > 0) {
    lines.push(`- 近期作业提交次数（抽样内）：${submissionCount}`);
  }
  if (avgReview !== null) {
    lines.push(
      `- 抽样作业批改均分约：${avgReview}/100（仅作参考，不代表课程总评）`,
    );
  }
  if (feedbackHints.length > 0) {
    lines.push("- 教师反馈摘要：");
    feedbackHints.forEach((t, i) => lines.push(`  ${i + 1}. ${t}`));
  }
  if (aiChatHints > 0) {
    lines.push(`- 使用课程 AI 辅导频次（抽样内会话事件）：${aiChatHints}`);
  }

  return lines.join("\n");
}
