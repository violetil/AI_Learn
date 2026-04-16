"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDashboardLibraryItemAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import {
  CreateLibraryItemDialog,
  type CreatePayload,
} from "@/components/dashboard/create-library-item-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LibraryPageDialog } from "@/components/dashboard/library-page-dialog";
import { LibraryTableHeader } from "@/components/dashboard/library-table-header";
import { LibraryTableRow } from "@/components/dashboard/library-table-row";
import type { LibraryItem, LibraryTab } from "@/components/dashboard/library-types";

const TAB_OPTIONS: Array<{ id: LibraryTab; label: string }> = [
  { id: "recents", label: "Recents" },
  { id: "materials", label: "Materials" },
  { id: "assignments", label: "Assignments" },
];

export function CourseLibraryPage({
  initialTab,
  courseId,
  initialItems,
  courseTitle,
  userRole,
}: {
  initialTab: LibraryTab;
  courseId: string;
  initialItems: LibraryItem[];
  courseTitle: string;
  userRole: "TEACHER" | "STUDENT";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<LibraryTab>(initialTab);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [createMode, setCreateMode] = useState<"assignment" | "material" | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const items = useMemo(() => {
    if (tab === "recents") return initialItems;
    if (tab === "materials") return initialItems.filter((item) => item.type === "material");
    return initialItems.filter((item) => item.type === "assignment");
  }, [initialItems, tab]);

  const handleCreate = (payload: CreatePayload) => {
    setCreateError(null);
    startTransition(async () => {
      const result = await createDashboardLibraryItemAction({
        courseId,
        mode: payload.mode,
        name: payload.name,
        description: payload.description,
        dueDate: payload.dueDate,
        link: payload.link,
      });
      if (!result.success) {
        setCreateError(result.error);
        return;
      }
      setTab(payload.mode === "assignment" ? "assignments" : "materials");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-[2rem] font-bold tracking-[-0.02em] text-[rgba(0,0,0,0.95)]">Library</h2>
          <p className="text-xs text-[#615d59]">{courseTitle}</p>
        </div>

        <div className="flex items-center gap-1">
          {userRole === "TEACHER" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="h-7 rounded-full px-3 text-xs">
                  + New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setCreateMode("assignment")}>
                  New Assignment
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setCreateMode("material")}>
                  New Material
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full px-0" aria-label="搜索">
            ⌕
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full px-0" aria-label="筛选">
            ⌯
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full px-0" aria-label="排序">
            ↕
          </Button>
        </div>
      </header>
      {createError ? (
        <p className="rounded-lg border border-[rgba(194,70,70,0.2)] bg-[rgba(194,70,70,0.08)] px-3 py-2 text-xs text-[#8f3a3a]">
          {createError}
        </p>
      ) : null}

      <div className="flex items-center gap-1.5">
        {TAB_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setTab(option.id)}
            className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
              tab === option.id
                ? "bg-[#f1f0ef] text-[rgba(0,0,0,0.95)]"
                : "text-[#615d59] hover:bg-[#f6f5f4]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white/70 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="min-w-[54rem]">
          <LibraryTableHeader tab={tab} />
          <div className="divide-y divide-[rgba(0,0,0,0.06)]">
            {items.map((item) => (
              <LibraryTableRow
                key={item.id}
                item={item}
                tab={tab}
                userRole={userRole}
                onEdit={() => setSelectedItem(item)}
                onDelete={() => {
                  // Placeholder action for design-stage UI.
                }}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        </div>
      </div>

      <LibraryPageDialog
        item={selectedItem}
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
        userRole={userRole}
      />

      <CreateLibraryItemDialog
        open={Boolean(createMode)}
        mode={createMode}
        onOpenChange={(open) => {
          if (!open) setCreateMode(null);
        }}
        onCreate={handleCreate}
        pending={isPending}
      />
    </div>
  );
}
