import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
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

  return (
    <DashboardLayout
      userName={user.name?.trim() || user.email.split("@")[0] || "User"}
      userEmail={user.email}
      userRole={user.role}
      courses={courses}
    />
  );
}
