import {
  CourseMemberRole,
  StudyRecordType,
  UserRole,
} from "../node_modules/.prisma/client/default";
import { getTeacherOwnedCourse } from "@/lib/course-access";
import { prisma } from "@/lib/db";

const RECENT_DAYS = 30;

async function canManageCourseForStats(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const owned = await getTeacherOwnedCourse(userId, courseId);
  if (owned) return true;
  const staff = await prisma.courseMember.findFirst({
    where: {
      courseId,
      userId,
      role: { in: [CourseMemberRole.OWNER, CourseMemberRole.ASSISTANT] },
    },
    select: { id: true },
  });
  return Boolean(staff);
}

function recordTypeLabel(t: StudyRecordType): string {
  switch (t) {
    case StudyRecordType.MATERIAL_VIEW:
      return "资料浏览";
    case StudyRecordType.ASSIGNMENT_START:
      return "作业开始";
    case StudyRecordType.ASSIGNMENT_SUBMIT:
      return "作业提交";
    case StudyRecordType.AI_SESSION:
      return "AI 辅导会话";
    case StudyRecordType.COURSE_PROGRESS:
      return "课程进度";
    case StudyRecordType.QUIZ:
      return "测验";
    default:
      return "其他";
  }
}

/**
 * 为教师端聊天注入班级级聚合指标（不含学生姓名与个人分数明细）。
 */
export async function buildTeacherCourseChatSummary(params: {
  userId: string;
  courseId: string;
  role: UserRole;
}): Promise<string | null> {
  if (params.role !== UserRole.TEACHER) return null;

  const allowed = await canManageCourseForStats(params.userId, params.courseId);
  if (!allowed) {
    return "当前账号对本课程无管理权限，不提供班级聚合统计。仍可依据课程资料回答问题。";
  }

  const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);

  const [studentMemberCount, materialCount, assignmentPublishedCount] =
    await Promise.all([
      prisma.courseMember.count({
        where: { courseId: params.courseId, role: CourseMemberRole.STUDENT },
      }),
      prisma.learningMaterial.count({
        where: { courseId: params.courseId },
      }),
      prisma.assignment.count({
        where: { courseId: params.courseId, published: true },
      }),
    ]);

  const grouped = await prisma.studyRecord.groupBy({
    by: ["recordType"],
    where: {
      courseId: params.courseId,
      createdAt: { gte: since },
    },
    _count: { id: true },
  });

  const submitters = await prisma.studyRecord.groupBy({
    by: ["userId"],
    where: {
      courseId: params.courseId,
      recordType: StudyRecordType.ASSIGNMENT_SUBMIT,
    },
    _count: { id: true },
  });
  const distinctSubmitters = submitters.length;

  const submissionRatePct =
    studentMemberCount > 0
      ? Math.round((distinctSubmitters / studentMemberCount) * 100)
      : null;

  const lines: string[] = [];
  lines.push("- 统计口径说明：以下为全课聚合数据，不含具体学生姓名。");
  lines.push(`- 在读学生人数（CourseMember 学生角色）：${studentMemberCount}`);
  lines.push(`- 课程资料条数：${materialCount}`);
  lines.push(`- 已发布作业数：${assignmentPublishedCount}`);
  lines.push(`- 曾有作业提交记录的去重学生数（历史累计）：${distinctSubmitters}`);
  if (submissionRatePct !== null) {
    lines.push(
      `- 粗略提交覆盖率（有提交记录人数 / 在读学生）：约 ${submissionRatePct}%（未提交不代表未选课活跃）`,
    );
  }
  lines.push(`- 近 ${RECENT_DAYS} 天学习事件计数（按类型）：`);
  const sorted = [...grouped].sort((a, b) => b._count.id - a._count.id);
  if (sorted.length === 0) {
    lines.push("  （该时段暂无 StudyRecord）");
  } else {
    for (const row of sorted) {
      lines.push(
        `  - ${recordTypeLabel(row.recordType)}：${row._count.id} 次`,
      );
    }
  }

  return lines.join("\n");
}
