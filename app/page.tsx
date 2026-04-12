import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-16">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          AI Learn — 毕业设计
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          按功能模块划分的 Next.js App Router 骨架，可从下方进入各模块。
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <SectionCard title="认证 auth">
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
                href="/login"
              >
                /login
              </Link>
              <span className="text-zinc-500"> — 登录页</span>
            </li>
            <li>
              <Link
                className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
                href="/register"
              >
                /register
              </Link>
              <span className="text-zinc-500"> — 注册页</span>
            </li>
          </ul>
        </SectionCard>

        <SectionCard title="对话 chat">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <Link
              className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
              href="/chat"
            >
              /chat
            </Link>
            <span className="text-zinc-500"> — 聊天界面占位</span>
          </p>
        </SectionCard>
      </div>

      <SectionCard title="API 示例">
        <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <li>
            <code className="text-zinc-900 dark:text-zinc-200">
              GET /api/auth/session
            </code>
          </li>
          <li>
            <code className="text-zinc-900 dark:text-zinc-200">
              POST /api/chat
            </code>
            <span> — body: {"{ \"message\": \"...\" }"}</span>
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
