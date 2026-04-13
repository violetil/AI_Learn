"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ThemeToggle } from "../ui/theme-toggle";
import { FlashNotice } from "../ui/flash-notice";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const title = useMemo(() => {
    if (!pathname) return "AI Learn";
    if (pathname.startsWith("/teacher")) return "教师工作区";
    if (pathname.startsWith("/student")) return "学生学习区";
    if (pathname.startsWith("/chat")) return "AI 对话中心";
    if (pathname.startsWith("/login")) return "登录";
    if (pathname.startsWith("/register")) return "注册";
    return "AI Learn";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]">
      <FlashNotice />
      <header className="sticky top-0 z-40 border-b border-[var(--app-border)] bg-[var(--app-surface)]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLeftOpen((v) => !v)}
              className="rounded-lg border border-[var(--app-border)] px-2.5 py-1.5 text-xs hover:bg-[var(--app-muted)]"
            >
              左栏
            </button>
            <button
              type="button"
              onClick={() => setRightOpen((v) => !v)}
              className="rounded-lg border border-[var(--app-border)] px-2.5 py-1.5 text-xs hover:bg-[var(--app-muted)]"
            >
              右栏
            </button>
            <Link href="/" className="rounded-lg px-2 py-1 text-sm font-semibold hover:bg-[var(--app-muted)]">
              AI Learn
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[var(--app-subtle)] sm:inline">{title}</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-4 px-3 py-4 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_260px]">
        <aside
          className={`${leftOpen ? "block" : "hidden"} rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 lg:block`}
        >
          <p className="mb-2 text-xs font-semibold text-[var(--app-subtle)]">导航</p>
          <nav className="space-y-1 text-sm">
            <NavItem href="/" label="首页" pathname={pathname} />
            <NavItem href="/teacher" label="教师端" pathname={pathname} />
            <NavItem href="/student" label="学生端" pathname={pathname} />
            <NavItem href="/chat" label="AI 对话" pathname={pathname} />
            <NavItem href="/login" label="登录" pathname={pathname} />
            <NavItem href="/register" label="注册" pathname={pathname} />
          </nav>
        </aside>

        <main className="min-h-[78vh] min-w-0 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
          {children}
        </main>

        <aside
          className={`${rightOpen ? "block" : "hidden"} rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 lg:block`}
        >
          <p className="mb-2 text-xs font-semibold text-[var(--app-subtle)]">提示面板</p>
          <ul className="space-y-2 text-xs text-[var(--app-subtle)]">
            <li className="rounded-lg bg-[var(--app-muted)] p-2">支持课程内聊天与通用聊天双模式。</li>
            <li className="rounded-lg bg-[var(--app-muted)] p-2">表单成功/失败提示自动 1 秒淡出。</li>
            <li className="rounded-lg bg-[var(--app-muted)] p-2">桌面端三栏布局，移动端自动折叠。</li>
          </ul>
        </aside>
      </div>

      <footer className="border-t border-[var(--app-border)] bg-[var(--app-surface)]">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-[var(--app-subtle)] sm:px-6">
          <span>AI Learn Graduation Project</span>
          <span>Next.js + Prisma + Server Actions</span>
        </div>
      </footer>
    </div>
  );
}

function NavItem({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string | null;
}) {
  const active = href === "/" ? pathname === "/" : Boolean(pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 transition ${
        active
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
          : "text-[var(--app-fg)] hover:bg-[var(--app-muted)]"
      }`}
    >
      {label}
    </Link>
  );
}
