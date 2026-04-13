"use server";

import { redirect } from "next/navigation";
import { CourseMemberRole, CourseStatus } from "../../../node_modules/.prisma/client/default";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";

function normalizeCode(input: string) {
  return input.trim().toUpperCase();
}

/** 教师创建课程，并自动把自己写入成员关系（OWNER） */
export async function createCourseAction(formData: FormData): Promise<void> {
  const user = await requireRole("TEACHER");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "DRAFT").trim();
  const status =
    statusRaw === CourseStatus.PUBLISHED ? CourseStatus.PUBLISHED : CourseStatus.DRAFT;

  if (!title) {
    redirect("/teacher?error=missing-title");
  }
  if (title.length > 120) {
    redirect("/teacher?error=title-too-long");
  }

  const courseCode = normalizeCode(
    `C-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`,
  );

  const course = await prisma.learningCourse.create({
    data: {
      ownerId: user.id,
      title,
      description: description || null,
      status,
      courseCode,
      members: {
        create: {
          userId: user.id,
          role: CourseMemberRole.OWNER,
        },
      },
    },
  });

  redirect(`/teacher?created=${encodeURIComponent(course.id)}`);
}
