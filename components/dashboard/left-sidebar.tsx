"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { logoutAction } from "@/app/(auth)/actions";
import {
  createDashboardCourseAction,
  joinDashboardCourseAction,
} from "@/app/dashboard/actions";
import {
  CourseEntryDialog,
  type CourseEntryMode,
  type CourseEntryPayload,
} from "@/components/dashboard/course-entry-dialog";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentCourseId, setCurrentCourse } = useCourseContext();
  const [courseEntryMode, setCourseEntryMode] = useState<CourseEntryMode>(null);
  const [courseEntryError, setCourseEntryError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const initials = (userName || userEmail).slice(0, 1).toUpperCase();
  const logoutFormRef = useRef<HTMLFormElement>(null);
  const currentCourse = courses.find((course) => course.id === currentCourseId) ?? null;
  const courseAvatar = (currentCourse?.courseCode || "NO").slice(0, 6).toUpperCase();
  const currentSection = searchParams.get("section") ?? "overview";

  const buildDashboardHref = (section: string, courseId: string | null) => {
    const query = new URLSearchParams();
    query.set("section", section);
    if (courseId) {
      query.set("courseId", courseId);
    }
    return `/dashboard?${query.toString()}`;
  };

  const courseMenuItems: MenuItem[] = [
    {
      key: "overview",
      label: "总览",
      href: buildDashboardHref("overview", currentCourseId),
      icon: "⌂",
      disabled: !currentCourseId,
    },
    {
      key: "library",
      label: "资料库",
      href: buildDashboardHref("library", currentCourseId),
      icon: "◫",
      disabled: !currentCourseId,
    },
    {
      key: "ai-assistant",
      label: "AI 助手",
      href: buildDashboardHref("ai", currentCourseId),
      icon: "✦",
      disabled: !currentCourseId,
    },
    {
      key: userRole === "TEACHER" ? "learning-insights" : "my-learning",
      label: userRole === "TEACHER" ? "学习情况" : "我的学习分析",
      href: buildDashboardHref(userRole === "TEACHER" ? "learning-insights" : "my-learning", currentCourseId),
      icon: "▦",
      disabled: !currentCourseId,
    },
  ];

  const handleCourseEntry = (payload: CourseEntryPayload) => {
    setCourseEntryError(null);
    startTransition(async () => {
      const result =
        payload.mode === "create"
          ? await createDashboardCourseAction({
              title: payload.title,
              description: payload.description,
              status: payload.status,
            })
          : await joinDashboardCourseAction({
              courseCode: payload.courseCode,
            });

      if (!result.success) {
        setCourseEntryError(result.error);
        return;
      }

      const nextCourseId = result.data?.courseId ?? null;
      if (nextCourseId) {
        setCurrentCourse(nextCourseId);
        router.push(buildDashboardHref("overview", nextCourseId));
      } else {
        router.refresh();
      }
      setCourseEntryMode(null);
    });
  };

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
                          {currentCourse?.title ?? "未选择课程"}
                        </p>
                        <p className="truncate text-xs text-[#615d59]">
                          {currentCourse?.courseCode ?? "请先创建或加入课程"}
                        </p>
                      </div>
                    </div>
                    <span className="ml-2 text-xs text-[#615d59]">▾</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>课程列表</DropdownMenuLabel>
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <DropdownMenuItem
                        key={course.id}
                        onSelect={() => {
                          setCurrentCourse(course.id);
                          const nextSection = searchParams.get("section") ?? "overview";
                          router.push(buildDashboardHref(nextSection, course.id));
                        }}
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
                    <DropdownMenuItem disabled>暂无课程</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      setCourseEntryError(null);
                      setCourseEntryMode(userRole === "TEACHER" ? "create" : "join");
                    }}
                  >
                    {userRole === "TEACHER" ? "创建课程" : "加入课程"}
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
                        className="h-8 w-8 cursor-pointer px-0 text-xs"
                        aria-label="打开用户菜单"
                      >
                        ↕
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>账户</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">设置</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          logoutFormRef.current?.requestSubmit();
                        }}
                      >
                        退出登录
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
                {currentCourse ? `${currentCourse.title} 菜单` : "课程菜单"}
              </p>
            </div>
            <nav className="space-y-1">
              {courseMenuItems.map((item) => {
                const active =
                  item.key === "ai-assistant"
                    ? pathname === "/dashboard" && currentSection === "ai"
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
                {isOpen ? <span className="ml-2">帮助</span> : null}
              </Button>
              <Button
                variant="ghost"
                className={`w-full rounded-xl transition-colors hover:bg-[#f4f3f2] ${
                  isOpen ? "justify-start" : "justify-center px-0"
                }`}
                onClick={() => {
                  setCourseEntryError(null);
                  setCourseEntryMode(userRole === "TEACHER" ? "create" : "join");
                }}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center text-sm">+</span>
                {isOpen ? <span className="ml-2">{userRole === "TEACHER" ? "新建课程" : "加入课程"}</span> : null}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <CourseEntryDialog
        open={Boolean(courseEntryMode)}
        mode={courseEntryMode}
        onOpenChange={(open) => {
          if (!open) {
            setCourseEntryMode(null);
            setCourseEntryError(null);
          }
        }}
        onSubmit={handleCourseEntry}
        pending={isPending}
        error={courseEntryError}
      />
    </>
  );
}
