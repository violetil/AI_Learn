import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { SectionCard } from "@/components/ui/section-card";
import { getSessionUser } from "@/lib/auth";

const roleLabel = {
  TEACHER: "教师",
  STUDENT: "学生",
} as const;

function roleHome(role: "TEACHER" | "STUDENT") {
  return role === "TEACHER" ? "/teacher" : "/student";
}

export default async function Home() {
  const user = await getSessionUser();
  const userRole =
    user && "role" in user
      ? ((user as { role: "TEACHER" | "STUDENT" }).role ?? "STUDENT")
      : "STUDENT";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            AI Learn — 智能学习辅助系统
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            支持教师与学生双角色，课程学习与 AI 辅助对话。
          </p>
        </div>
        {user ? (
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              已登录：<span className="font-medium text-zinc-900 dark:text-zinc-100">{user.email}</span>
              <span className="ml-2 rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {roleLabel[userRole]}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
                href={roleHome(userRole)}
              >
                进入工作台
              </Link>
              <Link
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
                href="/chat"
              >
                AI 聊天
              </Link>
              <LogoutButton />
            </div>
          </div>
        ) : (
          <div className="flex gap-3 text-sm">
            <Link
              className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
              href="/login"
            >
              登录
            </Link>
            <Link
              className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
              href="/register"
            >
              注册
            </Link>
          </div>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <SectionCard title="角色工作台">
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li><code className="text-zinc-900 dark:text-zinc-100">/teacher</code> — 教师端首页</li>
            <li><code className="text-zinc-900 dark:text-zinc-100">/student</code> — 学生端首页</li>
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
            <span className="text-zinc-500"> — 课程上下文 AI 对话</span>
          </p>
        </SectionCard>
      </div>

      <SectionCard title="下一步（阶段 2）">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          继续实现课程成员（加入课程）和教师发布任务/作业。
        </p>
      </SectionCard>
    </div>
  );
}
