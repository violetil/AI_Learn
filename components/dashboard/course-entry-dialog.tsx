"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type CourseEntryMode = "create" | "join" | null;

type CourseEntryPayload =
  | {
      mode: "create";
      title: string;
      description?: string;
      status: "DRAFT" | "PUBLISHED";
    }
  | {
      mode: "join";
      courseCode: string;
    };

export function CourseEntryDialog({
  open,
  mode,
  onOpenChange,
  onSubmit,
  pending = false,
  error,
}: {
  open: boolean;
  mode: CourseEntryMode;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CourseEntryPayload) => void;
  pending?: boolean;
  error?: string | null;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [courseCode, setCourseCode] = useState("");

  const dialogTitle = useMemo(() => {
    if (mode === "create") return "创建课程";
    if (mode === "join") return "加入课程";
    return "课程操作";
  }, [mode]);

  const canSubmit = useMemo(() => {
    if (pending || !mode) return false;
    if (mode === "create") return title.trim().length > 0;
    return courseCode.trim().length > 0;
  }, [courseCode, mode, pending, title]);

  const resetFields = () => {
    setTitle("");
    setDescription("");
    setStatus("DRAFT");
    setCourseCode("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetFields();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-xl overflow-hidden p-0">
        <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
        <DialogDescription className="sr-only">课程创建与加入弹窗</DialogDescription>

        <div className="flex flex-col">
          <header className="border-b border-[rgba(0,0,0,0.06)] px-8 py-5">
            <h3 className="text-[1.35rem] font-semibold tracking-[-0.015em] text-[rgba(0,0,0,0.9)]">
              {dialogTitle}
            </h3>
            <p className="mt-1 text-sm text-[#7a746f]">
              {mode === "create"
                ? "创建后会自动切换到该课程，并在当前工作台继续操作。"
                : "输入教师提供的课程码，成功后自动进入该课程。"}
            </p>
          </header>

          <section className="space-y-4 px-8 py-6">
            {mode === "create" ? (
              <>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-[rgba(0,0,0,0.9)]">课程名称</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="例如：人工智能导论"
                    className="h-10 w-full rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#097fe8]"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-[rgba(0,0,0,0.9)]">课程简介（可选）</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="输入课程目标或学习说明"
                    className="min-h-24 w-full rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2 text-sm leading-7 outline-none focus:ring-2 focus:ring-[#097fe8]"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-[rgba(0,0,0,0.9)]">发布状态</span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as "DRAFT" | "PUBLISHED")}
                    className="h-10 w-full rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#097fe8]"
                  >
                    <option value="DRAFT">草稿</option>
                    <option value="PUBLISHED">已发布</option>
                  </select>
                </label>
              </>
            ) : null}

            {mode === "join" ? (
              <label className="block space-y-1">
                <span className="text-sm font-medium text-[rgba(0,0,0,0.9)]">课程码</span>
                <input
                  value={courseCode}
                  onChange={(event) => setCourseCode(event.target.value.toUpperCase())}
                  placeholder="例如：C-ABC123-1XYZ"
                  className="h-10 w-full rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-3 text-sm uppercase outline-none focus:ring-2 focus:ring-[#097fe8]"
                />
              </label>
            ) : null}

            {error ? (
              <p className="rounded-lg border border-[rgba(194,70,70,0.2)] bg-[rgba(194,70,70,0.08)] px-3 py-2 text-xs text-[#8f3a3a]">
                {error}
              </p>
            ) : null}
          </section>

          <footer className="flex items-center justify-end gap-2 border-t border-[rgba(0,0,0,0.06)] px-8 py-4">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={() => {
                if (mode === "create") {
                  onSubmit({
                    mode,
                    title: title.trim(),
                    description: description.trim() || undefined,
                    status,
                  });
                  return;
                }
                if (mode === "join") {
                  onSubmit({
                    mode,
                    courseCode: courseCode.trim().toUpperCase(),
                  });
                }
              }}
            >
              {pending ? "提交中..." : "确认"}
            </Button>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { CourseEntryMode, CourseEntryPayload };
