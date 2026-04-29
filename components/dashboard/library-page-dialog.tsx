"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  reviewDashboardAssignmentAction,
  submitDashboardAssignmentAction,
} from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { AssignmentStatusBadge } from "@/components/dashboard/assignment-status-badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  getAssignmentStatusForRole,
  type LibraryItem,
  type StudentAssignmentStatus,
  type UserRole,
} from "@/components/dashboard/library-types";

function LibraryDialogHeader({
  item,
  userRole,
  onClose,
}: {
  item: LibraryItem;
  userRole: UserRole;
  onClose: () => void;
}) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-[rgba(0,0,0,0.06)] px-8 py-6">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-[1.6rem] font-semibold tracking-[-0.015em] text-[rgba(0,0,0,0.88)]">
            {item.name}
          </h2>
          {item.type === "assignment" && item.status ? (
            <AssignmentStatusBadge status={getAssignmentStatusForRole(item.status, userRole)} />
          ) : null}
        </div>
        <p className="text-sm text-[#7a746f]">{item.course}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full px-0" aria-label="更多操作">
          ⋯
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 rounded-full px-3">
          关闭
        </Button>
      </div>
    </header>
  );
}

function LibraryDialogMeta({ item }: { item: LibraryItem }) {
  return (
    <section className="border-b border-[rgba(0,0,0,0.06)] px-8 py-3 text-xs text-[#8a847f]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p>创建者：{item.createdBy}</p>
        <p>创建时间：{item.createdAt}</p>
        <p>最后编辑：{item.lastEdited}</p>
        {item.type === "assignment" ? <p>截止：{item.dueDate ?? "-"}</p> : null}
      </div>
    </section>
  );
}

function LibraryDialogBody({ item }: { item: LibraryItem }) {
  const materialText = item.materialContent || item.description;
  const materialLink = item.materialUrl;

  return (
    <section className="flex-1 space-y-6 overflow-y-auto px-8 py-6 text-[15px] leading-8 text-[rgba(0,0,0,0.9)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <article className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#7a746f]">资料摘要</h3>
        <p className="text-[16px] leading-8 text-[rgba(0,0,0,0.92)]">{item.description || "暂无摘要"}</p>
      </article>

      <article className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#7a746f]">资料内容</h3>
        <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4 text-sm leading-7 text-[#615d59]">
          {materialText || "暂无正文内容。"}
        </div>
      </article>

      {materialLink ? (
        <article className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#7a746f]">资料链接</h3>
          <a
            href={materialLink}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#f8f7f6] px-4 py-3 text-sm text-[#097fe8] underline-offset-2 hover:underline"
          >
            {materialLink}
          </a>
        </article>
      ) : null}
    </section>
  );
}

function StudentAssignmentBody({
  item,
  status,
  onSubmit,
}: {
  item: LibraryItem;
  status: StudentAssignmentStatus;
  onSubmit: (answer: string) => void;
}) {
  const [answer, setAnswer] = useState(item.submissionAnswer ?? "");
  const isReadOnly = status !== "Not Started";

  if (status === "Submitted") {
    return (
      <section className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-6 px-8 py-6">
          <article className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#f8f7f6] p-4">
            <p className="text-sm font-medium text-[rgba(0,0,0,0.9)]">已提交答案</p>
            <p className="mt-2 text-sm leading-7 text-[#615d59]">
              你的答案已提交，等待教师批改。当前内容为只读展示。
            </p>
          </article>
          <article className="space-y-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-5 text-sm leading-8 text-[rgba(0,0,0,0.9)]">
            <p>{item.submissionAnswer || "暂无提交内容。"}</p>
          </article>
        </div>
        <footer className="sticky bottom-0 z-10 flex items-center justify-between border-t border-[rgba(0,0,0,0.06)] bg-white/95 px-8 py-4 backdrop-blur-sm">
          <p className="text-xs text-[#8a847f]">已提交，等待教师批改。</p>
          <Button variant="secondary" disabled>
            已提交
          </Button>
        </footer>
      </section>
    );
  }

  if (status === "Graded") {
    return (
      <section className="flex-1 overflow-hidden px-8 py-6">
        <div className="grid h-full gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(18rem,3fr)]">
          <div className="space-y-6 overflow-y-auto pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <article className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#7a746f]">作业问题</h3>
              <div className="rounded-xl bg-[#f8f7f6] p-4 text-sm leading-7 text-[rgba(0,0,0,0.9)]">
                {item.question || item.description || "暂无作业问题"}
              </div>
            </article>
            <article className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#7a746f]">我的回答</h3>
              <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-5 text-sm leading-8 text-[rgba(0,0,0,0.9)]">
                <p>{item.submissionAnswer || "暂无提交内容。"}</p>
              </div>
            </article>
          </div>
          <aside className="space-y-4 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <article className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#eef8f2] p-4">
              <p className="text-sm font-medium text-[rgba(0,0,0,0.92)]">评分结果</p>
              <p className="mt-2 text-2xl font-semibold text-[rgba(0,0,0,0.9)]">
                {(item.teacherReviewScore ?? item.aiReview?.scoreSuggestion ?? "-")} / 100
              </p>
              <p className="mt-1 text-sm text-[#5f6f64]">教师已完成评分，可根据反馈继续优化。</p>
            </article>
            <article className="space-y-2 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
              <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">教师反馈</p>
              <p className="text-sm leading-7 text-[#615d59]">{item.teacherReviewComment || "暂无文字反馈"}</p>
            </article>
            <article className="space-y-2 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
              <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">AI 评语摘要</p>
              <ul className="space-y-1.5 text-sm leading-6 text-[#615d59]">
                <li>建议分：{item.aiReview?.scoreSuggestion ?? "-"} / 100</li>
                <li>优点：{item.aiReview?.strengths?.join("；") || "暂无"}</li>
                <li>问题：{item.aiReview?.issues?.join("；") || "暂无"}</li>
                <li>建议：{item.aiReview?.suggestions?.join("；") || "暂无"}</li>
              </ul>
            </article>
          </aside>
        </div>
        <footer className="sticky bottom-0 z-10 flex items-center justify-between border-t border-[rgba(0,0,0,0.06)] bg-white/95 px-8 py-4 backdrop-blur-sm">
          <p className="text-xs text-[#8a847f]">已评分，当前为只读模式。</p>
          <Button variant="secondary">查看完整反馈</Button>
        </footer>
      </section>
    );
  }

  return (
    <section className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="space-y-8 px-8 py-6">
        <article className="prose prose-sm max-w-none text-[rgba(0,0,0,0.9)]">
          <h3 className="!mb-3 !text-base !font-semibold !text-[rgba(0,0,0,0.95)]">题目说明</h3>
          <p>{item.question || item.description || "请根据老师发布的问题完成作业。"}</p>
        </article>

        <article className="space-y-3">
          <h4 className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">问题 1：核心观点总结</h4>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            readOnly={isReadOnly}
            placeholder="在这里直接作答，不需要跳转到底部表单。"
            className="min-h-28 w-full rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3 text-sm leading-7 text-[rgba(0,0,0,0.9)] outline-none focus:ring-2 focus:ring-[#097fe8] disabled:cursor-not-allowed disabled:bg-[#f8f7f6]"
          />
        </article>
      </div>

      <footer className="sticky bottom-0 z-10 flex items-center justify-between border-t border-[rgba(0,0,0,0.06)] bg-white/95 px-8 py-4 backdrop-blur-sm">
        <p className="text-xs text-[#8a847f]">
          {isReadOnly
            ? status === "Submitted"
              ? "已提交，当前为只读模式。"
              : "已评分，当前为只读模式。"
            : "输入答案后点击提交，提交后将进入只读模式。"}
        </p>
        <Button disabled={isReadOnly || answer.trim().length === 0} onClick={() => onSubmit(answer)}>
          提交作业
        </Button>
      </footer>
    </section>
  );
}

function TeacherAssignmentBody({
  item,
  studentStatus,
  onReview,
}: {
  item: LibraryItem;
  studentStatus: StudentAssignmentStatus;
  onReview: (status: "APPROVED" | "REJECTED", comment: string, score: number | null) => void;
}) {
  const [score, setScore] = useState(String(item.teacherReviewScore ?? item.aiReview?.scoreSuggestion ?? 86));
  const [comment, setComment] = useState(item.teacherReviewComment || "");
  const parsedScore = score.trim().length > 0 ? Number.parseInt(score, 10) : null;
  const reviewScore = parsedScore !== null && !Number.isNaN(parsedScore) ? parsedScore : null;

  return (
    <section className="flex-1 overflow-hidden px-8 py-6">
      <div className="grid h-full gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(18rem,3fr)]">
        <div className="space-y-6 overflow-y-auto pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <article className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#7a746f]">作业问题</h3>
            <div className="rounded-xl bg-[#f8f7f6] p-4 text-sm leading-7 text-[rgba(0,0,0,0.9)]">
              {item.question || item.description || "暂无作业问题"}
            </div>
          </article>

          <article className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#7a746f]">学生回答</h3>
            <div className="space-y-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-5 text-sm leading-8 text-[rgba(0,0,0,0.9)]">
              <p>{item.submissionAnswer || "当前还没有学生提交答案。"}</p>
            </div>
          </article>
        </div>

        <aside className="space-y-4 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <section className="space-y-3">
            <p className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">AI 初评</p>

            <article className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#f8f7f6] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#7a746f]">建议分</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[rgba(0,0,0,0.9)]">
                {item.aiReview?.scoreSuggestion ?? "-"} / 100
              </p>
              <p className="mt-1 text-xs text-[#8a847f]">模型建议分，仅供教师最终评分参考</p>
            </article>

            <article className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#7a746f]">优点</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#615d59]">
                {(item.aiReview?.strengths?.length ? item.aiReview.strengths : ["暂无"]).map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#7a746f]">问题点</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#615d59]">
                {(item.aiReview?.issues?.length ? item.aiReview.issues : ["暂无"]).map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#7a746f]">改进建议</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#615d59]">
                {(item.aiReview?.suggestions?.length ? item.aiReview.suggestions : ["暂无"]).map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className="space-y-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
            <label className="block text-sm font-medium text-[rgba(0,0,0,0.9)]">评分</label>
            <input
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="h-10 w-full rounded-lg border border-[rgba(0,0,0,0.08)] px-3 text-sm outline-none focus:ring-2 focus:ring-[#097fe8]"
              placeholder="输入分数"
            />

            <label className="block text-sm font-medium text-[rgba(0,0,0,0.9)]">教师反馈</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-24 w-full rounded-lg border border-[rgba(0,0,0,0.08)] px-3 py-2 text-sm leading-7 outline-none focus:ring-2 focus:ring-[#097fe8]"
              placeholder="输入批改反馈"
            />
            <p className="text-xs text-[#8a847f]">
              {studentStatus === "Graded"
                ? "已批改，当前内容为只读参考。"
                : "修改分数和评语后，点击下方按钮提交批改结果。"}
            </p>
          </section>

          <section className="space-y-2 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
            <p className="text-sm font-medium text-[rgba(0,0,0,0.9)]">状态</p>
            <p className="text-sm text-[#615d59]">
              当前：{studentStatus === "Graded" ? "已批改" : "未批改"}
            </p>
            <Button
              className="w-full"
              onClick={() => onReview("APPROVED", comment, reviewScore)}
            >
              标记为已批改
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => onReview("REJECTED", comment, reviewScore)}
            >
              驳回并退回学生
            </Button>
          </section>
        </aside>
      </div>
    </section>
  );
}

export function LibraryPageDialog({
  item,
  open,
  onOpenChange,
  userRole,
}: {
  item: LibraryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: UserRole;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const assignmentStatus: StudentAssignmentStatus =
    item?.type === "assignment" && item.status ? item.status : "Not Started";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[78vh] max-h-[52rem] overflow-hidden p-0">
        {item ? (
          <div className="flex h-full flex-col">
            <DialogTitle className="sr-only">{item.name}</DialogTitle>
            <DialogDescription className="sr-only">
              {item.course} 的内容详情预览弹窗
            </DialogDescription>
            <LibraryDialogHeader
              item={item}
              userRole={userRole}
              onClose={() => onOpenChange(false)}
            />
            <LibraryDialogMeta item={item} />
            {item.type === "assignment" && userRole === "STUDENT" ? (
              <StudentAssignmentBody
                key={item.id}
                item={item}
                status={assignmentStatus}
                onSubmit={(answer) => {
                  setActionError(null);
                  startTransition(async () => {
                    const result = await submitDashboardAssignmentAction({
                      courseId: item.courseId,
                      assignmentId: item.id,
                      answer,
                    });
                    if (!result.success) {
                      setActionError(result.error);
                      return;
                    }
                    router.refresh();
                    onOpenChange(false);
                  });
                }}
              />
            ) : item.type === "assignment" && userRole === "TEACHER" ? (
              <TeacherAssignmentBody
                key={item.id}
                item={item}
                studentStatus={assignmentStatus}
                onReview={(status, comment, score) => {
                  const recordId = item.submissionRecordId;
                  if (!recordId) {
                    setActionError("当前没有可批改的提交记录。");
                    return;
                  }
                  setActionError(null);
                  startTransition(async () => {
                    const result = await reviewDashboardAssignmentAction({
                      courseId: item.courseId,
                      assignmentId: item.id,
                      recordId,
                      status,
                      score: score ?? undefined,
                      comment,
                    });
                    if (!result.success) {
                      setActionError(result.error);
                      return;
                    }
                    router.refresh();
                    onOpenChange(false);
                  });
                }}
              />
            ) : (
              <LibraryDialogBody item={item} />
            )}
            {actionError ? (
              <div className="border-t border-[rgba(0,0,0,0.06)] px-8 py-3 text-xs text-[#8f3a3a]">
                {actionError}
              </div>
            ) : null}
            {isPending ? (
              <div className="border-t border-[rgba(0,0,0,0.06)] px-8 py-3 text-xs text-[#7a746f]">
                正在同步数据...
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
