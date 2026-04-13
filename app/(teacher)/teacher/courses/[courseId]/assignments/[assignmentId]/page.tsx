import Link from "next/link";
import { notFound } from "next/navigation";
import { reviewAssignmentSubmissionAction } from "@/app/(teacher)/teacher/courses/[courseId]/assignments/[assignmentId]/actions";
import { SectionCard } from "@/components/ui/section-card";
import { requireRole } from "@/lib/authz";
import { getTeacherOwnedCourse } from "@/lib/course-access";
import { prisma } from "@/lib/db";

type Search = { reviewed?: string; error?: string; filter?: string };

const errorMap: Record<string, string> = {
  "invalid-status": "审核状态无效，请重试。",
  "record-not-found": "提交记录不存在或已删除。",
};

type AiReviewShape = {
  strengths?: string[];
  issues?: string[];
  suggestions?: string[];
  scoreSuggestion?: number | null;
  mode?: string;
  model?: string;
};

type TeacherReviewShape = {
  status?: string;
  comment?: string | null;
  reviewedAt?: string;
};

function parseReviewMeta(meta: unknown): {
  aiReview: AiReviewShape | null;
  teacherReview: TeacherReviewShape | null;
} {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return { aiReview: null, teacherReview: null };
  }
  const obj = meta as Record<string, unknown>;
  const aiReview =
    obj.aiReview && typeof obj.aiReview === "object" && !Array.isArray(obj.aiReview)
      ? (obj.aiReview as AiReviewShape)
      : null;
  const teacherReview =
    obj.teacherReview &&
    typeof obj.teacherReview === "object" &&
    !Array.isArray(obj.teacherReview)
      ? (obj.teacherReview as TeacherReviewShape)
      : null;
  return { aiReview, teacherReview };
}

export default async function AssignmentReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
  searchParams: Promise<Search>;
}) {
  const user = await requireRole("TEACHER");
  const { courseId, assignmentId } = await params;
  const sp = await searchParams;

  const course = await getTeacherOwnedCourse(user.id, courseId);
  if (!course) {
    notFound();
  }

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, courseId: course.id },
    select: { id: true, title: true, published: true },
  });
  if (!assignment) {
    notFound();
  }

  const records = await prisma.studyRecord.findMany({
    where: {
      courseId: course.id,
      assignmentId: assignment.id,
      recordType: "ASSIGNMENT_SUBMIT",
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  const filter = sp.filter === "pending" || sp.filter === "reviewed" ? sp.filter : "all";
  const withParsed = records.map((record) => ({
    record,
    parsed: parseReviewMeta(record.meta),
  }));
  const reviewedCount = withParsed.filter((x) => Boolean(x.parsed.teacherReview)).length;
  const pendingCount = withParsed.length - reviewedCount;
  const filtered = withParsed.filter((x) => {
    if (filter === "pending") return !x.parsed.teacherReview;
    if (filter === "reviewed") return Boolean(x.parsed.teacherReview);
    return true;
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          作业审核：{assignment.title}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          课程：{course.title} · 状态：{assignment.published ? "已发布" : "草稿"}
        </p>
      </header>

      {sp.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMap[sp.error] ?? "操作失败。"}
        </p>
      ) : null}
      {sp.reviewed ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          审核结果已保存。
        </p>
      ) : null}

      <SectionCard
        title={`提交列表（当前显示 ${filtered.length} / 总计 ${records.length}）`}
      >
        {records.length === 0 ? (
          <p className="text-sm text-zinc-500">暂无学生提交。</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
              <span className="text-zinc-500">筛选：</span>
              <Link
                className={filter === "all" ? "font-semibold underline underline-offset-4" : "underline underline-offset-4"}
                href={`/teacher/courses/${course.id}/assignments/${assignment.id}`}
              >
                全部（{records.length}）
              </Link>
              <Link
                className={filter === "pending" ? "font-semibold underline underline-offset-4" : "underline underline-offset-4"}
                href={`/teacher/courses/${course.id}/assignments/${assignment.id}?filter=pending`}
              >
                待审核（{pendingCount}）
              </Link>
              <Link
                className={filter === "reviewed" ? "font-semibold underline underline-offset-4" : "underline underline-offset-4"}
                href={`/teacher/courses/${course.id}/assignments/${assignment.id}?filter=reviewed`}
              >
                已审核（{reviewedCount}）
              </Link>
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm text-zinc-500">当前筛选条件下暂无记录。</p>
            ) : (
              <ul className="space-y-4">
                {filtered.map(({ record, parsed }) => {
              return (
                <li key={record.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      学生：{record.user.name || record.user.email}
                    </p>
                    <p className="text-xs text-zinc-500">提交时间：{record.createdAt.toLocaleString()}</p>
                    <p className="text-xs text-zinc-500">提交内容：</p>
                    <pre className="whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                      {record.note || "（无文本内容）"}
                    </pre>
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-md border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">AI 初评</p>
                      {parsed.aiReview ? (
                        <div className="mt-2 space-y-2">
                          <p>建议分数：{parsed.aiReview.scoreSuggestion ?? "暂无"}</p>
                          <p>
                            来源：{parsed.aiReview.mode === "live" ? "真实 AI" : "演示模板"} · 模型：
                            {parsed.aiReview.model ?? "未知"}
                          </p>
                          <p>优点：{(parsed.aiReview.strengths ?? []).join("；") || "暂无"}</p>
                          <p>问题：{(parsed.aiReview.issues ?? []).join("；") || "暂无"}</p>
                          <p>建议：{(parsed.aiReview.suggestions ?? []).join("；") || "暂无"}</p>
                        </div>
                      ) : (
                        <p className="mt-2 text-zinc-500">暂无 AI 初评。</p>
                      )}
                    </div>

                    <div className="rounded-md border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">教师审核</p>
                      {parsed.teacherReview ? (
                        <div className="mt-2 space-y-1">
                          <p>状态：{parsed.teacherReview.status}</p>
                          <p>评语：{parsed.teacherReview.comment || "（无）"}</p>
                          <p>
                            时间：
                            {parsed.teacherReview.reviewedAt
                              ? new Date(parsed.teacherReview.reviewedAt).toLocaleString()
                              : "未知"}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-zinc-500">尚未审核。</p>
                      )}
                    </div>
                  </div>

                  <form action={reviewAssignmentSubmissionAction} className="mt-3 space-y-2 text-xs">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="assignmentId" value={assignment.id} />
                    <input type="hidden" name="recordId" value={record.id} />
                    <label className="flex flex-col gap-1">
                      <span>审核结论</span>
                      <select
                        name="status"
                        defaultValue={parsed.teacherReview?.status === "REJECTED" ? "REJECTED" : "APPROVED"}
                        className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                      >
                        <option value="APPROVED">确认通过</option>
                        <option value="REJECTED">驳回修改</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span>教师评语（可选）</span>
                      <textarea
                        name="comment"
                        defaultValue={parsed.teacherReview?.comment ?? ""}
                        rows={3}
                        className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded-md bg-zinc-900 px-3 py-1.5 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      保存审核
                    </button>
                  </form>
                </li>
              );
                })}
              </ul>
            )}
          </>
        )}
      </SectionCard>

      <div className="text-sm">
        <Link className="underline underline-offset-4" href={`/teacher/courses/${course.id}`}>
          返回课程详情
        </Link>
      </div>
    </div>
  );
}
