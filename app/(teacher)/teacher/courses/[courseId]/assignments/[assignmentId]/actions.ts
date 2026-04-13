"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/authz";
import { getTeacherOwnedCourse } from "@/lib/course-access";
import { prisma } from "@/lib/db";

type TeacherReviewStatus = "APPROVED" | "REJECTED";

export async function reviewAssignmentSubmissionAction(formData: FormData): Promise<void> {
  const user = await requireRole("TEACHER");
  const courseId = String(formData.get("courseId") ?? "").trim();
  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  const recordId = String(formData.get("recordId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as TeacherReviewStatus;
  const comment = String(formData.get("comment") ?? "").trim();

  if (!courseId || !assignmentId || !recordId) {
    redirect("/teacher?error=invalid-review");
  }
  if (status !== "APPROVED" && status !== "REJECTED") {
    redirect(
      `/teacher/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}?error=invalid-status`,
    );
  }

  const course = await getTeacherOwnedCourse(user.id, courseId);
  if (!course) {
    redirect("/teacher");
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
    redirect(
      `/teacher/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}?error=record-not-found`,
    );
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

  redirect(
    `/teacher/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}?reviewed=1`,
  );
}
