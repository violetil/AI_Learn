"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Toaster } from "sonner";
import { ThemeToggle } from "../ui/theme-toggle";
import { FlashNotice } from "../ui/flash-notice";

function chatShell(pathname: string | null) {
  return Boolean(pathname?.startsWith("/chat"));
}

function standaloneShell(pathname: string | null) {
  return Boolean(
    pathname === "/" ||
      pathname?.startsWith("/login") ||
      pathname?.startsWith("/register") ||
      pathname?.startsWith("/dashboard"),
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChat = chatShell(pathname);
  const isStandalone = standaloneShell(pathname);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    <div className="flex min-h-dvh flex-1 flex-col bg-[var(--app-bg)] text-[var(--app-fg)]">
      <Toaster richColors position="top-center" />
      <Suspense fallback={null}>
        <FlashNotice />
      </Suspense>

      {isStandalone ? <main className="flex flex-1 flex-col">{children}</main> : null}

      {!isStandalone ? (
        <>
          <header
            className="sticky top-0 z-40 shrink-0 border-b border-white/10 text-white backdrop-blur-[20px] backdrop-saturate-180"
            style={{ backgroundColor: "var(--nav-glass-bg)" }}
          >
            <div className="mx-auto flex w-full max-w-[61.25rem] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:max-w-none lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="rounded-[var(--radius-md)] border border-white/20 px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/10 lg:hidden"
                  onClick={() => setMobileNavOpen((v) => !v)}
                  aria-expanded={mobileNavOpen}
                  aria-label="切换导航"
                >
                  菜单
                </button>
                <Link
                  href="/"
                  className="truncate text-sm font-semibold tracking-tight text-white hover:text-white/90"
                >
                  AI Learn
                </Link>
                <span className="hidden text-xs text-white/60 sm:inline">{title}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ThemeToggle variant="nav" />
              </div>
            </div>
            <div
              className={`border-t border-white/10 lg:hidden ${mobileNavOpen ? "block" : "hidden"}`}
            >
              <nav className="mx-auto flex max-w-[61.25rem] flex-col gap-1 px-4 py-2 text-sm sm:px-6">
                <NavItem href="/" label="首页" pathname={pathname} tone="onDark" />
                <NavItem href="/teacher" label="教师端" pathname={pathname} tone="onDark" />
                <NavItem href="/student" label="学生端" pathname={pathname} tone="onDark" />
                <NavItem href="/chat" label="AI 对话" pathname={pathname} tone="onDark" />
                <NavItem href="/login" label="登录" pathname={pathname} tone="onDark" />
                <NavItem href="/register" label="注册" pathname={pathname} tone="onDark" />
              </nav>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <aside className="hidden w-[240px] shrink-0 border-r border-[var(--app-border)] bg-[var(--app-surface)] lg:block">
              <nav className="sticky top-[49px] space-y-0.5 p-3 text-sm">
                <NavItem href="/" label="首页" pathname={pathname} tone="onLight" />
                <NavItem href="/teacher" label="教师端" pathname={pathname} tone="onLight" />
                <NavItem href="/student" label="学生端" pathname={pathname} tone="onLight" />
                <NavItem href="/chat" label="AI 对话" pathname={pathname} tone="onLight" />
                <NavItem href="/login" label="登录" pathname={pathname} tone="onLight" />
                <NavItem href="/register" label="注册" pathname={pathname} tone="onLight" />
              </nav>
            </aside>

            <main
              className={
                isChat
                  ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--app-bg)]"
                  : "min-h-0 min-w-0 flex-1 overflow-y-auto bg-[var(--app-bg)]"
              }
            >
              <div
                className={
                  isChat
                    ? "flex min-h-0 flex-1 flex-col"
                    : "mx-auto w-full max-w-[61.25rem] px-4 py-6 sm:px-6"
                }
              >
                {children}
              </div>
            </main>
          </div>

          <footer className="shrink-0 border-t border-[var(--app-border)] bg-[var(--app-surface)]">
            <div className="mx-auto flex w-full max-w-[61.25rem] flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-[var(--app-subtle)] sm:px-6">
              <span>AI Learn</span>
              <span className="text-[var(--app-subtle)]">
                帮助：课程聊天仅限成员 ·{" "}
                <Link href="/chat" className="text-[var(--link-blue)] hover:underline">
                  打开对话
                </Link>
              </span>
            </div>
          </footer>
        </>
      ) : null}
    </div>
  );
}

function NavItem({
  href,
  label,
  pathname,
  tone,
}: {
  href: string;
  label: string;
  pathname: string | null;
  tone: "onDark" | "onLight";
}) {
  const active = href === "/" ? pathname === "/" : Boolean(pathname?.startsWith(href));
  const activeCls =
    tone === "onDark"
      ? "bg-white/15 text-[var(--link-blue-on-dark)]"
      : "bg-[var(--interactive-blue)]/12 text-[var(--interactive-blue)]";
  const idleCls =
    tone === "onDark"
      ? "text-white/90 hover:bg-white/10"
      : "text-[var(--app-fg)] hover:bg-[var(--app-muted)]";
  return (
    <Link
      href={href}
      className={`block rounded-[var(--radius-md)] px-3 py-2 text-sm transition ${
        active ? activeCls : idleCls
      }`}
    >
      {label}
    </Link>
  );
}
