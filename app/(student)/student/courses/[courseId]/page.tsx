import Link from "next/link";
import { notFound } from "next/navigation";
import { StudyRecordType } from "../../../../../node_modules/.prisma/client/default";
import { submitAssignmentAction } from "@/app/(student)/student/courses/[courseId]/actions";
import { SectionCard } from "@/components/ui/section-card";
import { requireRole } from "@/lib/authz";
import { getStudentCourseMembership } from "@/lib/course-access";
import { prisma } from "@/lib/db";

type Search = { submitted?: string; error?: string; ai?: string };

const errorMap: Record<string, string> = {
  "empty-answer": "提交内容不能为空。",
  "assignment-not-found": "作业不存在或尚未发布。",
};

export default async function StudentCourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<Search>;
}) {
  const user = await requireRole("STUDENT");
  const { courseId } = await params;
  const sp = await searchParams;

  const membership = await getStudentCourseMembership(user.id, courseId);
  if (!membership) {
    notFound();
  }

  const assignments = await prisma.assignment.findMany({
    where: { courseId, published: true },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  });
  const materials = await prisma.learningMaterial.findMany({
    where: { courseId },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });

  const records = await prisma.studyRecord.findMany({
    where: {
      userId: user.id,
      courseId,
      recordType: StudyRecordType.ASSIGNMENT_SUBMIT,
      assignmentId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: {
      assignmentId: true,
      createdAt: true,
      note: true,
    },
  });

  const latestByAssignment = new Map<string, (typeof records)[number]>();
  for (const r of records) {
    if (!r.assignmentId) continue;
    if (!latestByAssignment.has(r.assignmentId)) {
      latestByAssignment.set(r.assignmentId, r);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          课程：{membership.course.title}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          使用课程 AI 对话和作业提交流程完成学习任务。
        </p>
      </header>

      {sp.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMap[sp.error] ?? "提交失败。"}
        </p>
      ) : null}
      {sp.submitted ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          作业提交成功。
        </p>
      ) : null}
      {sp.ai === "live" ? (
        <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          AI 初评已生成，教师可在审核环节查看并给出最终意见。
        </p>
      ) : null}
      {sp.ai === "demo" ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          当前未配置或暂时无法使用 AI API，系统已用演示评语模板完成初评，不影响提交流程。
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="课程资料">
          {materials.length === 0 ? (
            <p className="text-sm text-zinc-500">教师暂未上传资料。</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {materials.map((m) => (
                <li key={m.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{m.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">类型：{m.kind}</p>
                  {m.description ? (
                    <p className="mt-1 text-xs text-zinc-500">{m.description}</p>
                  ) : null}
                  {m.url ? (
                    <p className="mt-1 text-xs">
                      <a
                        className="text-zinc-700 underline underline-offset-4 dark:text-zinc-300"
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        打开资料链接
                      </a>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="课程作业（已发布）">
          {assignments.length === 0 ? (
            <p className="text-sm text-zinc-500">教师暂未发布作业。</p>
          ) : (
            <ul className="space-y-4 text-sm">
              {assignments.map((a) => {
                const latest = latestByAssignment.get(a.id);
                return (
                  <li key={a.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{a.title}</p>
                    {a.description ? (
                      <p className="mt-1 text-xs text-zinc-500">{a.description}</p>
                    ) : null}
                    {a.dueAt ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        截止：{a.dueAt.toLocaleString()}
                      </p>
                    ) : null}
                    {latest ? (
                      <p className="mt-1 text-xs text-emerald-600">
                        最近提交：{latest.createdAt.toLocaleString()}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-zinc-500">尚未提交</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="提交作业">
          {assignments.length === 0 ? (
            <p className="text-sm text-zinc-500">暂无可提交作业。</p>
          ) : (
            <form action={submitAssignmentAction} className="space-y-3 text-sm">
              <input type="hidden" name="courseId" value={courseId} />
              <label className="flex flex-col gap-1">
                <span>选择作业</span>
                <select
                  name="assignmentId"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span>提交内容（文本）</span>
                <textarea
                  name="answer"
                  required
                  rows={8}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                提交作业
              </button>
            </form>
          )}
        </SectionCard>
      </div>

      <div className="flex gap-3 text-sm">
        <Link className="underline underline-offset-4" href={`/chat?courseId=${courseId}`}>
          进入本课程 AI 对话
        </Link>
        <Link className="underline underline-offset-4" href="/student">
          返回学生工作台
        </Link>
      </div>
    </div>
  );
}
