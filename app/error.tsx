"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-lg font-semibold text-red-600 dark:text-red-400">页面出错了</p>
      <p className="max-w-md text-sm text-[var(--app-subtle)]">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "请稍后重试。若问题持续，请联系管理员。"}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
      >
        重试
      </button>
    </div>
  );
}
