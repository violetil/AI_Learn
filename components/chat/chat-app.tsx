"use client";

import { useEffect, useRef, useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createNewChatSession,
  deleteChatSessionAction,
  renameChatSessionAction,
  sendChatMessage,
} from "@/app/(chat)/chat/actions";
import { initialSendMessageState } from "@/types/chat";

export type ChatMessageVm = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
};

type Props = {
  sessionId: string;
  initialMessages: ChatMessageVm[];
  userEmail: string;
  /** 当前为「课程辅导」会话时传入，用于新对话继承课程与 UI 展示 */
  courseId?: string | null;
  courseTitle?: string | null;
  sessions: { id: string; title: string; updatedAtLabel: string }[];
};

export function ChatApp({
  sessionId,
  initialMessages,
  userEmail,
  courseId = null,
  courseTitle = null,
  sessions,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wasPending = useRef(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [state, formAction, pending] = useActionState(
    sendChatMessage,
    initialSendMessageState,
  );

  useEffect(() => {
    if (wasPending.current && !pending && state.error === null) {
      router.refresh();
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black text-zinc-100">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-sm font-semibold tracking-tight text-white">
            {courseTitle ? "课程辅导" : "AI 助手"}
          </h1>
          <p className="truncate text-xs text-white/50">{userEmail}</p>
          {courseTitle ? (
            <p className="mt-0.5 truncate text-xs text-[var(--link-blue-on-dark)]">
              课程：{courseTitle}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="rounded-[8px] border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
          >
            {historyOpen ? "收起历史" : "会话历史"}
          </button>
          <form action={createNewChatSession}>
            {courseId ? (
              <input name="courseId" type="hidden" value={courseId} />
            ) : null}
            <button
              type="submit"
              className="rounded-[8px] bg-[var(--interactive-blue)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              {courseId ? "本课程新对话" : "新对话"}
            </button>
          </form>
        </div>
      </header>

      {historyOpen ? (
        <aside className="max-h-[30vh] shrink-0 overflow-hidden border-b border-white/10 px-4 py-3">
          <p className="mb-2 text-xs text-white/50">会话历史</p>
          <ul className="max-h-[24vh] space-y-2 overflow-y-auto pr-1">
            {sessions.map((s) => {
              const active = s.id === sessionId;
              const href = courseId
                ? `/chat?courseId=${encodeURIComponent(courseId)}&sessionId=${encodeURIComponent(s.id)}`
                : `/chat?sessionId=${encodeURIComponent(s.id)}`;
              return (
                <li
                  key={s.id}
                  className={`rounded-[8px] border px-3 py-2 text-xs ${
                    active
                      ? "border-[var(--interactive-blue)]/70 bg-[var(--interactive-blue)]/15"
                      : "border-white/15 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <a
                      className="min-w-0 flex-1 truncate text-zinc-200 hover:text-white hover:underline"
                      href={href}
                    >
                      {s.title}
                    </a>
                    <span className="shrink-0 text-[10px] text-zinc-500">
                      {s.updatedAtLabel}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <form action={renameChatSessionAction} className="flex items-center gap-2">
                      <input type="hidden" name="sessionId" value={s.id} />
                      {courseId ? <input type="hidden" name="courseId" value={courseId} /> : null}
                      <input
                        name="title"
                        defaultValue={s.title}
                        maxLength={80}
                        className="w-36 rounded border border-white/20 bg-black/40 px-2 py-1 text-[11px] text-zinc-200"
                      />
                      <button
                        type="submit"
                        className="rounded border border-white/20 px-2 py-1 text-[11px] text-zinc-200 hover:bg-white/10"
                      >
                        重命名
                      </button>
                    </form>
                    <form
                      action={deleteChatSessionAction}
                      onSubmit={(e) => {
                        const ok = window.confirm("确认删除该会话吗？删除后不可恢复。");
                        if (!ok) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="sessionId" value={s.id} />
                      {courseId ? <input type="hidden" name="courseId" value={courseId} /> : null}
                      <button
                        type="submit"
                        className="rounded border border-red-500/40 px-2 py-1 text-[11px] text-red-300 hover:bg-red-950/40"
                      >
                        删除
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {initialMessages.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/45">
              {courseTitle
                ? "AI 将主要依据该课程的资料与说明作答。输入问题后发送。"
                : "开始与 AI 对话。输入内容后按发送或 Enter。"}
            </p>
          ) : null}
          {initialMessages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 p-3 sm:p-4">
        <form
          ref={formRef}
          action={formAction}
          className="mx-auto flex max-w-3xl flex-col gap-2"
        >
          <input name="sessionId" type="hidden" value={sessionId} />
          {state.error ? (
            <p className="text-sm text-red-400" role="alert">
              {state.error}
            </p>
          ) : null}
          <div className="flex items-end gap-2 rounded-[12px] border border-white/15 bg-white/5 p-2 focus-within:border-[var(--interactive-blue)]/60">
            <textarea
              name="content"
              rows={1}
              placeholder="发送消息…"
              disabled={pending}
              className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:opacity-60"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!pending && formRef.current) {
                    formRef.current.requestSubmit();
                  }
                }
              }}
            />
            <button
              type="submit"
              disabled={pending}
              className="mb-1 shrink-0 rounded-[8px] bg-[var(--interactive-blue)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "…" : "发送"}
            </button>
          </div>
          <p className="text-center text-[11px] text-white/40">
            内容由 AI 生成，请自行核实重要信息。
          </p>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessageVm }) {
  const isUser = message.role === "USER";
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-[12px] px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[#2f2f2f] text-zinc-100"
            : "border border-white/10 bg-[#2a2a2a] text-zinc-200"
        }`}
      >
        {!isUser ? (
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[var(--link-blue-on-dark)]">
            Assistant
          </div>
        ) : (
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            You
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
      </div>
    </div>
  );
}
