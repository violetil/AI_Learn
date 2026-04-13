import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { requireRole } from "@/lib/authz";

export default async function StudentDashboardPage() {
  const user = await requireRole("STUDENT");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          学生工作台
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          欢迎，{user.email}。当前阶段已完成角色分流，后续在此扩展选课、任务与作业提交。
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="学习流程（下一步）">
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>加入课程（CourseMember）</li>
            <li>查看资料与学习任务</li>
            <li>提交作业并查看反馈</li>
          </ul>
        </SectionCard>
        <SectionCard title="AI 辅助（已可用基础）">
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>课程上下文学习问答</li>
            <li>学习过程答疑与总结</li>
            <li>个性化复习建议（后续）</li>
          </ul>
        </SectionCard>
      </div>

      <div className="flex gap-3 text-sm">
        <Link className="underline underline-offset-4" href="/chat">
          进入 AI 对话
        </Link>
        <Link className="underline underline-offset-4" href="/">
          返回首页
        </Link>
      </div>
    </div>
  );
}
