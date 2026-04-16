"use server";

import { redirect } from "next/navigation";
import { StudyRecordType } from "../../../../../node_modules/.prisma/client/default";
import { takeAiTurn } from "@/lib/ai-rate-limit";
import { requireRole } from "@/lib/authz";
import { generateAssignmentInitialReview } from "@/lib/ai";
import { getStudentCourseMembership } from "@/lib/course-access";
import { prisma } from "@/lib/db";

export async function submitAssignmentAction(formData: FormData): Promise<void> {
  const user = await requireRole("STUDENT");
  const courseId = String(formData.get("courseId") ?? "").trim();
  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();

  if (!courseId || !assignmentId) {
    redirect("/student?error=invalid-course");
  }

  const membership = await getStudentCourseMembership(user.id, courseId);
  if (!membership) {
    redirect("/student");
  }
  if (!answer) {
    redirect(`/student/courses/${encodeURIComponent(courseId)}?error=empty-answer`);
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
    redirect(`/student/courses/${encodeURIComponent(courseId)}?error=assignment-not-found`);
  }

  const quota = takeAiTurn(user.id);
  if (!quota.ok) {
    redirect(
      `/student/courses/${encodeURIComponent(courseId)}?error=rate-limit`,
    );
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
        source: "student-assignment-form",
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

  const query = new URLSearchParams({
    submitted: assignmentId,
    ai: aiResult.mode,
  });
  redirect(`/student/courses/${encodeURIComponent(courseId)}?${query.toString()}`);
}
