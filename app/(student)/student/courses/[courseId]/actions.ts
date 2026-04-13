"use server";

import { redirect } from "next/navigation";
import { StudyRecordType } from "../../../../../node_modules/.prisma/client/default";
import { requireRole } from "@/lib/authz";
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
    select: { id: true },
  });
  if (!assignment) {
    redirect(`/student/courses/${encodeURIComponent(courseId)}?error=assignment-not-found`);
  }

  await prisma.studyRecord.create({
    data: {
      userId: user.id,
      courseId,
      assignmentId,
      recordType: StudyRecordType.ASSIGNMENT_SUBMIT,
      note: answer,
      meta: {
        source: "student-assignment-form",
      },
    },
  });

  redirect(`/student/courses/${encodeURIComponent(courseId)}?submitted=${encodeURIComponent(assignmentId)}`);
}
