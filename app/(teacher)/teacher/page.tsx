import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { requireRole } from "@/lib/authz";

export default async function TeacherDashboardPage() {
  const user = await requireRole("TEACHER");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          教师工作台
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          欢迎，{user.email}。当前阶段已完成角色分流，后续在此扩展课程管理与学情分析。
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="课程管理（下一步）">
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>创建课程（LearningCourse）</li>
            <li>发布学习任务与作业</li>
            <li>上传课程学习资料</li>
          </ul>
        </SectionCard>
        <SectionCard title="AI 功能（规划）">
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>AI 批改作业草稿</li>
            <li>班级学习情况自动分析</li>
            <li>风险学生预警与建议</li>
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
