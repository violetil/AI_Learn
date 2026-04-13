import Link from "next/link";
import { joinCourseAction } from "@/app/(student)/student/actions";
import { SectionCard } from "@/components/ui/section-card";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";

type Search = { joined?: string; error?: string };

const studentErrorMap: Record<string, string> = {
  "missing-code": "请输入课程码。",
  "course-not-found": "课程码不存在，请检查后重试。",
};

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requireRole("STUDENT");
  const sp = await searchParams;

  const myCourses = await prisma.courseMember.findMany({
    where: { userId: user.id },
    orderBy: { joinedAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          courseCode: true,
          status: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          学生工作台
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          欢迎，{user.email}。你可以通过课程码加入课程并开始学习。
        </p>
      </header>

      {sp.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {studentErrorMap[sp.error] ?? "加入课程失败，请稍后重试。"}
        </p>
      ) : null}
      {sp.joined ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          已成功加入课程。
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="加入课程">
          <form action={joinCourseAction} className="space-y-3 text-sm">
            <label className="flex flex-col gap-1">
              <span className="text-zinc-700 dark:text-zinc-300">课程码</span>
              <input
                name="courseCode"
                required
                placeholder="例如 C-ABC123-1XYZ"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 uppercase outline-none focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              加入
            </button>
          </form>
        </SectionCard>

        <SectionCard title="我的课程">
          {myCourses.length === 0 ? (
            <p className="text-sm text-zinc-500">还未加入任何课程。</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {myCourses.map((m) => (
                <li key={m.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{m.course.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    课程码：<code>{m.course.courseCode}</code> · 状态 {m.course.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="下一步计划">
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>查看资料与学习任务</li>
            <li>提交作业并查看反馈</li>
            <li>课程内 AI 学习问答</li>
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
