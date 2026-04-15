/** 全页骨架：用于 route loading.tsx */
export function LoadingPage({ label = "加载中…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      <p className="text-sm text-[var(--app-subtle)]">{label}</p>
      <div className="w-full max-w-md space-y-3">
        <div className="h-3 w-full animate-pulse rounded bg-[var(--app-muted)]" />
        <div className="h-3 w-[85%] animate-pulse rounded bg-[var(--app-muted)]" />
        <div className="h-3 w-[60%] animate-pulse rounded bg-[var(--app-muted)]" />
      </div>
    </div>
  );
}
