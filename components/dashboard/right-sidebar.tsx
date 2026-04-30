"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useCourseContext } from "@/components/dashboard/course-context";
import { SUPPORTED_CHAT_MODELS } from "@/lib/ai-models";
import { consumeChatSseStream } from "@/lib/chat-stream-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  /** null = 未在流式输出；非 null 为当前累积文本（含空串表示已开始、尚无 token） */
  const [streamingText, setStreamingText] = useState<string | null>(null);
  /** 流式期间在服务端已写入用户句、尚未 refetch 前，在本地展示刚发送的内容 */
  const [pendingUserText, setPendingUserText] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);

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

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (scrollRafRef.current != null) {
      cancelAnimationFrame(scrollRafRef.current);
    }
    scrollRafRef.current = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
      scrollRafRef.current = null;
    });
  }, []);

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, pendingUserText, sessionId, scrollToBottom]);

  useLayoutEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (renameTarget) setRenameInput(renameTarget.title);
  }, [renameTarget]);

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
      setStreamingText(null);
      setIsSendingMessage(false);
      return;
    }
    startTransition(async () => {
      await fetchSidebarChatData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCourseId]);

  const sendStreamingMessage = async (raw: string) => {
    const text = raw.trim();
    if (!sessionId || !text || isSendingMessage) return;
    setChatError(null);
    setIsSendingMessage(true);
    setStreamingText("");
    setPendingUserText(text);
    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { success?: boolean; error?: string }
          | null;
        setChatError(payload?.error ?? `请求失败 (${response.status})`);
        setPendingUserText(null);
        await fetchSidebarChatData(sessionId);
        return;
      }
      const result = await consumeChatSseStream(response, (delta) => {
        setStreamingText((prev) => (prev ?? "") + delta);
      });
      if (!result.ok) {
        setChatError(result.error);
      }
      setPendingUserText(null);
      await fetchSidebarChatData(sessionId);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "发送失败");
      await fetchSidebarChatData(sessionId);
    } finally {
      setStreamingText(null);
      setIsSendingMessage(false);
      setPendingUserText(null);
    }
  };

  const applyRename = async () => {
    if (!renameTarget || !currentCourseId) return;
    const title = renameInput.trim();
    if (!title) return;
    const response = await fetch("/api/dashboard/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: currentCourseId,
        sessionId: renameTarget.id,
        title,
      }),
    });
    const payload = (await response.json()) as
      | { success: true }
      | { success: false; error: string };
    if (!payload.success) {
      setChatError(payload.error);
      return;
    }
    setRenameTarget(null);
    await fetchSidebarChatData(sessionId);
  };

  const applyDelete = async () => {
    if (!deleteTarget || !currentCourseId) return;
    const response = await fetch("/api/dashboard/chat", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: currentCourseId,
        sessionId: deleteTarget.id,
      }),
    });
    const payload = (await response.json()) as
      | { success: true }
      | { success: false; error: string };
    if (!payload.success) {
      setChatError(payload.error);
      return;
    }
    setDeleteTarget(null);
    setHistoryOpen(false);
    await fetchSidebarChatData();
  };

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
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  disabled={!canChat || isPending || isSendingMessage}
                  type="button"
                  onClick={() => setHistoryOpen(true)}
                >
                  历史会话
                </Button>
              ) : null}
              <Button
                variant="secondary"
                size="sm"
                className="h-8 rounded-lg text-xs"
                disabled={!canChat || isPending || isSendingMessage}
                type="button"
                onClick={() => {
                  if (!currentCourseId) return;
                  startTransition(async () => {
                    const response = await fetch("/api/dashboard/chat", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        courseId: currentCourseId,
                        model: activeSessionModel,
                      }),
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
                    disabled={!canChat || isPending || !sessionId || isSendingMessage}
                    type="button"
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
                            body: JSON.stringify({
                              courseId: currentCourseId,
                              sessionId,
                              model,
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
                type="button"
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

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
          {currentCourseTitle ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f8f7f6] px-3 py-2 text-xs text-[#615d59]">
                <span className="font-medium text-[rgba(0,0,0,0.85)]">当前会话：</span>
                <span className="truncate">{activeSessionTitle}</span>
              </div>
              {messages.length === 0 &&
              streamingText === null &&
              pendingUserText === null ? (
                <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f7f6f5] p-4 text-xs leading-6 text-[#615d59] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  暂无消息，开始与当前课程 AI 助手对话。
                </div>
              ) : (
                <>
                  {pendingUserText ? (
                    <div className="rounded-xl border border-[rgba(9,127,232,0.16)] bg-[#f2f9ff] p-4 text-xs leading-6 text-[#305874] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                      {pendingUserText}
                    </div>
                  ) : null}
                  {messages.map((message) => (
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
                  ))}
                  {streamingText !== null ? (
                    <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f7f6f5] p-4 text-xs leading-6 text-[#615d59] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                      {streamingText.length > 0
                        ? streamingText
                        : "正在生成回复…"}
                    </div>
                  ) : null}
                </>
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
          {isSendingMessage ? (
            <p className="mb-2 text-center text-[11px] text-[#8a847f]">AI 正在回复…</p>
          ) : null}
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
                if (event.key !== "Enter" || event.shiftKey) return;
                event.preventDefault();
                if (!sessionId || !input.trim() || isSendingMessage) return;
                const text = input.trim();
                setInput("");
                void sendStreamingMessage(text);
              }}
              disabled={!currentCourseTitle || isSendingMessage || !sessionId}
              className="h-10 rounded-xl border-0 px-2 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="flex max-h-[min(70vh,32rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <div className="border-b border-[rgba(0,0,0,0.08)] px-4 py-3">
            <DialogTitle className="text-base font-semibold text-[rgba(0,0,0,0.95)]">
              最近会话
            </DialogTitle>
            <p className="mt-1 text-xs text-[#615d59]">点击标题切换会话；⋯ 中可重命名或删除。</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[#615d59]">暂无历史会话</p>
            ) : (
              <ul className="divide-y divide-[rgba(0,0,0,0.08)]">
                {sessions.map((session) => (
                  <li key={session.id} className="flex items-stretch gap-1">
                    <button
                      type="button"
                      className="min-w-0 flex-1 px-3 py-3 text-left text-sm text-[rgba(0,0,0,0.95)] transition-colors hover:bg-[#f6f5f4]"
                      onClick={() => {
                        void (async () => {
                          await fetchSidebarChatData(session.id);
                          setHistoryOpen(false);
                        })();
                      }}
                    >
                      <span className="line-clamp-2 font-medium">{session.title}</span>
                      <span className="mt-0.5 block text-[11px] text-[#8a847f]">
                        {session.model} · {session.updatedAtLabel}
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center pr-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 shrink-0 rounded-lg px-0 text-base text-[#615d59] hover:bg-[#eceae8]"
                            aria-label="会话操作"
                            onClick={(e) => e.stopPropagation()}
                          >
                            ⋯
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onSelect={() => {
                              setHistoryOpen(false);
                              setRenameTarget({
                                id: session.id,
                                title: session.title,
                              });
                            }}
                          >
                            重命名
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-[#8f3a3a] focus:text-[#8f3a3a]"
                            onSelect={() => {
                              setHistoryOpen(false);
                              setDeleteTarget({
                                id: session.id,
                                title: session.title,
                              });
                            }}
                          >
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-[rgba(0,0,0,0.08)] px-3 py-2 text-right">
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm" className="rounded-lg text-xs">
                关闭
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border border-[rgba(0,0,0,0.08)] sm:max-w-md">
          <DialogTitle className="text-base font-semibold">重命名会话</DialogTitle>
          <div className="mt-3 space-y-2">
            <Label htmlFor="chat-rename-input" className="text-xs text-[#615d59]">
              会话标题
            </Label>
            <Input
              id="chat-rename-input"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              maxLength={80}
              className="rounded-xl"
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-lg"
              onClick={() => setRenameTarget(null)}
            >
              取消
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-lg"
              onClick={() => void applyRename()}
            >
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border border-[rgba(0,0,0,0.08)] sm:max-w-md">
          <DialogTitle className="text-base font-semibold">删除会话</DialogTitle>
          <p className="mt-2 text-sm leading-6 text-[#615d59]">
            确定删除「{deleteTarget?.title ?? ""}」及其全部消息吗？此操作不可撤销。
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-lg"
              onClick={() => setDeleteTarget(null)}
            >
              取消
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-lg bg-[#8f3a3a] text-white hover:bg-[#7a3232]"
              onClick={() => void applyDelete()}
            >
              删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
