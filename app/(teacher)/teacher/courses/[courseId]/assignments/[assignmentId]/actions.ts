"use server";

import { redirect } from "next/navigation";
import { ReviewStatus } from "@prisma/client";
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
  const scoreRaw = String(formData.get("score") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();

  if (!courseId || !assignmentId || !recordId) {
    redirect("/dashboard?section=library");
  }
  if (status !== "APPROVED" && status !== "REJECTED") {
    redirect(`/dashboard?section=library&courseId=${encodeURIComponent(courseId)}`);
  }
  const score = scoreRaw ? Number.parseInt(scoreRaw, 10) : null;
  const isInvalidScore =
    scoreRaw && (score === null || Number.isNaN(score) || score < 0 || score > 100);
  if (isInvalidScore) {
    redirect(`/dashboard?section=library&courseId=${encodeURIComponent(courseId)}`);
  }

  const course = await getTeacherOwnedCourse(user.id, courseId);
  if (!course) {
    redirect("/dashboard?section=library");
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
    redirect(`/dashboard?section=library&courseId=${encodeURIComponent(courseId)}`);
  }

  const existingMeta =
    record.meta && typeof record.meta === "object" && !Array.isArray(record.meta)
      ? (record.meta as Record<string, unknown>)
      : {};

  await prisma.studyRecord.update({
    where: { id: record.id },
    data: {
      reviewStatus: status === "APPROVED" ? ReviewStatus.APPROVED : ReviewStatus.REJECTED,
      reviewComment: comment || null,
      reviewScore: score,
      reviewedAt: new Date(),
      reviewerId: user.id,
      meta: {
        ...existingMeta,
        teacherReview: {
          status,
          comment: comment || null,
          score,
          reviewedAt: new Date().toISOString(),
          reviewerId: user.id,
        },
      },
    },
  });

  redirect(`/dashboard?section=library&courseId=${encodeURIComponent(courseId)}`);
}
