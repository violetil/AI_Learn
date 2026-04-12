/** 对话主界面占位：后续接入流式输出、消息列表等 */
export function ChatPanel() {
  return (
    <div className="flex min-h-[320px] w-full max-w-2xl flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 pb-3 text-sm font-medium text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
        对话
      </header>
      <div className="flex flex-1 items-center justify-center py-12 text-sm text-zinc-500">
        在此放置聊天消息与输入框。
      </div>
    </div>
  );
}
