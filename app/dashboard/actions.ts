"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CourseMemberRole, CourseStatus, MaterialKind, StudyRecordType } from "@prisma/client";
import { generateAssignmentInitialReview } from "@/lib/ai";
import { requireRole, requireSessionUser } from "@/lib/authz";
import { getStudentCourseMembership, getTeacherOwnedCourse } from "@/lib/course-access";
import { prisma } from "@/lib/db";

type ActionResult =
  | { success: true; data?: { courseId?: string } }
  | { success: false; error: string };

function generateCourseCode() {
  return `C-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

const createCourseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export async function createDashboardCourseAction(
  payload: z.infer<typeof createCourseSchema>,
): Promise<ActionResult> {
  const user = await requireRole("TEACHER");
  const parsed = createCourseSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "课程信息无效，请检查后重试。" };
  }

  const { title, description, status } = parsed.data;
  const course = await prisma.learningCourse.create({
    data: {
      ownerId: user.id,
      title,
      description: description || null,
      status: status === "PUBLISHED" ? CourseStatus.PUBLISHED : CourseStatus.DRAFT,
      courseCode: generateCourseCode(),
      members: {
        create: {
          userId: user.id,
          role: CourseMemberRole.OWNER,
        },
      },
    },
    select: { id: true },
  });

  revalidatePath("/dashboard");
  return { success: true, data: { courseId: course.id } };
}

const joinCourseSchema = z.object({
  courseCode: z.string().trim().min(1).max(64),
});

export async function joinDashboardCourseAction(
  payload: z.infer<typeof joinCourseSchema>,
): Promise<ActionResult> {
  const user = await requireRole("STUDENT");
  const parsed = joinCourseSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "课程码格式无效。" };
  }

  const normalizedCode = parsed.data.courseCode.toUpperCase();
  const course = await prisma.learningCourse.findUnique({
    where: { courseCode: normalizedCode },
    select: { id: true },
  });
  if (!course) {
    return { success: false, error: "课程码不存在，请确认后重试。" };
  }

  await prisma.courseMember.upsert({
    where: {
      courseId_userId: {
        courseId: course.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      courseId: course.id,
      userId: user.id,
      role: CourseMemberRole.STUDENT,
    },
  });

  revalidatePath("/dashboard");
  return { success: true, data: { courseId: course.id } };
}

const createLibrarySchema = z.object({
  courseId: z.string().trim().min(1),
  mode: z.enum(["assignment", "material"]),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(3000),
  dueDate: z.string().trim().optional(),
  link: z.string().trim().url().optional(),
});

export async function createDashboardLibraryItemAction(
  payload: z.infer<typeof createLibrarySchema>,
): Promise<ActionResult> {
  const user = await requireRole("TEACHER");
  const parsed = createLibrarySchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "参数无效，请检查输入。" };
  }

  const { courseId, mode, name, description, dueDate, link } = parsed.data;
  const course = await getTeacherOwnedCourse(user.id, courseId);
  if (!course) {
    return { success: false, error: "你没有该课程的管理权限。" };
  }

  if (mode === "assignment") {
    const dueAt = dueDate ? new Date(dueDate) : null;
    if (dueDate && Number.isNaN(dueAt?.getTime())) {
      return { success: false, error: "截止日期格式无效。" };
    }

    await prisma.assignment.create({
      data: {
        courseId,
        creatorId: user.id,
        title: name,
        description,
        dueAt,
        published: true,
      },
    });
  } else {
    await prisma.learningMaterial.create({
      data: {
        courseId,
        title: name,
        description,
        content: link || null,
        kind: link ? MaterialKind.LINK : MaterialKind.DOCUMENT,
      },
    });
  }

  revalidatePath("/dashboard");
  return { success: true };
}

const submitAssignmentSchema = z.object({
  courseId: z.string().trim().min(1),
  assignmentId: z.string().trim().min(1),
  answer: z.string().trim().min(1).max(8000),
});

export async function submitDashboardAssignmentAction(
  payload: z.infer<typeof submitAssignmentSchema>,
): Promise<ActionResult> {
  const user = await requireRole("STUDENT");
  const parsed = submitAssignmentSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "作业提交参数无效。" };
  }

  const { courseId, assignmentId, answer } = parsed.data;
  const membership = await getStudentCourseMembership(user.id, courseId);
  if (!membership) {
    return { success: false, error: "你尚未加入当前课程。" };
  }

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      courseId,
      published: true,
    },
    select: { id: true, title: true, description: true },
  });
  if (!assignment) {
    return { success: false, error: "作业不存在或尚未发布。" };
  }

  const aiResult = await generateAssignmentInitialReview({
    courseTitle: membership.course.title,
    assignmentTitle: assignment.title,
    assignmentDescription: assignment.description,
    answer,
  });

  await prisma.studyRecord.create({
    data: {
      userId: user.id,
      courseId,
      assignmentId,
      recordType: StudyRecordType.ASSIGNMENT_SUBMIT,
      note: answer,
      meta: {
        source: "dashboard-library-dialog",
        aiReview: {
          strengths: aiResult.review.strengths,
          issues: aiResult.review.issues,
          suggestions: aiResult.review.suggestions,
          scoreSuggestion: aiResult.review.scoreSuggestion,
          model: aiResult.model,
          mode: aiResult.mode,
          reviewedAt: new Date().toISOString(),
        },
        aiReviewNotice: aiResult.userNotice,
        aiReviewError: aiResult.error ?? null,
      },
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

const reviewSchema = z.object({
  courseId: z.string().trim().min(1),
  assignmentId: z.string().trim().min(1),
  recordId: z.string().trim().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().trim().max(2000).optional(),
});

export async function reviewDashboardAssignmentAction(
  payload: z.infer<typeof reviewSchema>,
): Promise<ActionResult> {
  const user = await requireRole("TEACHER");
  const parsed = reviewSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "批改参数无效。" };
  }

  const { courseId, assignmentId, recordId, status, comment } = parsed.data;
  const course = await getTeacherOwnedCourse(user.id, courseId);
  if (!course) {
    return { success: false, error: "你没有该课程的管理权限。" };
  }

  const record = await prisma.studyRecord.findFirst({
    where: {
      id: recordId,
      courseId,
      assignmentId,
      recordType: "ASSIGNMENT_SUBMIT",
    },
    select: { id: true, meta: true },
  });
  if (!record) {
    return { success: false, error: "提交记录不存在。" };
  }

  const existingMeta =
    record.meta && typeof record.meta === "object" && !Array.isArray(record.meta)
      ? (record.meta as Record<string, unknown>)
      : {};

  await prisma.studyRecord.update({
    where: { id: record.id },
    data: {
      meta: {
        ...existingMeta,
        teacherReview: {
          status,
          comment: comment || null,
          reviewedAt: new Date().toISOString(),
          reviewerId: user.id,
        },
      },
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function createDashboardChatSessionAction(courseId: string): Promise<ActionResult> {
  const user = await requireSessionUser();
  const validCourseId = courseId.trim();
  if (!validCourseId) {
    return { success: false, error: "课程上下文缺失。" };
  }

  const course = await prisma.learningCourse.findFirst({
    where: { id: validCourseId },
    select: { id: true, ownerId: true, title: true },
  });
  if (!course) {
    return { success: false, error: "课程不存在。" };
  }

  const isMember = await prisma.courseMember.findFirst({
    where: { courseId: validCourseId, userId: user.id },
    select: { id: true },
  });
  if (course.ownerId !== user.id && !isMember) {
    return { success: false, error: "你没有该课程的聊天权限。" };
  }

  await prisma.chatSession.create({
    data: {
      userId: user.id,
      courseId: validCourseId,
      title: course.title,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}
