import type { ReactNode } from "react";

/** 通用布局卡片，供各模块复用 */
export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm hover:shadow-md">
      <h2 className="mb-3 text-base font-semibold text-[var(--app-fg)]">
        {title}
      </h2>
      {children}
    </section>
  );
}
