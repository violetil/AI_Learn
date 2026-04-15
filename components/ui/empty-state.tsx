import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-muted)]/40 px-6 py-12 text-center">
      {icon ? (
        <div className="mb-3 text-3xl text-[var(--app-subtle)]">{icon}</div>
      ) : (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--app-muted)] text-lg text-[var(--app-subtle)]">
          ∅
        </div>
      )}
      <p className="text-sm font-medium text-[var(--app-fg)]">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-xs text-[var(--app-subtle)]">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
