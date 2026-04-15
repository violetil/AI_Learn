import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-6xl font-bold text-[var(--app-subtle)]">404</p>
      <p className="text-lg font-medium text-[var(--app-fg)]">页面不存在或无权访问</p>
      <p className="max-w-md text-sm text-[var(--app-subtle)]">
        请检查链接是否正确，或从首页重新进入。
      </p>
      <Link
        href="/"
        className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
      >
        返回首页
      </Link>
    </div>
  );
}
