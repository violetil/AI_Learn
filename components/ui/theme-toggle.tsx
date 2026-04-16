"use client";

import { useEffect, useState } from "react";

type ThemeToggleProps = {
  /** 深色玻璃顶栏上使用浅色描边 */
  variant?: "default" | "nav";
};

export function ThemeToggle({ variant = "default" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.classList.contains("dark") ? "dark" : "light";
    queueMicrotask(() => setTheme(current));
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  const nav =
    variant === "nav"
      ? "rounded-[8px] border border-white/25 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
      : "rounded-[8px] border border-[var(--app-border)] px-3 py-1.5 text-xs hover:bg-[var(--app-muted)]";

  return (
    <button type="button" onClick={toggle} className={nav}>
      {theme === "dark" ? "浅色" : "深色"}
    </button>
  );
}
