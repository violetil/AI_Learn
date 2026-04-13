import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createAssignmentAction,
  createMaterialAction,
} from "@/app/(teacher)/teacher/courses/[courseId]/actions";
import { SectionCard } from "@/components/ui/section-card";
import { requireRole } from "@/lib/authz";
import { getTeacherOwnedCourse } from "@/lib/course-access";
import { prisma } from "@/lib/db";

type Search = { created?: string; materialCreated?: string; error?: string };

const errorMap: Record<string, string> = {
  "missing-title": "作业标题不能为空。",
  "invalid-dueAt": "截止时间格式无效。",
  "missing-material-title": "资料标题不能为空。",
  "file-too-large": "上传文件超过 10MB，请压缩后重试。",
};

export default async function TeacherCourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<Search>;
}) {
  const user = await requireRole("TEACHER");
  const { courseId } = await params;
  const sp = await searchParams;

  const course = await getTeacherOwnedCourse(user.id, courseId);
  if (!course) {
    notFound();
  }

  const assignments = await prisma.assignment.findMany({
    where: { courseId: course.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { records: true } },
    },
  });
  const materials = await prisma.learningMaterial.findMany({
    where: { courseId: course.id },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });

  const memberCount = await prisma.courseMember.count({
    where: { courseId: course.id },
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          课程：{course.title}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          课程码：<code>{course.courseCode}</code> · 成员 {memberCount} 人
        </p>
      </header>

      {sp.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMap[sp.error] ?? "操作失败。"}
        </p>
      ) : null}
      {sp.created ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          作业已创建。
        </p>
      ) : null}
      {sp.materialCreated ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          资料已创建。
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <SectionCard title="发布作业">
          <form action={createAssignmentAction} className="space-y-3 text-sm">
            <input type="hidden" name="courseId" value={course.id} />
            <label className="flex flex-col gap-1">
              <span>标题</span>
              <input
                name="title"
                required
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>说明</span>
              <textarea
                name="description"
                rows={4}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>截止时间（可选）</span>
              <input
                name="dueAt"
                type="datetime-local"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex items-center gap-2">
              <input name="published" type="checkbox" />
              <span>立即发布</span>
            </label>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              创建作业
            </button>
          </form>
        </SectionCard>

        <SectionCard title="添加资料">
          <form action={createMaterialAction} className="space-y-3 text-sm">
            <input type="hidden" name="courseId" value={course.id} />
            <label className="flex flex-col gap-1">
              <span>资料标题</span>
              <input
                name="title"
                required
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>类型</span>
              <select
                name="kind"
                defaultValue="DOCUMENT"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="DOCUMENT">文档</option>
                <option value="LINK">链接</option>
                <option value="VIDEO">视频</option>
                <option value="FILE">文件</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span>URL（可选）</span>
              <input
                name="url"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>内容（可选）</span>
              <textarea
                name="content"
                rows={4}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>上传文件（可选，最大 10MB）</span>
              <input
                type="file"
                name="file"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>说明（可选）</span>
              <input
                name="description"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              添加资料
            </button>
          </form>
        </SectionCard>

        <SectionCard title="作业列表">
          {assignments.length === 0 ? (
            <p className="text-sm text-zinc-500">暂无作业。</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {assignments.map((a) => (
                <li key={a.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                  <p className="font-medium">{a.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    状态：{a.published ? "已发布" : "草稿"} ·
                    提交记录 {a._count.records}
                  </p>
                  {a.dueAt ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      截止：{a.dueAt.toLocaleString()}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs">
                    <Link
                      className="underline underline-offset-4"
                      href={`/teacher/courses/${course.id}/assignments/${a.id}`}
                    >
                      进入审核页
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="操作">
          <div className="space-y-2 text-sm">
            <p>
              <Link className="underline underline-offset-4" href={`/chat?courseId=${course.id}`}>
                进入课程 AI 对话
              </Link>
            </p>
            <p>
              <Link className="underline underline-offset-4" href="/teacher">
                返回教师工作台
              </Link>
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="资料列表">
        {materials.length === 0 ? (
          <p className="text-sm text-zinc-500">暂无资料。</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {materials.map((m) => (
              <li key={m.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{m.title}</p>
                <p className="mt-1 text-xs text-zinc-500">类型：{m.kind}</p>
                {m.url ? (
                  <p className="mt-1 text-xs">
                    <a
                      className="text-zinc-700 underline underline-offset-4 dark:text-zinc-300"
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {m.url}
                    </a>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
