"use client";

import { useEffect, useMemo, useState } from "react";

type NoticeTone = "success" | "error" | "info";

export function FlashNotice() {
  const [show, setShow] = useState(true);

  const notice = useMemo(() => {
    if (typeof window === "undefined") return null;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("error")) return { tone: "error" as NoticeTone, text: "操作失败，请检查输入后重试。" };
    if (sp.get("created") || sp.get("joined") || sp.get("submitted") || sp.get("reviewed")) {
      return { tone: "success" as NoticeTone, text: "操作成功。" };
    }
    if (sp.get("ai") === "demo") {
      return { tone: "info" as NoticeTone, text: "当前为演示 AI 模式，流程正常可用。" };
    }
    return null;
  }, []);

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
    <div className="pointer-events-none fixed right-4 top-20 z-50">
      <div className={`rounded-xl border px-4 py-2 text-sm shadow-lg transition ${toneClass}`}>
        {notice.text}
      </div>
    </div>
  );
}
