import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createAssignmentAction,
  createMaterialAction,
} from "@/app/(teacher)/teacher/courses/[courseId]/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { requireRole } from "@/lib/authz";
import { getTeacherOwnedCourse } from "@/lib/course-access";
import { prisma } from "@/lib/db";
import { StudyRecordType } from "../../../../../node_modules/.prisma/client/default";

type Search = {
  created?: string;
  materialCreated?: string;
  error?: string;
  tab?: string;
  aPage?: string;
  mPage?: string;
};

const ASSIGN_PAGE_SIZE = 6;
const MAT_PAGE_SIZE = 8;

const errorMap: Record<string, string> = {
  "missing-title": "作业标题不能为空。",
  "invalid-dueAt": "截止时间格式无效。",
  "missing-material-title": "资料标题不能为空。",
  "file-too-large": "上传文件超过 10MB，请压缩后重试。",
};

function teacherCourseHref(
  courseId: string,
  sp: Search,
  extra: Record<string, string | undefined>,
) {
  const n = new URLSearchParams();
  if (sp.created) n.set("created", sp.created);
  if (sp.materialCreated) n.set("materialCreated", sp.materialCreated);
  if (sp.error) n.set("error", sp.error);
  for (const [k, v] of Object.entries(extra)) {
    if (v) n.set(k, v);
  }
  const qs = n.toString();
  return qs ? `/teacher/courses/${courseId}?${qs}` : `/teacher/courses/${courseId}`;
}

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

  const tabRaw = sp.tab?.trim() ?? "assignments";
  const tab =
    tabRaw === "materials" || tabRaw === "analytics" ? tabRaw : "assignments";
  const aPage = Math.max(1, Number.parseInt(sp.aPage ?? "1", 10) || 1);
  const mPage = Math.max(1, Number.parseInt(sp.mPage ?? "1", 10) || 1);

  const memberCount = await prisma.courseMember.count({
    where: { courseId: course.id },
  });

  const assignmentTotal = await prisma.assignment.count({
    where: { courseId: course.id },
  });
  const materialTotal = await prisma.learningMaterial.count({
    where: { courseId: course.id },
  });

  const assignments =
    tab === "assignments"
      ? await prisma.assignment.findMany({
          where: { courseId: course.id },
          orderBy: { createdAt: "desc" },
          skip: (aPage - 1) * ASSIGN_PAGE_SIZE,
          take: ASSIGN_PAGE_SIZE,
          include: {
            _count: { select: { records: true } },
          },
        })
      : [];

  const materials =
    tab === "materials"
      ? await prisma.learningMaterial.findMany({
          where: { courseId: course.id },
          orderBy: [{ position: "asc" }, { createdAt: "desc" }],
          skip: (mPage - 1) * MAT_PAGE_SIZE,
          take: MAT_PAGE_SIZE,
        })
      : [];

  let submissionCount = 0;
  let submitterCount = 0;
  type RecentRow = {
    id: string;
    recordType: StudyRecordType;
    createdAt: Date;
    user: { email: string; name: string | null };
    assignment: { title: string } | null;
  };
  let recentActivity: RecentRow[] = [];
  if (tab === "analytics") {
    submissionCount = await prisma.studyRecord.count({
      where: {
        courseId: course.id,
        recordType: StudyRecordType.ASSIGNMENT_SUBMIT,
      },
    });
    const grouped = await prisma.studyRecord.groupBy({
      by: ["userId"],
      where: {
        courseId: course.id,
        recordType: StudyRecordType.ASSIGNMENT_SUBMIT,
      },
      _count: true,
    });
    submitterCount = grouped.length;
    const rows = await prisma.studyRecord.findMany({
      where: { courseId: course.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        user: { select: { email: true, name: true } },
        assignment: { select: { title: true } },
      },
    });
    recentActivity = rows as RecentRow[];
  }

  const assignmentPages = Math.max(1, Math.ceil(assignmentTotal / ASSIGN_PAGE_SIZE));
  const materialPages = Math.max(1, Math.ceil(materialTotal / MAT_PAGE_SIZE));

  const tabLinkClass = (active: boolean) =>
    `-mb-px border-b-2 pb-3 text-sm font-medium transition ${
      active
        ? "border-[var(--interactive-blue)] text-[var(--interactive-blue)]"
        : "border-transparent text-[var(--app-subtle)] hover:text-[var(--app-fg)]"
    }`;

  return (
    <div className="mx-auto flex w-full max-w-[61.25rem] flex-1 flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--app-fg)]">
          课程：{course.title}
        </h1>
        <p className="text-sm text-[var(--app-subtle)]">
          课程码：<code className="rounded bg-[var(--app-muted)] px-1">{course.courseCode}</code> ·
          成员 {memberCount} 人
        </p>
      </header>

      {sp.error ? (
        <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {errorMap[sp.error] ?? "操作失败。"}
        </p>
      ) : null}
      <nav className="flex flex-wrap gap-4 border-b border-[var(--app-border)]">
        <Link
          href={teacherCourseHref(course.id, sp, { tab: "assignments", aPage: "1" })}
          className={tabLinkClass(tab === "assignments")}
        >
          作业
        </Link>
        <Link
          href={teacherCourseHref(course.id, sp, { tab: "materials", mPage: "1" })}
          className={tabLinkClass(tab === "materials")}
        >
          资料
        </Link>
        <Link
          href={teacherCourseHref(course.id, sp, { tab: "analytics" })}
          className={tabLinkClass(tab === "analytics")}
        >
          学习分析
        </Link>
      </nav>

      {tab === "assignments" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="发布作业">
            <form action={createAssignmentAction} className="space-y-3 text-sm">
              <input type="hidden" name="courseId" value={course.id} />
              <label className="flex flex-col gap-1">
                <span>标题</span>
                <input
                  name="title"
                  required
                  className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>说明</span>
                <textarea
                  name="description"
                  rows={4}
                  className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>截止时间（可选）</span>
                <input
                  name="dueAt"
                  type="datetime-local"
                  className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2"
                />
              </label>
              <label className="flex items-center gap-2">
                <input name="published" type="checkbox" />
                <span>立即发布</span>
              </label>
              <button
                type="submit"
                className="rounded-[8px] bg-[var(--interactive-blue)] px-3 py-2 text-white hover:opacity-90"
              >
                创建作业
              </button>
            </form>
          </SectionCard>

          <SectionCard title={`作业列表（第 ${aPage} / ${assignmentPages} 页）`}>
            {assignments.length === 0 ? (
              <EmptyState title="暂无作业" description="发布作业后，学生即可查看与提交。" />
            ) : (
              <>
                <ul className="space-y-3 text-sm">
                  {assignments.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-[8px] border border-[var(--app-border)] p-3"
                    >
                      <p className="font-medium text-[var(--app-fg)]">{a.title}</p>
                      <p className="mt-1 text-xs text-[var(--app-subtle)]">
                        状态：{a.published ? "已发布" : "草稿"} · 提交记录 {a._count.records}
                      </p>
                      {a.dueAt ? (
                        <p className="mt-1 text-xs text-[var(--app-subtle)]">
                          截止：{a.dueAt.toLocaleString()}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs">
                        <Link
                          className="text-[var(--link-blue)] underline-offset-4 hover:underline"
                          href={`/teacher/courses/${course.id}/assignments/${a.id}`}
                        >
                          进入审核页
                        </Link>
                      </p>
                    </li>
                  ))}
                </ul>
                {assignmentPages > 1 ? (
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {aPage > 1 ? (
                      <Link
                        className="rounded-[8px] border border-[var(--app-border)] px-2 py-1 hover:bg-[var(--app-muted)]"
                        href={teacherCourseHref(course.id, sp, {
                          tab: "assignments",
                          aPage: String(aPage - 1),
                        })}
                      >
                        上一页
                      </Link>
                    ) : null}
                    {aPage < assignmentPages ? (
                      <Link
                        className="rounded-[8px] border border-[var(--app-border)] px-2 py-1 hover:bg-[var(--app-muted)]"
                        href={teacherCourseHref(course.id, sp, {
                          tab: "assignments",
                          aPage: String(aPage + 1),
                        })}
                      >
                        下一页
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </SectionCard>

          <div className="lg:col-span-2">
            <SectionCard title="快捷操作">
              <div className="flex flex-wrap gap-4 text-sm">
                <Link
                  className="text-[var(--link-blue)] underline-offset-4 hover:underline"
                  href={`/chat?courseId=${course.id}`}
                >
                  进入课程 AI 对话
                </Link>
                <Link
                  className="text-[var(--link-blue)] underline-offset-4 hover:underline"
                  href="/teacher"
                >
                  返回教师工作台
                </Link>
              </div>
            </SectionCard>
          </div>
        </div>
      ) : null}

      {tab === "materials" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="添加资料">
            <form action={createMaterialAction} className="space-y-3 text-sm">
              <input type="hidden" name="courseId" value={course.id} />
              <label className="flex flex-col gap-1">
                <span>资料标题</span>
                <input
                  name="title"
                  required
                  className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>类型</span>
                <select
                  name="kind"
                  defaultValue="DOCUMENT"
                  className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2"
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
                  className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>内容（可选）</span>
                <textarea
                  name="content"
                  rows={4}
                  className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>上传文件（可选，最大 10MB）</span>
                <input
                  type="file"
                  name="file"
                  className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>说明（可选）</span>
                <input
                  name="description"
                  className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2"
                />
              </label>
              <button
                type="submit"
                className="rounded-[8px] bg-[var(--interactive-blue)] px-3 py-2 text-white hover:opacity-90"
              >
                添加资料
              </button>
            </form>
          </SectionCard>

          <SectionCard title={`资料列表（第 ${mPage} / ${materialPages} 页）`}>
            {materials.length === 0 ? (
              <EmptyState title="暂无学习资料" description="上传文档、链接或文件，供学生课前预习。" />
            ) : (
              <>
                <ul className="space-y-3 text-sm">
                  {materials.map((m) => (
                    <li
                      key={m.id}
                      className="rounded-[8px] border border-[var(--app-border)] p-3"
                    >
                      <p className="font-medium text-[var(--app-fg)]">{m.title}</p>
                      <p className="mt-1 text-xs text-[var(--app-subtle)]">类型：{m.kind}</p>
                      {m.url ? (
                        <p className="mt-1 text-xs">
                          <a
                            className="text-[var(--link-blue)] underline-offset-4 hover:underline"
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
                {materialPages > 1 ? (
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {mPage > 1 ? (
                      <Link
                        className="rounded-[8px] border border-[var(--app-border)] px-2 py-1 hover:bg-[var(--app-muted)]"
                        href={teacherCourseHref(course.id, sp, {
                          tab: "materials",
                          mPage: String(mPage - 1),
                        })}
                      >
                        上一页
                      </Link>
                    ) : null}
                    {mPage < materialPages ? (
                      <Link
                        className="rounded-[8px] border border-[var(--app-border)] px-2 py-1 hover:bg-[var(--app-muted)]"
                        href={teacherCourseHref(course.id, sp, {
                          tab: "materials",
                          mPage: String(mPage + 1),
                        })}
                      >
                        下一页
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </SectionCard>
        </div>
      ) : null}

      {tab === "analytics" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="提交概览">
            <ul className="space-y-2 text-sm text-[var(--app-fg)]">
              <li>作业提交总次数：{submissionCount}</li>
              <li>有提交记录的学生数：{submitterCount}</li>
              <li>课程成员数：{memberCount}</li>
            </ul>
          </SectionCard>
          <SectionCard title="最近学习活动">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-[var(--app-subtle)]">暂无记录。</p>
            ) : (
              <ul className="max-h-[420px] space-y-2 overflow-y-auto text-xs">
                {recentActivity.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-[8px] border border-[var(--app-border)] p-2"
                  >
                    <p className="font-medium text-[var(--app-fg)]">
                      {r.recordType} · {r.user.name || r.user.email}
                    </p>
                    <p className="text-[var(--app-subtle)]">
                      {r.createdAt.toLocaleString()}
                      {r.assignment ? ` · ${r.assignment.title}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      ) : null}
    </div>
  );
}
