import type { LibraryItem, StudentAssignmentStatus, UserRole } from "@/components/dashboard/library-types";
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
  updatedAtLabel: string;
};

type DashboardChatData = {
  sessionId: string;
  sessions: DashboardChatSession[];
  initialMessages: DashboardChatMessage[];
};

type DashboardCourseData = {
  overview: DashboardOverviewData;
  libraryItems: LibraryItem[];
  chat: DashboardChatData | null;
};

function formatShortDate(date: Date | null | undefined): string {
  if (!date) return "-";
  return date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

function mapStudentStatusFromRecord(
  record: { meta: unknown } | null,
): StudentAssignmentStatus {
  if (!record) return "Not Started";
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
    };
  }

  const now = new Date();
  const assignmentWhere =
    userRole === "STUDENT" ? { courseId, published: true } : { courseId };

  const [materials, assignments, records, submissions, recentStudyRecords] = await Promise.all([
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
    }),
    prisma.studyRecord.findMany({
      where: {
        courseId,
        recordType: "ASSIGNMENT_SUBMIT",
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
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
        : submission && parsed.teacherReviewStatus
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
      description: assignment.description || "暂无作业描述",
      submissionRecordId: submission?.id,
      submissionAnswer: submission?.note || "",
      teacherReviewStatus: parsed.teacherReviewStatus,
      teacherReviewComment: parsed.teacherReviewComment,
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
    subtitle: assignment.description || "完成后可获得 AI 初评与教师反馈。",
    meta: userRole === "STUDENT" ? "作业任务" : "教学任务",
    due: formatShortDate(assignment.dueAt),
  }));

  const activeAssignmentCount = assignments.filter(
    (assignment) => assignment.dueAt && assignment.dueAt > now,
  ).length;

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
      select: { id: true, title: true, updatedAt: true },
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
      sessions: chatSessions.map((session) => ({
        id: session.id,
        title: session.title?.trim() || "未命名会话",
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
  };
}

export type { DashboardCourseData, DashboardOverviewData, DashboardChatData };
