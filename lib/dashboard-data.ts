import type { LibraryItem, StudentAssignmentStatus, UserRole } from "@/components/dashboard/library-types";
import { resolveDefaultChatModel } from "@/lib/ai-models";
import { prisma } from "@/lib/db";

type OverviewCard = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  due?: string;
};

type DashboardOverviewData = {
  recentItems: OverviewCard[];
  materials: OverviewCard[];
  assignments: OverviewCard[];
  courseUpdate: string;
};

type DashboardChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
};

type DashboardChatSession = {
  id: string;
  title: string;
  model: string;
  updatedAtLabel: string;
};

type DashboardChatData = {
  sessionId: string;
  activeModel: string;
  contextMaterialCount: number;
  sessions: DashboardChatSession[];
  initialMessages: DashboardChatMessage[];
};

type DashboardCourseData = {
  overview: DashboardOverviewData;
  libraryItems: LibraryItem[];
  chat: DashboardChatData | null;
  learningAnalytics: DashboardLearningAnalytics | null;
};

type SummaryCard = {
  label: string;
  value: string;
  hint: string;
};

type DashboardLearningAnalytics = {
  roleView: "TEACHER" | "STUDENT";
  summaryCards: SummaryCard[];
  trend: Array<{ day: string; minutes: number; submissions: number; aiSessions: number }>;
  behaviorBreakdown: Array<{ name: string; value: number }>;
  topLearners?: Array<{ name: string; minutes: number; submissions: number }>;
  personalTimeline?: Array<{ time: string; event: string; detail: string }>;
};

function formatShortDate(date: Date | null | undefined): string {
  if (!date) return "-";
  return date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

function mapStudentStatusFromRecord(
  record: { meta: unknown; reviewStatus: "APPROVED" | "REJECTED" | null } | null,
): StudentAssignmentStatus {
  if (!record) return "Not Started";
  if (record.reviewStatus) return "Graded";
  if (
    record.meta &&
    typeof record.meta === "object" &&
    !Array.isArray(record.meta) &&
    "teacherReview" in record.meta &&
    record.meta.teacherReview &&
    typeof record.meta.teacherReview === "object"
  ) {
    return "Graded";
  }
  return "Submitted";
}

function parseMeta(meta: unknown): {
  teacherReviewStatus: "APPROVED" | "REJECTED" | null;
  teacherReviewComment: string | null;
  aiReview: LibraryItem["aiReview"];
} {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return {
      teacherReviewStatus: null,
      teacherReviewComment: null,
      aiReview: null,
    };
  }

  const obj = meta as Record<string, unknown>;
  const teacherReviewRaw =
    obj.teacherReview && typeof obj.teacherReview === "object" && !Array.isArray(obj.teacherReview)
      ? (obj.teacherReview as Record<string, unknown>)
      : null;
  const aiReviewRaw =
    obj.aiReview && typeof obj.aiReview === "object" && !Array.isArray(obj.aiReview)
      ? (obj.aiReview as Record<string, unknown>)
      : null;

  return {
    teacherReviewStatus:
      teacherReviewRaw?.status === "APPROVED" || teacherReviewRaw?.status === "REJECTED"
        ? (teacherReviewRaw.status as "APPROVED" | "REJECTED")
        : null,
    teacherReviewComment:
      typeof teacherReviewRaw?.comment === "string" ? teacherReviewRaw.comment : null,
    aiReview: aiReviewRaw
      ? {
          scoreSuggestion:
            typeof aiReviewRaw.scoreSuggestion === "number" ? aiReviewRaw.scoreSuggestion : null,
          strengths: Array.isArray(aiReviewRaw.strengths)
            ? aiReviewRaw.strengths.filter((item): item is string => typeof item === "string")
            : [],
          issues: Array.isArray(aiReviewRaw.issues)
            ? aiReviewRaw.issues.filter((item): item is string => typeof item === "string")
            : [],
          suggestions: Array.isArray(aiReviewRaw.suggestions)
            ? aiReviewRaw.suggestions.filter((item): item is string => typeof item === "string")
            : [],
          mode: typeof aiReviewRaw.mode === "string" ? aiReviewRaw.mode : undefined,
          model: typeof aiReviewRaw.model === "string" ? aiReviewRaw.model : undefined,
        }
      : null,
  };
}

function parseReviewScore(reviewComment: string | null): number | null {
  if (!reviewComment) return null;
  const match = reviewComment.match(/最终分数[：:]\s*(\d{1,3})/);
  if (!match) return null;
  const score = Number.parseInt(match[1], 10);
  if (Number.isNaN(score)) return null;
  return Math.min(100, Math.max(0, score));
}

function formatDay(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${month}-${day}`;
}

function formatMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)} 分钟`;
}

export async function getDashboardCourseData({
  userId,
  userRole,
  courseId,
}: {
  userId: string;
  userRole: UserRole;
  courseId: string;
}): Promise<DashboardCourseData> {
  const course = await prisma.learningCourse.findUnique({
    where: { id: courseId },
    select: { title: true },
  });
  if (!course) {
    return {
      overview: {
        recentItems: [],
        materials: [],
        assignments: [],
        courseUpdate: "课程不存在或你没有访问权限。",
      },
      libraryItems: [],
      chat: null,
      learningAnalytics: null,
    };
  }

  const now = new Date();
  const assignmentWhere =
    userRole === "STUDENT" ? { courseId, published: true } : { courseId };

  const [materials, assignments, records, submissions, recentStudyRecords, studentMembers, analyticsRecords] =
    await Promise.all([
    prisma.learningMaterial.findMany({
      where: { courseId },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.assignment.findMany({
      where: assignmentWhere,
      include: { creator: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.studyRecord.findMany({
      where: {
        courseId,
        recordType: "ASSIGNMENT_SUBMIT",
        assignmentId: { not: null },
        ...(userRole === "STUDENT" ? { userId } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        assignmentId: true,
        note: true,
        meta: true,
        reviewStatus: true,
        reviewComment: true,
        reviewScore: true,
        reviewedAt: true,
        createdAt: true,
      },
    }),
    prisma.studyRecord.findMany({
      where: {
        courseId,
        recordType: "ASSIGNMENT_SUBMIT",
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        assignmentId: true,
        note: true,
        meta: true,
        reviewStatus: true,
        reviewComment: true,
        reviewScore: true,
        reviewedAt: true,
        createdAt: true,
        assignment: { select: { id: true, title: true } },
      },
    }),
    prisma.studyRecord.findMany({
      where: {
        userId,
        courseId,
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        assignment: { select: { id: true, title: true } },
        material: { select: { id: true, title: true } },
      },
    }),
    prisma.courseMember.findMany({
      where: { courseId, role: "STUDENT" },
      select: { userId: true, user: { select: { name: true, email: true } } },
    }),
    prisma.studyRecord.findMany({
      where: {
        courseId,
        ...(userRole === "STUDENT" ? { userId } : {}),
      },
      orderBy: { createdAt: "asc" },
      select: {
        userId: true,
        recordType: true,
        eventName: true,
        source: true,
        durationSec: true,
        score: true,
        note: true,
        createdAt: true,
      },
    }),
  ]);

  const latestSubmissionByAssignment = new Map<string, (typeof records)[number]>();
  for (const record of records) {
    if (!record.assignmentId || latestSubmissionByAssignment.has(record.assignmentId)) continue;
    latestSubmissionByAssignment.set(record.assignmentId, record);
  }

  const teacherLatestByAssignment = new Map<string, (typeof submissions)[number]>();
  for (const record of submissions) {
    if (!record.assignmentId || teacherLatestByAssignment.has(record.assignmentId)) continue;
    teacherLatestByAssignment.set(record.assignmentId, record);
  }

  const libraryMaterialItems: LibraryItem[] = materials.map((material) => ({
    id: material.id,
    courseId,
    name: material.title,
    icon: "📄",
    course: course.title,
    createdBy: "课程资料",
    createdAt: material.createdAt.toLocaleDateString(),
    lastEdited: material.updatedAt.toLocaleDateString(),
    type: "material",
    description: material.description || material.content || material.url || "暂无描述",
    materialContent: material.content,
    materialUrl: material.url,
  }));

  const libraryAssignmentItems: LibraryItem[] = assignments.map((assignment) => {
    const submission =
      userRole === "STUDENT"
        ? latestSubmissionByAssignment.get(assignment.id) ?? null
        : teacherLatestByAssignment.get(assignment.id) ?? null;
    const parsed = parseMeta(submission?.meta ?? null);
    const status =
      userRole === "STUDENT"
        ? mapStudentStatusFromRecord(submission)
        : submission && (submission.reviewStatus || parsed.teacherReviewStatus)
          ? "Graded"
          : "Not Started";

    return {
      id: assignment.id,
      courseId,
      name: assignment.title,
      icon: "✓",
      course: course.title,
      createdBy: assignment.creator.name || assignment.creator.email,
      createdAt: assignment.createdAt.toLocaleDateString(),
      status,
      dueDate: formatShortDate(assignment.dueAt),
      lastEdited: assignment.updatedAt.toLocaleDateString(),
      type: "assignment",
      description: assignment.description || assignment.question || "暂无作业说明",
      question: assignment.question || assignment.description,
      submissionRecordId: submission?.id,
      submissionAnswer: submission?.note || "",
      teacherReviewStatus: submission?.reviewStatus || parsed.teacherReviewStatus,
      teacherReviewComment: submission?.reviewComment || parsed.teacherReviewComment,
      teacherReviewScore: submission?.reviewScore ?? parseReviewScore(parsed.teacherReviewComment),
      reviewedAt: submission?.reviewedAt ? submission.reviewedAt.toISOString() : null,
      aiReview: parsed.aiReview,
    };
  });

  const recentItems: OverviewCard[] = recentStudyRecords.map((record) => ({
    id: record.id,
    title:
      record.assignment?.title || record.material?.title || "学习记录",
    subtitle:
      record.note?.slice(0, 60) || "继续你的学习进度。",
    meta: `${record.updatedAt.toLocaleDateString()} 更新`,
  }));

  const overviewMaterials: OverviewCard[] = materials.slice(0, 6).map((material) => ({
    id: `m-${material.id}`,
    title: material.title,
    subtitle: material.description || material.content?.slice(0, 48) || "课程资料",
    meta: `更新于 ${material.updatedAt.toLocaleDateString()}`,
  }));

  const overviewAssignments: OverviewCard[] = assignments.slice(0, 6).map((assignment) => ({
    id: `a-${assignment.id}`,
    title: assignment.title,
    subtitle: assignment.question || assignment.description || "完成后可获得 AI 初评与教师反馈。",
    meta: userRole === "STUDENT" ? "作业任务" : "教学任务",
    due: formatShortDate(assignment.dueAt),
  }));

  const activeAssignmentCount = assignments.filter(
    (assignment) => assignment.dueAt && assignment.dueAt > now,
  ).length;

  const studentIdSet = new Set(studentMembers.map((member) => member.userId));
  const analyticsBaseRecords =
    userRole === "TEACHER"
      ? analyticsRecords.filter((record) => studentIdSet.has(record.userId))
      : analyticsRecords;

  const dayBuckets = new Map<string, { minutes: number; submissions: number; aiSessions: number }>();
  for (const record of analyticsBaseRecords) {
    const key = formatDay(record.createdAt);
    const bucket = dayBuckets.get(key) ?? { minutes: 0, submissions: 0, aiSessions: 0 };
    bucket.minutes += Math.max(0, record.durationSec ?? 0) / 60;
    if (record.recordType === "ASSIGNMENT_SUBMIT") bucket.submissions += 1;
    if (record.recordType === "AI_SESSION") bucket.aiSessions += 1;
    dayBuckets.set(key, bucket);
  }
  const trend = Array.from(dayBuckets.entries())
    .slice(-14)
    .map(([day, value]) => ({
      day,
      minutes: Math.round(value.minutes),
      submissions: value.submissions,
      aiSessions: value.aiSessions,
    }));

  const behaviorBreakdown = [
    {
      name: "资料浏览",
      value: analyticsBaseRecords.filter(
        (record) => record.recordType === "MATERIAL_VIEW" || record.eventName === "material_view",
      ).length,
    },
    {
      name: "作业开始",
      value: analyticsBaseRecords.filter(
        (record) => record.recordType === "ASSIGNMENT_START" || record.eventName === "assignment_start",
      ).length,
    },
    {
      name: "作业提交",
      value: analyticsBaseRecords.filter((record) => record.recordType === "ASSIGNMENT_SUBMIT").length,
    },
    {
      name: "AI 使用",
      value: analyticsBaseRecords.filter((record) => record.recordType === "AI_SESSION").length,
    },
  ];

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const uniqueActive7d = new Set(
    analyticsBaseRecords
      .filter((record) => record.createdAt >= sevenDaysAgo)
      .map((record) => record.userId),
  ).size;
  const uniqueActive30d = new Set(
    analyticsBaseRecords
      .filter((record) => record.createdAt >= thirtyDaysAgo)
      .map((record) => record.userId),
  ).size;

  const totalDurationSec = analyticsBaseRecords.reduce(
    (accumulator, record) => accumulator + Math.max(0, record.durationSec ?? 0),
    0,
  );
  const scoreSamples = records
    .map((record) => record.reviewScore)
    .filter((score): score is number => typeof score === "number");
  const avgScore = scoreSamples.length
    ? Math.round(scoreSamples.reduce((sum, score) => sum + score, 0) / scoreSamples.length)
    : null;

  const learningAnalytics: DashboardLearningAnalytics =
    userRole === "TEACHER"
      ? {
          roleView: "TEACHER",
          summaryCards: [
            {
              label: "活跃学生（7天）",
              value: `${uniqueActive7d}`,
              hint: `近30天活跃 ${uniqueActive30d} 人`,
            },
            {
              label: "人均学习时长",
              value:
                studentMembers.length > 0
                  ? formatMinutes(Math.round(totalDurationSec / Math.max(studentMembers.length, 1)))
                  : "0 分钟",
              hint: "按课程内学生人数计算",
            },
            {
              label: "作业提交率",
              value: assignments.length
                ? `${Math.round((records.length / Math.max(assignments.length * Math.max(studentMembers.length, 1), 1)) * 100)}%`
                : "0%",
              hint: "提交数 / (作业数*学生数)",
            },
            {
              label: "平均得分",
              value: avgScore !== null ? `${avgScore} / 100` : "-",
              hint: "按已批改作业统计",
            },
          ],
          trend,
          behaviorBreakdown,
          topLearners: studentMembers
            .map((member) => {
              const memberRecords = analyticsBaseRecords.filter((record) => record.userId === member.userId);
              return {
                name: member.user.name?.trim() || member.user.email,
                minutes: Math.round(
                  memberRecords.reduce((accumulator, record) => accumulator + Math.max(0, record.durationSec ?? 0), 0) /
                    60,
                ),
                submissions: memberRecords.filter((record) => record.recordType === "ASSIGNMENT_SUBMIT").length,
              };
            })
            .sort((left, right) => right.minutes - left.minutes)
            .slice(0, 8),
        }
      : {
          roleView: "STUDENT",
          summaryCards: [
            {
              label: "本周学习时长",
              value: formatMinutes(
                analyticsBaseRecords
                  .filter((record) => record.createdAt >= sevenDaysAgo)
                  .reduce((accumulator, record) => accumulator + Math.max(0, record.durationSec ?? 0), 0),
              ),
              hint: "近 7 天累计",
            },
            {
              label: "资料浏览次数",
              value: `${behaviorBreakdown.find((item) => item.name === "资料浏览")?.value ?? 0}`,
              hint: "累计资料访问事件",
            },
            {
              label: "作业完成率",
              value: assignments.length
                ? `${Math.round(((behaviorBreakdown.find((item) => item.name === "作业提交")?.value ?? 0) / assignments.length) * 100)}%`
                : "0%",
              hint: "已提交 / 总作业数",
            },
            {
              label: "AI 辅助次数",
              value: `${behaviorBreakdown.find((item) => item.name === "AI 使用")?.value ?? 0}`,
              hint: "课程内 AI 对话次数",
            },
          ],
          trend,
          behaviorBreakdown,
          personalTimeline: analyticsBaseRecords
            .slice(-15)
            .reverse()
            .map((record) => ({
              time: record.createdAt.toLocaleString(),
              event:
                record.eventName ||
                (record.recordType === "MATERIAL_VIEW"
                  ? "资料浏览"
                  : record.recordType === "ASSIGNMENT_START"
                    ? "开始作业"
                    : record.recordType === "ASSIGNMENT_SUBMIT"
                      ? "提交作业"
                      : record.recordType === "AI_SESSION"
                        ? "AI 学习会话"
                        : "学习行为"),
              detail: record.note?.slice(0, 40) || "已记录学习行为",
            })),
        };

  const chatSession =
    (await prisma.chatSession.findFirst({
      where: {
        userId,
        courseId,
        status: "ACTIVE",
      },
      orderBy: { updatedAt: "desc" },
    })) ||
    (await prisma.chatSession.create({
      data: {
        userId,
        courseId,
        title: course.title,
        model: resolveDefaultChatModel(),
      },
    }));

  const [chatMessages, chatSessions] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    prisma.chatSession.findMany({
      where: {
        userId,
        courseId,
        status: "ACTIVE",
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, title: true, model: true, updatedAt: true },
    }),
  ]);

  return {
    overview: {
      recentItems:
        recentItems.length > 0
          ? recentItems
          : [
              {
                id: "empty-recent",
                title: "暂无最近学习记录",
                subtitle: "从资料或作业开始你的第一条课程学习轨迹。",
                meta: "等待学习行为",
              },
            ],
      materials: overviewMaterials,
      assignments: overviewAssignments,
      courseUpdate:
        activeAssignmentCount > 0
          ? `当前有 ${activeAssignmentCount} 项进行中的课程任务，AI 助手已按本课程内容提供支持。`
          : "当前暂无紧急截止作业，建议先复习资料并与 AI 助手进行问题梳理。",
    },
    libraryItems: [...libraryMaterialItems, ...libraryAssignmentItems],
    chat: {
      sessionId: chatSession.id,
      activeModel: chatSession.model?.trim() || resolveDefaultChatModel(),
      contextMaterialCount: materials.length,
      sessions: chatSessions.map((session) => ({
        id: session.id,
        title: session.title?.trim() || "未命名会话",
        model: session.model?.trim() || resolveDefaultChatModel(),
        updatedAtLabel: session.updatedAt.toLocaleString(),
      })),
      initialMessages: chatMessages.map((message) => ({
        id: message.id,
        role:
          message.role === "USER"
            ? "USER"
            : message.role === "ASSISTANT"
              ? "ASSISTANT"
              : "SYSTEM",
        content: message.content,
      })),
    },
    learningAnalytics,
  };
}

export type {
  DashboardCourseData,
  DashboardOverviewData,
  DashboardChatData,
  DashboardLearningAnalytics,
};
