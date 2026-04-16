"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { logoutAction } from "@/app/(auth)/actions";
import { useCourseContext } from "@/components/dashboard/course-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MenuItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
  disabled?: boolean;
};

type SidebarCourse = {
  id: string;
  title: string;
  courseCode: string;
};

export function LeftSidebar({
  isOpen,
  toggleLeftSidebar,
  userName,
  userEmail,
  userRole,
  courses,
}: {
  isOpen: boolean;
  toggleLeftSidebar: () => void;
  userName: string;
  userEmail: string;
  userRole: "TEACHER" | "STUDENT";
  courses: SidebarCourse[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentCourseId, setCurrentCourse } = useCourseContext();
  const initials = (userName || userEmail).slice(0, 1).toUpperCase();
  const logoutFormRef = useRef<HTMLFormElement>(null);
  const currentCourse = courses.find((course) => course.id === currentCourseId) ?? null;
  const courseAvatar = (currentCourse?.courseCode || "NO").slice(0, 6).toUpperCase();
  const currentSection = searchParams.get("section") ?? "overview";

  const courseMenuItems: MenuItem[] = [
    {
      key: "overview",
      label: "Overview",
      href: "/dashboard?section=overview",
      icon: "⌂",
      disabled: !currentCourseId,
    },
    {
      key: "library",
      label: "Library",
      href: "/dashboard?section=library",
      icon: "◫",
      disabled: !currentCourseId,
    },
    {
      key: "ai-assistant",
      label: "AI Assistant",
      href: currentCourseId ? `/chat?courseId=${currentCourseId}` : "/chat",
      icon: "✦",
      disabled: !currentCourseId,
    },
  ];

  return (
    <>
      {!isOpen ? (
        <Button
          variant="secondary"
          size="sm"
          className="fixed left-3 top-3 z-50 h-9 w-9 cursor-pointer rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-0 text-[rgba(0,0,0,0.95)] shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
          onClick={toggleLeftSidebar}
          aria-label="展开侧边栏"
        >
          ≡
        </Button>
      ) : null}

      <aside
        className={`h-screen shrink-0 border-r border-[rgba(0,0,0,0.08)] bg-[#fcfcfb] transition-[width,box-shadow] duration-300 ease-out ${
          isOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className={`border-b border-[rgba(0,0,0,0.08)] px-2 py-3 ${isOpen ? "" : "px-1.5"}`}>
            {isOpen ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="mb-2 flex w-full items-center justify-between rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-2.5 py-2 text-left transition-colors hover:bg-[#f6f5f4]"
                    aria-label="切换课程"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f1f0ef] text-[10px] font-semibold text-[rgba(0,0,0,0.95)]">
                        {courseAvatar}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[rgba(0,0,0,0.95)]">
                          {currentCourse?.title ?? "No Course Selected"}
                        </p>
                        <p className="truncate text-xs text-[#615d59]">
                          {currentCourse?.courseCode ?? "Please create or join a course"}
                        </p>
                      </div>
                    </div>
                    <span className="ml-2 text-xs text-[#615d59]">▾</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Courses</DropdownMenuLabel>
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <DropdownMenuItem
                        key={course.id}
                        onSelect={() => setCurrentCourse(course.id)}
                        className={
                          course.id === currentCourseId
                            ? "bg-[#f2f9ff] text-[#097fe8]"
                            : ""
                        }
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#f1f0ef] text-[10px] font-semibold text-[rgba(0,0,0,0.95)]">
                            {course.courseCode.slice(0, 4).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm">{course.title}</p>
                            <p className="truncate text-xs text-[#615d59]">{course.courseCode}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>No courses yet</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={userRole === "TEACHER" ? "/teacher" : "/student"}>
                      {userRole === "TEACHER" ? "Create Course" : "Join Course"}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            <div className={`flex items-center ${isOpen ? "justify-between gap-2" : "justify-center"}`}>
              <div className="flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-[#f6f5f4]">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f1f0ef] text-xs font-semibold text-[rgba(0,0,0,0.95)]">
                  {initials}
                </span>
                {isOpen ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[rgba(0,0,0,0.95)]">{userName}</p>
                    <p className="truncate text-xs text-[#615d59]">{userEmail}</p>
                  </div>
                ) : null}
              </div>

              {isOpen ? (
                <div className="flex shrink-0 items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 px-0 text-xs cursor-pointer"
                        aria-label="打开用户菜单"
                      >
                        ↕
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Account</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">Settings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/chat">AI Assistant</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          logoutFormRef.current?.requestSubmit();
                        }}
                      >
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <form ref={logoutFormRef} action={logoutAction} className="hidden" />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 cursor-pointer rounded-lg px-0 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                    onClick={toggleLeftSidebar}
                    aria-label="收起侧边栏"
                  >
                    ←
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3">
            <div className="mb-2 px-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#615d59]">
                {currentCourse ? `${currentCourse.title} menu` : "Course menu"}
              </p>
            </div>
            <nav className="space-y-1">
              {courseMenuItems.map((item) => {
                const active =
                  item.key === "ai-assistant"
                    ? pathname.startsWith("/chat")
                    : item.key === "library"
                      ? pathname === "/dashboard" &&
                        (currentSection === "library" ||
                          currentSection === "materials" ||
                          currentSection === "assignments")
                      : pathname === "/dashboard" && currentSection === item.key;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex items-center rounded-xl px-2.5 py-2.5 text-sm transition-all duration-200 ${
                      active
                        ? "bg-[#f2f9ff] text-[#097fe8] shadow-[inset_0_0_0_1px_rgba(9,127,232,0.14)]"
                        : "text-[rgba(0,0,0,0.85)] hover:bg-[#f4f3f2] hover:text-[rgba(0,0,0,0.95)]"
                    } ${item.disabled ? "cursor-not-allowed opacity-45 hover:bg-transparent" : ""}`}
                    title={item.label}
                    aria-disabled={item.disabled}
                    onClick={(event) => {
                      if (item.disabled) event.preventDefault();
                    }}
                  >
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-sm">
                      {item.icon}
                    </span>
                    {isOpen ? <span className="ml-2 truncate">{item.label}</span> : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-[rgba(0,0,0,0.08)] px-2 py-3">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className={`w-full rounded-xl transition-colors hover:bg-[#f4f3f2] ${
                  isOpen ? "justify-start" : "justify-center px-0"
                }`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center text-sm">?</span>
                {isOpen ? <span className="ml-2">Help</span> : null}
              </Button>
              <Button
                variant="ghost"
                className={`w-full rounded-xl transition-colors hover:bg-[#f4f3f2] ${
                  isOpen ? "justify-start" : "justify-center px-0"
                }`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center text-sm">+</span>
                {isOpen ? <span className="ml-2">New</span> : null}
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
