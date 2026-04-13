"use server";

import { redirect } from "next/navigation";
import { CourseMemberRole } from "../../../node_modules/.prisma/client/default";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";

/** 学生通过课程码加入课程 */
export async function joinCourseAction(formData: FormData): Promise<void> {
  const user = await requireRole("STUDENT");
  const raw = String(formData.get("courseCode") ?? "");
  const courseCode = raw.trim().toUpperCase();

  if (!courseCode) {
    redirect("/student?error=missing-code");
  }

  const course = await prisma.learningCourse.findUnique({
    where: { courseCode },
    select: { id: true, status: true },
  });
  if (!course) {
    redirect("/student?error=course-not-found");
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

  redirect(`/student?joined=${encodeURIComponent(course.id)}`);
}
