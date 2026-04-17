"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type CreateMode = "assignment" | "material" | null;

type CreatePayload = {
  mode: Exclude<CreateMode, null>;
  name: string;
  description: string;
  dueDate?: string;
  link?: string;
};

export function CreateLibraryItemDialog({
  open,
  mode,
  onOpenChange,
  onCreate,
  pending = false,
}: {
  open: boolean;
  mode: CreateMode;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: CreatePayload) => void;
  pending?: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [link, setLink] = useState("");

  const title = useMemo(() => {
    if (mode === "assignment") return "新建作业";
    if (mode === "material") return "新建资料";
    return "新建";
  }, [mode]);

  const isAssignment = mode === "assignment";
  const isMaterial = mode === "material";
  const canSubmit = Boolean(
    !pending && mode && name.trim().length > 0 && description.trim().length > 0,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setName("");
          setDescription("");
          setDueDate("");
          setLink("");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">新建课程资料或作业</DialogDescription>

        <div className="flex flex-col">
          <header className="border-b border-[rgba(0,0,0,0.06)] px-8 py-5">
            <h3 className="text-[1.4rem] font-semibold tracking-[-0.015em] text-[rgba(0,0,0,0.9)]">
              {title}
            </h3>
            <p className="mt-1 text-sm text-[#7a746f]">
              {isAssignment
                ? "创建一项作业并设置截止时间。"
                : "创建一份学习资料，支持文本说明与链接。"}
            </p>
          </header>

          <section className="space-y-4 px-8 py-6">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-[rgba(0,0,0,0.9)]">标题</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-10 w-full rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#097fe8]"
                placeholder={isAssignment ? "例如：作业 4：模型优化" : "例如：课程补充阅读"}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-[rgba(0,0,0,0.9)]">描述</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-28 w-full rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2 text-sm leading-7 outline-none focus:ring-2 focus:ring-[#097fe8]"
                placeholder="输入简要说明"
              />
            </label>

            {isAssignment ? (
              <label className="block space-y-1">
                <span className="text-sm font-medium text-[rgba(0,0,0,0.9)]">截止时间</span>
                <input
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="h-10 w-full rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#097fe8]"
                  placeholder="例如：5 月 10 日"
                />
              </label>
            ) : null}

            {isMaterial ? (
              <label className="block space-y-1">
                <span className="text-sm font-medium text-[rgba(0,0,0,0.9)]">资料链接（可选）</span>
                <input
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  className="h-10 w-full rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#097fe8]"
                  placeholder="https://..."
                />
              </label>
            ) : null}
          </section>

          <footer className="flex items-center justify-end gap-2 border-t border-[rgba(0,0,0,0.06)] px-8 py-4">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={() => {
                if (!mode) return;
                onCreate({
                  mode,
                  name: name.trim(),
                  description: description.trim(),
                  dueDate: dueDate.trim() || undefined,
                  link: link.trim() || undefined,
                });
                onOpenChange(false);
              }}
            >
              {pending ? "创建中..." : "创建"}
            </Button>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { CreatePayload };
