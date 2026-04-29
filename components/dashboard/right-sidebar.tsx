"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useCourseContext } from "@/components/dashboard/course-context";
import { SUPPORTED_CHAT_MODELS } from "@/lib/ai-models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DashboardChatData } from "@/lib/dashboard-data";

type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
};

type ChatSessionVm = {
  id: string;
  title: string;
  model: string;
  updatedAtLabel: string;
};

export function RightSidebar({
  isOpen,
  toggleRightSidebar,
  courses,
  initialData,
}: {
  isOpen: boolean;
  toggleRightSidebar: () => void;
  courses: Array<{ id: string; title: string; courseCode: string }>;
  initialData: DashboardChatData | null;
}) {
  const { currentCourseId } = useCourseContext();
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(initialData?.sessionId ?? "");
  const [sessions, setSessions] = useState<ChatSessionVm[]>(initialData?.sessions ?? []);
  const [messages, setMessages] = useState<ChatMessage[]>(initialData?.initialMessages ?? []);
  const [activeModel, setActiveModel] = useState(initialData?.activeModel ?? "gpt-4o-mini");
  const [contextMaterialCount, setContextMaterialCount] = useState(
    initialData?.contextMaterialCount ?? 0,
  );
  const [chatError, setChatError] = useState<string | null>(null);
  const currentCourse = courses.find((course) => course.id === currentCourseId) ?? null;
  const currentCourseTitle = currentCourse?.title ?? null;
  const canChat = Boolean(currentCourseId && currentCourseTitle);

  const activeSessionTitle = useMemo(() => {
    const active = sessions.find((session) => session.id === sessionId);
    return active?.title ?? "当前会话";
  }, [sessionId, sessions]);
  const activeSessionModel = useMemo(() => {
    const active = sessions.find((session) => session.id === sessionId);
    return active?.model || activeModel;
  }, [activeModel, sessionId, sessions]);

  const fetchSidebarChatData = async (nextSessionId?: string) => {
    if (!currentCourseId) return;
    const query = new URLSearchParams({ courseId: currentCourseId });
    if (nextSessionId) {
      query.set("sessionId", nextSessionId);
    }
    const response = await fetch(`/api/dashboard/chat?${query.toString()}`);
    const payload = (await response.json()) as
      | {
          success: true;
          data: {
            sessionId: string;
            activeModel: string;
            contextMaterialCount: number;
            sessions: ChatSessionVm[];
            messages: ChatMessage[];
          };
        }
      | { success: false; error: string };
    if (!payload.success) {
      setChatError(payload.error);
      return;
    }
    setChatError(null);
    setSessionId(payload.data.sessionId);
    setActiveModel(payload.data.activeModel);
    setContextMaterialCount(payload.data.contextMaterialCount);
    setSessions(payload.data.sessions);
    setMessages(payload.data.messages);
  };

  useEffect(() => {
    if (!currentCourseId) {
      setSessionId("");
      setSessions([]);
      setMessages([]);
      setActiveModel("gpt-4o-mini");
      setContextMaterialCount(0);
      setChatError(null);
      return;
    }
    startTransition(async () => {
      await fetchSidebarChatData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCourseId]);

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
              <p className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">AI 助手</p>
              <p className="truncate text-xs text-[#615d59]">
                {currentCourseTitle ?? "未选择课程"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {currentCourseTitle ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm" className="h-8 rounded-lg text-xs">
                      历史会话
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>最近会话</DropdownMenuLabel>
                    {sessions.length === 0 ? (
                      <DropdownMenuItem disabled>暂无历史会话</DropdownMenuItem>
                    ) : (
                      sessions.map((session) => (
                        <DropdownMenuItem
                          key={session.id}
                          onSelect={() => {
                            startTransition(async () => {
                              await fetchSidebarChatData(session.id);
                            });
                          }}
                        >
                          <div className="flex w-full items-center justify-between gap-3">
                            <span className="truncate">{session.title}</span>
                            <span className="text-[11px] text-[#8a847f]">{session.model}</span>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              <Button
                variant="secondary"
                size="sm"
                className="h-8 rounded-lg text-xs"
                disabled={!canChat || isPending}
                onClick={() => {
                  if (!currentCourseId) return;
                  startTransition(async () => {
                    const response = await fetch("/api/dashboard/chat", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ courseId: currentCourseId, model: activeSessionModel }),
                    });
                    const payload = (await response.json()) as
                      | { success: true; data: { sessionId: string } }
                      | { success: false; error: string };
                    if (!payload.success) {
                      setChatError(payload.error);
                      return;
                    }
                    await fetchSidebarChatData(payload.data.sessionId);
                  });
                }}
              >
                新会话
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 rounded-lg px-2 text-xs"
                    disabled={!canChat || isPending || !sessionId}
                  >
                    {activeSessionModel}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>会话模型</DropdownMenuLabel>
                  {SUPPORTED_CHAT_MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model}
                      onSelect={() => {
                        if (!currentCourseId || !sessionId) return;
                        startTransition(async () => {
                          const response = await fetch("/api/dashboard/chat", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ courseId: currentCourseId, sessionId, model }),
                          });
                          const payload = (await response.json()) as
                            | { success: true }
                            | { success: false; error: string };
                          if (!payload.success) {
                            setChatError(payload.error);
                            return;
                          }
                          await fetchSidebarChatData(sessionId);
                        });
                      }}
                    >
                      {model}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
          {currentCourseTitle ? (
            <p className="mt-1 text-[11px] text-[#8a847f]">
              上下文资料：{contextMaterialCount} 条 · 当前模型：{activeSessionModel}
            </p>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {currentCourseTitle ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f8f7f6] p-3 text-xs text-[#615d59]">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{activeSessionTitle}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 rounded-md px-2 text-[11px]"
                      disabled={isPending || !sessionId || !currentCourseId}
                      onClick={() => {
                        const title = window.prompt("请输入新的会话名称", activeSessionTitle);
                        if (!title?.trim() || !sessionId || !currentCourseId) return;
                        startTransition(async () => {
                          const response = await fetch("/api/dashboard/chat", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              courseId: currentCourseId,
                              sessionId,
                              title: title.trim(),
                            }),
                          });
                          const payload = (await response.json()) as
                            | { success: true }
                            | { success: false; error: string };
                          if (!payload.success) {
                            setChatError(payload.error);
                            return;
                          }
                          await fetchSidebarChatData(sessionId);
                        });
                      }}
                    >
                      重命名
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 rounded-md px-2 text-[11px] text-[#8f3a3a]"
                      disabled={isPending || !sessionId || !currentCourseId}
                      onClick={() => {
                        if (!window.confirm("确认删除该会话及其全部消息吗？")) return;
                        if (!sessionId || !currentCourseId) return;
                        startTransition(async () => {
                          const response = await fetch("/api/dashboard/chat", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ courseId: currentCourseId, sessionId }),
                          });
                          const payload = (await response.json()) as
                            | { success: true }
                            | { success: false; error: string };
                          if (!payload.success) {
                            setChatError(payload.error);
                            return;
                          }
                          await fetchSidebarChatData();
                        });
                      }}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </div>
              {messages.length === 0 ? (
                <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f7f6f5] p-4 text-xs leading-6 text-[#615d59] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  暂无消息，开始与当前课程 AI 助手对话。
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-xl border p-4 text-xs leading-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
                      message.role === "USER"
                        ? "border-[rgba(9,127,232,0.16)] bg-[#f2f9ff] text-[#305874]"
                        : "border-[rgba(0,0,0,0.08)] bg-[#f7f6f5] text-[#615d59]"
                    }`}
                  >
                    {message.content}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="w-full rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-6 text-center shadow-[0_6px_16px_rgba(0,0,0,0.04)]">
                <p className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">AI 聊天不可用</p>
                <p className="mt-2 text-sm leading-6 text-[#615d59]">请选择课程后再使用 AI</p>
              </div>
            </div>
          )}
        </div>
        {chatError ? (
          <div className="border-t border-[rgba(0,0,0,0.08)] bg-[#fff7f7] px-3 py-2 text-xs text-[#8f3a3a]">
            {chatError}
          </div>
        ) : null}

        <div className="border-t border-[rgba(0,0,0,0.08)] bg-white px-3 py-3">
          <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-2 shadow-[0_8px_20px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.03)]">
            <Input
              placeholder={
                currentCourseTitle
                  ? "输入课程相关问题，按 Enter 发送..."
                  : "请先选择课程后再开始对话..."
              }
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                if (!sessionId || !input.trim()) return;
                startTransition(async () => {
                  const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      message: input.trim(),
                      sessionId,
                    }),
                  });
                  const payload = (await response.json()) as
                    | { success: true }
                    | { success: false; error: string };
                  if (!payload.success) {
                    setChatError(payload.error);
                    return;
                  }
                  setInput("");
                  await fetchSidebarChatData(sessionId);
                });
              }}
              disabled={!currentCourseTitle || isPending || !sessionId}
              className="h-10 rounded-xl border-0 px-2 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
