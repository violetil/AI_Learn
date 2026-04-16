"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

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
  "rate-limit": "操作过于频繁，请稍后再试",
};

export function FlashNotice() {
  const searchParams = useSearchParams();
  const lastKey = useRef<string | null>(null);

  const notice = useMemo(() => {
    const errKey = searchParams.get("error");
    if (errKey) {
      const hint = ERROR_HINTS[errKey] ?? "请检查输入后重试";
      return { tone: "error" as NoticeTone, text: `操作未成功：${hint}` };
    }
    if (searchParams.get("submitted")) {
      return { tone: "success" as NoticeTone, text: "作业提交成功。" };
    }
    if (searchParams.get("created")) {
      return { tone: "success" as NoticeTone, text: "作业已创建。" };
    }
    if (searchParams.get("materialCreated")) {
      return { tone: "success" as NoticeTone, text: "资料已创建。" };
    }
    if (searchParams.get("reviewed")) {
      return { tone: "success" as NoticeTone, text: "审核结果已保存。" };
    }
    if (searchParams.get("joined")) {
      return { tone: "success" as NoticeTone, text: "操作成功。" };
    }
    if (searchParams.get("ai") === "demo") {
      return {
        tone: "info" as NoticeTone,
        text: "当前为演示 AI 模式，流程正常可用。",
      };
    }
    if (searchParams.get("ai") === "live") {
      return {
        tone: "info" as NoticeTone,
        text: "AI 初评已生成，教师可在审核环节查看。",
      };
    }
    return null;
  }, [searchParams]);

  useEffect(() => {
    if (!notice) {
      lastKey.current = null;
      return;
    }
    const key = searchParams.toString();
    if (key === lastKey.current) return;
    lastKey.current = key;

    if (notice.tone === "error") {
      toast.error(notice.text);
    } else if (notice.tone === "success") {
      toast.success(notice.text);
    } else {
      toast.message(notice.text);
    }
  }, [notice, searchParams]);

  return null;
}
