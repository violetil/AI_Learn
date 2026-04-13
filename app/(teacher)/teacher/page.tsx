import Link from "next/link";
import { createCourseAction } from "@/app/(teacher)/teacher/actions";
import { SectionCard } from "@/components/ui/section-card";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";

type Search = { created?: string; error?: string };

const teacherErrorMap: Record<string, string> = {
  "missing-title": "课程标题不能为空。",
  "title-too-long": "课程标题不能超过 120 字符。",
};

export default async function TeacherDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requireRole("TEACHER");
  const sp = await searchParams;

  const courses = await prisma.learningCourse.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true } },
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          教师工作台
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          欢迎，{user.email}。你可以创建课程并将课程码发给学生加入。
        </p>
      </header>

      {sp.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {teacherErrorMap[sp.error] ?? "创建课程失败，请稍后重试。"}
        </p>
      ) : null}
      {sp.created ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          课程创建成功。
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="创建课程">
          <form action={createCourseAction} className="space-y-3 text-sm">
            <label className="flex flex-col gap-1">
              <span className="text-zinc-700 dark:text-zinc-300">课程标题</span>
              <input
                name="title"
                required
                maxLength={120}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-zinc-700 dark:text-zinc-300">课程简介</span>
              <textarea
                name="description"
                rows={3}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-zinc-700 dark:text-zinc-300">发布状态</span>
              <select
                name="status"
                defaultValue="DRAFT"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="DRAFT">草稿</option>
                <option value="PUBLISHED">发布</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              创建课程
            </button>
          </form>
        </SectionCard>

        <SectionCard title="我的课程">
          {courses.length === 0 ? (
            <p className="text-sm text-zinc-500">还没有课程，先创建第一门课。</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {courses.map((course) => (
                <li key={course.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{course.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    课程码：<code>{course.courseCode}</code> · 成员 {course._count.members} 人
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="下一步计划">
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>发布学习任务与作业</li>
            <li>上传课程学习资料</li>
            <li>AI 学情自动分析</li>
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
