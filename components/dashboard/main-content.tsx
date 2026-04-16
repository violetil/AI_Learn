"use client";

import { CourseHome } from "@/components/dashboard/course-home";
import { CourseLibraryPage } from "@/components/dashboard/course-library-page";
import { useCourseContext } from "@/components/dashboard/course-context";
import type { LibraryTab } from "@/components/dashboard/library-types";
import { useSearchParams } from "next/navigation";

type MainContentCourse = {
  id: string;
  title: string;
  courseCode: string;
};

export function MainContent({
  children,
  courses,
  currentPageLabel,
  userRole,
}: {
  children?: React.ReactNode;
  courses: MainContentCourse[];
  currentPageLabel?: string;
  userRole: "TEACHER" | "STUDENT";
}) {
  const searchParams = useSearchParams();
  const { currentCourseId } = useCourseContext();
  const currentCourse = courses.find((course) => course.id === currentCourseId) ?? null;
  const isOverview = (currentPageLabel ?? "Overview") === "Overview";
  const pageSection = searchParams.get("section");
  const isLibrary =
    pageSection === "library" || pageSection === "assignments" || pageSection === "materials";
  const initialLibraryTab: LibraryTab =
    pageSection === "assignments"
      ? "assignments"
      : pageSection === "materials"
        ? "materials"
        : "recents";

  return (
    <main className="h-screen min-w-0 flex-1 overflow-y-auto bg-[#f6f5f4] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0">
      <div className="mx-auto w-full max-w-6xl px-8 py-10 lg:px-10">
        <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-10 shadow-[0_10px_30px_rgba(0,0,0,0.05),0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300">
          <div className="mb-8 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#faf9f8] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[rgba(0,0,0,0.95)]">
                  {currentCourse?.title ?? "No course selected"}
                </p>
                <p className="mt-0.5 text-xs text-[#615d59]">{currentCourse?.courseCode ?? "-"}</p>
              </div>
              <span className="rounded-full border border-[rgba(0,0,0,0.08)] bg-white px-2.5 py-1 text-xs font-medium text-[#615d59]">
                {currentPageLabel ?? "Overview"}
              </span>
            </div>
            <p className="mt-2 text-xs text-[#7a746f]">
              Dashboard / {currentCourse?.title ?? "Course"} / {currentPageLabel ?? "Overview"}
            </p>
          </div>

          {children ??
            (currentCourse && isOverview ? (
              <CourseHome courseTitle={currentCourse.title} courseCode={currentCourse.courseCode} />
            ) : currentCourse && isLibrary ? (
              <CourseLibraryPage
                initialTab={initialLibraryTab}
                courseTitle={currentCourse.title}
                userRole={userRole}
              />
            ) : (
              <div className="space-y-4">
                <h1 className="text-[30px] font-bold tracking-[-0.01em] text-[rgba(0,0,0,0.95)]">
                  {currentPageLabel ?? "Main Content"}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[#615d59]">
                  该区域将承载当前课程的 {currentPageLabel ?? "Overview"} 内容模块。
                </p>
                <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#faf9f8] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <p className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">Coming Soon</p>
                  <p className="mt-2 text-sm text-[#615d59]">
                    你正在查看 {currentCourse?.title ?? "No course selected"} 的{" "}
                    {currentPageLabel ?? "Overview"} 页面。
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}
