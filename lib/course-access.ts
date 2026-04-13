import { prisma } from "@/lib/db";

export async function getTeacherOwnedCourse(userId: string, courseId: string) {
  return prisma.learningCourse.findFirst({
    where: { id: courseId, ownerId: userId },
  });
}

export async function getStudentCourseMembership(userId: string, courseId: string) {
  const rows = await prisma.$queryRaw<Array<{ userId: string; courseId: string }>>`
    SELECT userId, courseId
    FROM course_member
    WHERE userId = ${userId} AND courseId = ${courseId}
    LIMIT 1
  `;
  if (rows.length === 0) return null;

  const course = await prisma.learningCourse.findUnique({
    where: { id: courseId },
  });
  if (!course) return null;
  return { course };
}

export async function isCourseMember(userId: string, courseId: string) {
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*) as count
    FROM course_member
    WHERE userId = ${userId} AND courseId = ${courseId}
  `;
  return Number(rows[0]?.count ?? 0) > 0;
}
