"use client";

import { useEffect, useState } from "react";
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
          Close
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
  return (
    <section className="flex-1 space-y-6 overflow-y-auto px-8 py-6 text-[15px] leading-8 text-[rgba(0,0,0,0.9)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <article className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#7a746f]">核心内容</h3>
        <p className="text-[16px] leading-8 text-[rgba(0,0,0,0.92)]">{item.description}</p>
      </article>

      <article className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#7a746f]">详细说明</h3>
        <p className="text-[#615d59]">
          这是一个 Notion 风格的页面弹出层预览区域。后续可以在这里渲染富文本编辑器内容、学习资料详情或作业说明正文。
        </p>
      </article>

      <article className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#7a746f]">附件 / 链接</h3>
        <div className="rounded-xl bg-[#f8f7f6] p-4 text-sm text-[#6f6964]">
          支持展示 PDF、外链与文件元数据（当前为占位区）。
        </div>
      </article>
    </section>
  );
}

function StudentAssignmentBody({
  status,
  onSubmit,
}: {
  status: StudentAssignmentStatus;
  onSubmit: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({
    q1: "",
    q2: "",
    q3: "",
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
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
            <p>1. 我认为 AI 在学习中的核心价值是“个性化反馈”...</p>
            <p>2. 在案例一中，AI 通过连续追问帮助我定位概念误区...</p>
            <p>3. 建议增加教师边界控制与过程性评价机制...</p>
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
      <section className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-6 px-8 py-6">
          <article className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#eef8f2] p-4">
            <p className="text-sm font-medium text-[rgba(0,0,0,0.92)]">评分结果</p>
            <p className="mt-2 text-2xl font-semibold text-[rgba(0,0,0,0.9)]">88 / 100</p>
            <p className="mt-1 text-sm text-[#5f6f64]">教师已完成评分，可根据反馈继续优化。</p>
          </article>
          <article className="space-y-2 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
            <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">AI 评语摘要</p>
            <ul className="space-y-1.5 text-sm leading-6 text-[#615d59]">
              <li>Strengths：结构完整，表达清晰。</li>
              <li>Weaknesses：边界条件论证不足。</li>
              <li>Suggestions：补充反例与评价指标。</li>
            </ul>
          </article>
          <article className="space-y-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-5 text-sm leading-8 text-[rgba(0,0,0,0.9)]">
            <p>1. 我认为 AI 在学习中的核心价值是“个性化反馈”...</p>
            <p>2. 在案例一中，AI 通过连续追问帮助我定位概念误区...</p>
            <p>3. 建议增加教师边界控制与过程性评价机制...</p>
          </article>
        </div>
        <footer className="sticky bottom-0 z-10 flex items-center justify-between border-t border-[rgba(0,0,0,0.06)] bg-white/95 px-8 py-4 backdrop-blur-sm">
          <p className="text-xs text-[#8a847f]">已评分，当前为只读模式。</p>
          <Button variant="secondary">查看完整反馈</Button>
        </footer>
      </section>
    );
  }

  useEffect(() => {
    if (isReadOnly) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      setSaveState("saved");
    }, 700);
    return () => window.clearTimeout(timer);
  }, [answers, isReadOnly]);

  return (
    <section className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="space-y-8 px-8 py-6">
        <article className="prose prose-sm max-w-none text-[rgba(0,0,0,0.9)]">
          <h3 className="!mb-3 !text-base !font-semibold !text-[rgba(0,0,0,0.95)]">题目说明</h3>
          <p>
            请结合本课程内容，完成对“AI 在学习场景中的应用”的分析。你需要说明核心观点、给出至少两个案例，并提出可执行的改进建议。
          </p>
          <ul>
            <li>使用课程术语，确保概念准确。</li>
            <li>分析不低于 500 字。</li>
            <li>引用资料请在文中标注来源。</li>
          </ul>
          <p>
            附图示例（占位）：
            <img
              alt="assignment-illustration"
              src="https://dummyimage.com/960x280/f1f0ef/9b9690&text=Assignment+Reference+Image"
              className="mt-2 w-full rounded-xl border border-[rgba(0,0,0,0.06)]"
            />
          </p>
          <p className="rounded-xl bg-[#f8f7f6] p-3 text-sm text-[#615d59]">
            附件：课程资料《学习分析框架.pdf》 · 参考链接：https://example.com
          </p>
        </article>

        <article className="space-y-3">
          <h4 className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">问题 1：核心观点总结</h4>
          <textarea
            value={answers.q1}
            onChange={(e) => setAnswers((prev) => ({ ...prev, q1: e.target.value }))}
            readOnly={isReadOnly}
            placeholder="在这里直接作答，不需要跳转到底部表单。"
            className="min-h-28 w-full rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3 text-sm leading-7 text-[rgba(0,0,0,0.9)] outline-none focus:ring-2 focus:ring-[#097fe8] disabled:cursor-not-allowed disabled:bg-[#f8f7f6]"
          />
        </article>

        <article className="space-y-3">
          <h4 className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">问题 2：案例分析</h4>
          <textarea
            value={answers.q2}
            onChange={(e) => setAnswers((prev) => ({ ...prev, q2: e.target.value }))}
            readOnly={isReadOnly}
            placeholder="请描述至少两个 AI 辅助学习案例。"
            className="min-h-36 w-full rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3 text-sm leading-7 text-[rgba(0,0,0,0.9)] outline-none focus:ring-2 focus:ring-[#097fe8] disabled:cursor-not-allowed disabled:bg-[#f8f7f6]"
          />
        </article>

        <article className="space-y-3">
          <h4 className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">问题 3：改进建议</h4>
          <textarea
            value={answers.q3}
            onChange={(e) => setAnswers((prev) => ({ ...prev, q3: e.target.value }))}
            readOnly={isReadOnly}
            placeholder="给出可执行的改进方案。"
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
            : saveState === "saving"
              ? "自动保存中..."
              : saveState === "saved"
                ? "已自动保存"
                : "开始作答后将自动保存"}
        </p>
        <Button disabled={isReadOnly} onClick={onSubmit}>
          提交作业
        </Button>
      </footer>
    </section>
  );
}

function TeacherAssignmentBody({
  studentStatus,
  onMarkGraded,
}: {
  studentStatus: StudentAssignmentStatus;
  onMarkGraded: () => void;
}) {
  const [score, setScore] = useState("86");
  const [comment, setComment] = useState("论证结构清晰，建议补充更多案例对比。");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (studentStatus === "Graded") return;
    setSaveState("saving");
    const timer = window.setTimeout(() => setSaveState("saved"), 650);
    return () => window.clearTimeout(timer);
  }, [score, comment, studentStatus]);

  return (
    <section className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="grid gap-6 px-8 py-6 lg:grid-cols-[minmax(0,7fr)_minmax(18rem,3fr)]">
        <div className="space-y-6">
          <article className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#7a746f]">题目</h3>
            <div className="rounded-xl bg-[#f8f7f6] p-4 text-sm leading-7 text-[rgba(0,0,0,0.9)]">
              请结合课程内容分析 AI 在学习场景中的应用，并说明其优势、潜在问题以及可执行的优化建议。
            </div>
          </article>

          <article className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#7a746f]">学生回答</h3>
            <div className="space-y-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-5 text-sm leading-8 text-[rgba(0,0,0,0.9)]">
              <p>
                我认为 AI 在学习中的核心价值是“个性化反馈”。它可以根据学生的历史行为生成分层练习，并针对错误点给出即时解释。
              </p>
              <p>
                在案例一中，AI 通过连续追问帮助我定位了概率统计中的概念误区；在案例二中，AI 给出了作业结构建议，使我的论证逻辑更完整。
              </p>
              <p>
                但 AI 也可能带来“过度依赖”问题，因此需要教师设置明确边界，例如要求学生提供自己的思考过程与引用依据。
              </p>
            </div>
          </article>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-0">
          <section className="space-y-3">
            <p className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">AI 初评</p>

            <article className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#f8f7f6] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#7a746f]">Score</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[rgba(0,0,0,0.9)]">84 / 100</p>
              <p className="mt-1 text-xs text-[#8a847f]">模型建议分，仅供教师最终评分参考</p>
            </article>

            <article className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#7a746f]">Strengths</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#615d59]">
                <li>结构完整，论证顺序清晰。</li>
                <li>案例选择具有代表性。</li>
              </ul>
            </article>

            <article className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#7a746f]">Weaknesses</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#615d59]">
                <li>风险分析深度不足。</li>
                <li>缺少反例讨论与边界说明。</li>
              </ul>
            </article>

            <article className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#7a746f]">Suggestions</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#615d59]">
                <li>补充 1-2 个失败案例对比。</li>
                <li>增加可执行的改进路径与评价指标。</li>
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
                : saveState === "saving"
                  ? "自动保存中..."
                  : saveState === "saved"
                    ? "已自动保存"
                    : "修改后将自动保存"}
            </p>
          </section>

          <section className="space-y-2 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
            <p className="text-sm font-medium text-[rgba(0,0,0,0.9)]">状态</p>
            <p className="text-sm text-[#615d59]">
              当前：{studentStatus === "Graded" ? "已批改" : "未批改"}
            </p>
            <Button
              className="w-full"
              onClick={onMarkGraded}
              disabled={studentStatus === "Graded"}
            >
              标记为已批改
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
  const [assignmentStatus, setAssignmentStatus] = useState<StudentAssignmentStatus>("Not Started");

  useEffect(() => {
    if (item?.type === "assignment" && item.status) {
      setAssignmentStatus(item.status);
    }
  }, [item]);

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
              item={{
                ...item,
                status: item.type === "assignment" ? assignmentStatus : item.status,
              }}
              userRole={userRole}
              onClose={() => onOpenChange(false)}
            />
            <LibraryDialogMeta
              item={{
                ...item,
                status: item.type === "assignment" ? assignmentStatus : item.status,
              }}
            />
            {item.type === "assignment" && userRole === "STUDENT" ? (
              <StudentAssignmentBody
                status={assignmentStatus}
                onSubmit={() => setAssignmentStatus("Submitted")}
              />
            ) : item.type === "assignment" && userRole === "TEACHER" ? (
              <TeacherAssignmentBody
                studentStatus={assignmentStatus}
                onMarkGraded={() => setAssignmentStatus("Graded")}
              />
            ) : (
              <LibraryDialogBody item={item} />
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
