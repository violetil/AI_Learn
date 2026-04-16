"use client";

import { useCourseContext } from "@/components/dashboard/course-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function RightSidebar({
  isOpen,
  toggleRightSidebar,
  courses,
}: {
  isOpen: boolean;
  toggleRightSidebar: () => void;
  courses: Array<{ id: string; title: string; courseCode: string }>;
}) {
  const { currentCourseId } = useCourseContext();
  const currentCourse = courses.find((course) => course.id === currentCourseId) ?? null;
  const currentCourseTitle = currentCourse?.title ?? null;

  if (!isOpen) {
    return (
      <Button
        onClick={toggleRightSidebar}
        aria-label="展开 AI Chat"
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full border border-[rgba(0,0,0,0.08)] bg-white px-0 text-[rgba(0,0,0,0.95)] shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.2)]"
      >
        ✦
      </Button>
    );
  }

  return (
    <aside className="h-screen w-[26rem] shrink-0 border-l border-[rgba(0,0,0,0.08)] bg-[#fcfcfb] shadow-[-8px_0_24px_rgba(0,0,0,0.04)] transition-[transform,opacity] duration-300 ease-out">
      <div className="flex h-full flex-col">
        <div className="border-b border-[rgba(0,0,0,0.08)] px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">AI Assistant</p>
              <p className="truncate text-xs text-[#615d59]">
                {currentCourseTitle ?? "未选择课程"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {currentCourseTitle ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm" className="h-8 rounded-lg text-xs">
                      History
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Recent Chats</DropdownMenuLabel>
                    <DropdownMenuItem>Math Homework Review</DropdownMenuItem>
                    <DropdownMenuItem>Course Summary Helper</DropdownMenuItem>
                    <DropdownMenuItem>Exam Practice Q&A</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>View All History</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              <Button variant="secondary" size="sm" className="h-8 rounded-lg text-xs">
                New Chat
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 rounded-lg px-0 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                onClick={toggleRightSidebar}
                aria-label="收起右侧栏"
              >
                →
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-[#7a746f]">
            {currentCourseTitle
              ? "AI 回答将优先基于当前课程内容。"
              : "请选择课程后再使用 AI。"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {currentCourseTitle ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f7f6f5] p-4 text-xs leading-6 text-[#615d59] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                AI Chat Content Placeholder
              </div>
              <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f7f6f5] p-4 text-xs leading-6 text-[#615d59] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                后续在这里渲染对话消息流（支持长列表滚动）。
              </div>
              <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f7f6f5] p-4 text-xs leading-6 text-[#615d59] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                预留系统提示、学习建议与作业批改反馈展示区域。
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="w-full rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-6 text-center shadow-[0_6px_16px_rgba(0,0,0,0.04)]">
                <p className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">AI Chat Unavailable</p>
                <p className="mt-2 text-sm leading-6 text-[#615d59]">请选择课程后再使用 AI</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[rgba(0,0,0,0.08)] bg-white px-3 py-3">
          <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-2 shadow-[0_8px_20px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.03)]">
            <Input
              placeholder={
                currentCourseTitle
                  ? "Ask AI anything about your course..."
                  : "Select a course to start AI chat..."
              }
              disabled={!currentCourseTitle}
              className="h-10 rounded-xl border-0 px-2 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
