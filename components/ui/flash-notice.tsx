"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NoticeTone = "success" | "error" | "info";

const ERROR_HINTS: Record<string, string> = {
  "missing-title": "标题不能为空",
  "invalid-dueAt": "截止时间格式无效",
  "missing-material-title": "资料标题不能为空",
  "file-too-large": "文件过大",
  "missing-code": "请输入课程码",
  "course-not-found": "课程码不存在",
  "empty-answer": "提交内容不能为空",
  "assignment-not-found": "作业不存在或未发布",
};

export function FlashNotice() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(true);

  const notice = useMemo(() => {
    const errKey = searchParams.get("error");
    if (errKey) {
      const hint = ERROR_HINTS[errKey] ?? "请检查输入后重试";
      return { tone: "error" as NoticeTone, text: `操作未成功：${hint}` };
    }
    if (
      searchParams.get("created") ||
      searchParams.get("joined") ||
      searchParams.get("submitted") ||
      searchParams.get("reviewed") ||
      searchParams.get("materialCreated")
    ) {
      return { tone: "success" as NoticeTone, text: "操作成功。" };
    }
    if (searchParams.get("ai") === "demo") {
      return {
        tone: "info" as NoticeTone,
        text: "当前为演示 AI 模式，流程正常可用。",
      };
    }
    return null;
  }, [searchParams]);

  useEffect(() => {
    setShow(true);
  }, [searchParams]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setShow(false), 1000);
    return () => clearTimeout(t);
  }, [notice]);

  if (!notice || !show) return null;

  const toneClass =
    notice.tone === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-300"
      : notice.tone === "error"
        ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/50 dark:text-red-300"
        : "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700/60 dark:bg-blue-950/50 dark:text-blue-300";

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 max-w-sm">
      <div
        className={`rounded-xl border px-4 py-2 text-sm shadow-lg transition ${toneClass}`}
      >
        {notice.text}
      </div>
    </div>
  );
}
