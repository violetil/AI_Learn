"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CourseProvider } from "@/components/dashboard/course-context";
import { LeftSidebar } from "@/components/dashboard/left-sidebar";
import { MainContent } from "@/components/dashboard/main-content";
import { RightSidebar } from "@/components/dashboard/right-sidebar";

type DashboardCourse = {
  id: string;
  title: string;
  courseCode: string;
};

type DashboardLayoutProps = {
  userName: string;
  userEmail: string;
  userRole: "TEACHER" | "STUDENT";
  courses: DashboardCourse[];
};

export function DashboardLayout({
  userName,
  userEmail,
  userRole,
  courses,
}: DashboardLayoutProps) {
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(courses[0]?.id ?? null);
  const searchParams = useSearchParams();
  const toggleLeftSidebar = () => setIsLeftOpen((prev) => !prev);
  const toggleRightSidebar = () => setIsRightOpen((prev) => !prev);
  const section = searchParams.get("section") ?? "overview";
  const currentPageLabel =
    section === "overview"
      ? "Overview"
      : section === "library" || section === "assignments" || section === "materials"
        ? "Library"
        : "Overview";

  return (
    <CourseProvider
      value={{
        currentCourseId,
        setCurrentCourse: setCurrentCourseId,
      }}
    >
      <div className="flex h-screen w-full overflow-hidden bg-[#f6f5f4]">
        <LeftSidebar
          isOpen={isLeftOpen}
          toggleLeftSidebar={toggleLeftSidebar}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          courses={courses}
        />
        <div className="min-w-0 flex-1 transition-all duration-300 ease-out">
          <MainContent
            key={currentCourseId ?? "no-course"}
            courses={courses}
            currentPageLabel={currentPageLabel}
            userRole={userRole}
          />
        </div>
        <RightSidebar
          key={currentCourseId ?? "no-course-chat"}
          isOpen={isRightOpen}
          toggleRightSidebar={toggleRightSidebar}
          courses={courses}
        />
      </div>
    </CourseProvider>
  );
}
