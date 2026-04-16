import Link from "next/link";
import { notFound } from "next/navigation";
import { StudyRecordType } from "../../../../../node_modules/.prisma/client/default";
import { submitAssignmentAction } from "@/app/(student)/student/courses/[courseId]/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { requireRole } from "@/lib/authz";
import { getStudentCourseMembership } from "@/lib/course-access";
import { prisma } from "@/lib/db";

type Search = { submitted?: string; error?: string; ai?: string; ap?: string };

const ASSIGN_LIST_PAGE_SIZE = 5;

const errorMap: Record<string, string> = {
  "empty-answer": "提交内容不能为空。",
  "assignment-not-found": "作业不存在或尚未发布。",
  "rate-limit": "操作过于频繁，请稍后再试。",
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

  const ap = Math.max(1, Number.parseInt(sp.ap ?? "1", 10) || 1);
  const assignPages = Math.max(1, Math.ceil(assignments.length / ASSIGN_LIST_PAGE_SIZE));
  const apSafe = Math.min(ap, assignPages);
  const assignStart = (apSafe - 1) * ASSIGN_LIST_PAGE_SIZE;
  const assignmentsPage = assignments.slice(
    assignStart,
    assignStart + ASSIGN_LIST_PAGE_SIZE,
  );
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
      id: true,
      assignmentId: true,
      createdAt: true,
      note: true,
      meta: true,
    },
  });

  const latestByAssignment = new Map<string, (typeof records)[number]>();
  for (const r of records) {
    if (!r.assignmentId) continue;
    if (!latestByAssignment.has(r.assignmentId)) {
      latestByAssignment.set(r.assignmentId, r);
    }
  }

  function parseTeacherReview(meta: unknown): {
    status: string | null;
    comment: string | null;
    reviewedAt: string | null;
  } {
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
      return { status: null, comment: null, reviewedAt: null };
    }
    const obj = meta as Record<string, unknown>;
    const review =
      obj.teacherReview &&
      typeof obj.teacherReview === "object" &&
      !Array.isArray(obj.teacherReview)
        ? (obj.teacherReview as Record<string, unknown>)
        : null;
    if (!review) {
      return { status: null, comment: null, reviewedAt: null };
    }
    return {
      status: typeof review.status === "string" ? review.status : null,
      comment: typeof review.comment === "string" ? review.comment : null,
      reviewedAt: typeof review.reviewedAt === "string" ? review.reviewedAt : null,
    };
  }

  function parseAiReview(meta: unknown): {
    scoreSuggestion: number | null;
    strengths: string[];
    issues: string[];
    suggestions: string[];
    mode: string | null;
  } {
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
      return {
        scoreSuggestion: null,
        strengths: [],
        issues: [],
        suggestions: [],
        mode: null,
      };
    }
    const obj = meta as Record<string, unknown>;
    const aiReview =
      obj.aiReview &&
      typeof obj.aiReview === "object" &&
      !Array.isArray(obj.aiReview)
        ? (obj.aiReview as Record<string, unknown>)
        : null;
    if (!aiReview) {
      return {
        scoreSuggestion: null,
        strengths: [],
        issues: [],
        suggestions: [],
        mode: null,
      };
    }
    const toList = (value: unknown) =>
      Array.isArray(value) ? value.map(String).map((v) => v.trim()).filter(Boolean) : [];
    return {
      scoreSuggestion:
        typeof aiReview.scoreSuggestion === "number" ? aiReview.scoreSuggestion : null,
      strengths: toList(aiReview.strengths),
      issues: toList(aiReview.issues),
      suggestions: toList(aiReview.suggestions),
      mode: typeof aiReview.mode === "string" ? aiReview.mode : null,
    };
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
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="课程资料">
          {materials.length === 0 ? (
            <EmptyState title="暂无资料" description="教师上传后，你将在此查看课件与链接。" />
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
            <EmptyState title="暂无已发布作业" description="请等待教师发布作业后再查看与提交。" />
          ) : (
            <>
            <ul className="space-y-4 text-sm">
              {assignmentsPage.map((a) => {
                const latest = latestByAssignment.get(a.id);
                const teacherReview = latest
                  ? parseTeacherReview(latest.meta)
                  : { status: null, comment: null, reviewedAt: null };
                const aiReview = latest
                  ? parseAiReview(latest.meta)
                  : {
                      scoreSuggestion: null,
                      strengths: [],
                      issues: [],
                      suggestions: [],
                      mode: null,
                    };
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
                      <p className="mt-1 text-xs text-[var(--interactive-blue)]">
                        最近提交：{latest.createdAt.toLocaleString()}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-zinc-500">尚未提交</p>
                    )}
                    {teacherReview.status ? (
                      <div className="mt-2 rounded-[8px] border border-[var(--interactive-blue)]/25 bg-[var(--interactive-blue)]/10 p-2 text-xs text-[var(--interactive-blue)]">
                        <p>
                          教师审核：
                          {teacherReview.status === "APPROVED"
                            ? "已通过"
                            : teacherReview.status === "REJECTED"
                              ? "已驳回"
                              : teacherReview.status}
                          {teacherReview.reviewedAt
                            ? `（${new Date(teacherReview.reviewedAt).toLocaleString()}）`
                            : ""}
                        </p>
                        <p className="mt-1 text-[var(--app-fg)]">
                          教师评语：{teacherReview.comment?.trim() || "（教师未填写评语）"}
                        </p>
                      </div>
                    ) : latest ? (
                      <div className="mt-2 rounded-[8px] border border-[var(--app-border)] bg-[var(--app-muted)] p-2 text-xs text-[var(--app-subtle)]">
                        教师审核：待审核（最近一次提交已送达教师端）
                      </div>
                    ) : null}
                    {latest && (aiReview.scoreSuggestion !== null ||
                    aiReview.strengths.length > 0 ||
                    aiReview.issues.length > 0 ||
                    aiReview.suggestions.length > 0) ? (
                      <div className="mt-2 rounded-[8px] border border-[var(--interactive-blue)]/20 bg-[var(--interactive-blue)]/8 p-2 text-xs text-[var(--app-fg)]">
                        <p>
                          AI 初评：建议分数 {aiReview.scoreSuggestion ?? "暂无"} · 来源
                          {aiReview.mode === "live" ? "真实 AI" : "演示模板"}
                        </p>
                        {aiReview.strengths.length > 0 ? (
                          <p className="mt-1">优点：{aiReview.strengths.join("；")}</p>
                        ) : null}
                        {aiReview.issues.length > 0 ? (
                          <p className="mt-1">问题：{aiReview.issues.join("；")}</p>
                        ) : null}
                        {aiReview.suggestions.length > 0 ? (
                          <p className="mt-1">建议：{aiReview.suggestions.join("；")}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {assignments.length > ASSIGN_LIST_PAGE_SIZE ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--app-subtle)]">
                {apSafe > 1 ? (
                  <Link
                    className="text-[var(--link-blue)] underline-offset-4 hover:underline"
                    href={`/student/courses/${courseId}?ap=${apSafe - 1}`}
                  >
                    上一页
                  </Link>
                ) : null}
                <span>
                  第 {apSafe} / {assignPages} 页
                </span>
                {apSafe < assignPages ? (
                  <Link
                    className="text-[var(--link-blue)] underline-offset-4 hover:underline"
                    href={`/student/courses/${courseId}?ap=${apSafe + 1}`}
                  >
                    下一页
                  </Link>
                ) : null}
              </div>
            ) : null}
            </>
          )}
        </SectionCard>

        <SectionCard title="提交作业">
          {assignments.length === 0 ? (
            <EmptyState title="当前无可提交项" description="教师发布作业后即可在此提交答案。" />
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
