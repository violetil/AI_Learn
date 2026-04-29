import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { getSessionUser } from "@/lib/auth";
import type { UserRole } from "@/components/dashboard/library-types";
import { getDashboardCourseData, type DashboardCourseData } from "@/lib/dashboard-data";
import { prisma } from "@/lib/db";

type Search = { courseId?: string; section?: string };

const EMPTY_DATA: DashboardCourseData = {
  overview: {
    recentItems: [],
    materials: [],
    assignments: [],
    courseUpdate: "请选择课程开始学习。",
  },
  libraryItems: [],
  chat: null,
  learningAnalytics: null,
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const courses =
    user.role === "TEACHER"
      ? await prisma.learningCourse.findMany({
          where: { ownerId: user.id },
          select: { id: true, title: true, courseCode: true },
          orderBy: { updatedAt: "desc" },
        })
      : (
          await prisma.courseMember.findMany({
            where: { userId: user.id },
            select: {
              course: {
                select: { id: true, title: true, courseCode: true },
              },
            },
            orderBy: { updatedAt: "desc" },
          })
        ).map((item) => item.course);

  const sp = await searchParams;
  const requestedCourseId = sp.courseId?.trim();
  const fallbackCourseId = courses[0]?.id ?? null;
  const currentCourseId =
    requestedCourseId && courses.some((course) => course.id === requestedCourseId)
      ? requestedCourseId
      : fallbackCourseId;

  if (currentCourseId && requestedCourseId !== currentCourseId) {
    const section = sp.section?.trim() || "overview";
    redirect(
      `/dashboard?courseId=${encodeURIComponent(currentCourseId)}&section=${encodeURIComponent(section)}`,
    );
  }

  const courseData =
    currentCourseId && courses.length > 0
      ? await getDashboardCourseData({
          userId: user.id,
          userRole: user.role as UserRole,
          courseId: currentCourseId,
        })
      : EMPTY_DATA;

  return (
    <DashboardLayout
      userName={user.name?.trim() || user.email.split("@")[0] || "用户"}
      userEmail={user.email}
      userRole={user.role}
      courses={courses}
      initialCourseId={currentCourseId}
      initialData={courseData}
    />
  );
}
