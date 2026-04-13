"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/authz";
import { getTeacherOwnedCourse } from "@/lib/course-access";
import { prisma } from "@/lib/db";

export async function createAssignmentAction(formData: FormData): Promise<void> {
  const user = await requireRole("TEACHER");

  const courseId = String(formData.get("courseId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueAtRaw = String(formData.get("dueAt") ?? "").trim();
  const published = String(formData.get("published") ?? "") === "on";

  if (!courseId) {
    redirect("/teacher?error=invalid-course");
  }
  const course = await getTeacherOwnedCourse(user.id, courseId);
  if (!course) {
    redirect("/teacher");
  }
  if (!title) {
    redirect(`/teacher/courses/${encodeURIComponent(courseId)}?error=missing-title`);
  }

  const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;
  if (dueAtRaw && Number.isNaN(dueAt?.getTime())) {
    redirect(`/teacher/courses/${encodeURIComponent(courseId)}?error=invalid-dueAt`);
  }

  await prisma.assignment.create({
    data: {
      courseId,
      creatorId: user.id,
      title,
      description: description || null,
      dueAt,
      published,
    },
  });

  redirect(`/teacher/courses/${encodeURIComponent(courseId)}?created=1`);
}
