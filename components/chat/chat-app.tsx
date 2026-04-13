"use client";

import { useEffect, useRef, useActionState } from "react";
import { useRouter } from "next/navigation";
import { createNewChatSession, sendChatMessage } from "@/app/(chat)/chat/actions";
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
};

export function ChatApp({
  sessionId,
  initialMessages,
  userEmail,
  courseId = null,
  courseTitle = null,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wasPending = useRef(false);

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
    <div className="flex h-[100dvh] w-full flex-col bg-[#212121] text-zinc-100">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-700/80 px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">
            {courseTitle ? "课程辅导" : "AI 助手"}
          </h1>
          <p className="truncate text-xs text-zinc-500">{userEmail}</p>
          {courseTitle ? (
            <p className="mt-0.5 truncate text-xs text-emerald-400/90">
              课程：{courseTitle}
            </p>
          ) : null}
        </div>
        <form action={createNewChatSession}>
          {courseId ? (
            <input name="courseId" type="hidden" value={courseId} />
          ) : null}
          <button
            type="submit"
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700"
          >
            {courseId ? "本课程新对话" : "新对话"}
          </button>
        </form>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {initialMessages.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
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

      <div className="shrink-0 border-t border-zinc-700/80 p-3 sm:p-4">
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
          <div className="flex items-end gap-2 rounded-2xl border border-zinc-600 bg-zinc-800/80 p-2 shadow-inner focus-within:border-zinc-500">
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
              className="mb-1 shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {pending ? "…" : "发送"}
            </button>
          </div>
          <p className="text-center text-[11px] text-zinc-600">
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
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[#2f2f2f] text-zinc-100"
            : "border border-zinc-700/60 bg-[#2a2a2a] text-zinc-200"
        }`}
      >
        {!isUser ? (
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-emerald-500/90">
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
