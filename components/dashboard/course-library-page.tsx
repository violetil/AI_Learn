"use client";

import { useMemo, useState } from "react";
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

const INITIAL_ITEMS: LibraryItem[] = [
  {
    id: "mat-1",
    name: "神经网络入门讲义",
    icon: "📄",
    course: "AI Basics",
    createdBy: "王老师",
    createdAt: "2026-04-10",
    lastEdited: "今天",
    type: "material",
    description: "课程基础资料，介绍神经网络核心概念。",
  },
  {
    id: "mat-2",
    name: "机器学习评估方法",
    icon: "📄",
    course: "AI Basics",
    createdBy: "王老师",
    createdAt: "2026-04-09",
    lastEdited: "昨天",
    type: "material",
    description: "Precision / Recall / F1 指标与使用场景。",
  },
  {
    id: "as-1",
    name: "作业 1：回归分析",
    icon: "✓",
    course: "AI Basics",
    createdBy: "王老师",
    createdAt: "2026-04-08",
    status: "Submitted",
    dueDate: "4 月 22 日",
    lastEdited: "2 天前",
    type: "assignment",
    description: "提交回归模型实验报告与结果分析。",
  },
  {
    id: "as-2",
    name: "作业 2：案例反思",
    icon: "✓",
    course: "AI Basics",
    createdBy: "王老师",
    createdAt: "2026-04-07",
    status: "Graded",
    dueDate: "4 月 28 日",
    lastEdited: "3 天前",
    type: "assignment",
    description: "围绕 AI 辅助学习写一份案例反思。",
  },
  {
    id: "as-3",
    name: "作业 3：学习路径设计",
    icon: "✓",
    course: "AI Basics",
    createdBy: "王老师",
    createdAt: "2026-04-06",
    status: "Not Started",
    dueDate: "5 月 2 日",
    lastEdited: "4 天前",
    type: "assignment",
    description: "根据课程知识点设计一条 AI 辅助学习路径。",
  },
];

const TAB_OPTIONS: Array<{ id: LibraryTab; label: string }> = [
  { id: "recents", label: "Recents" },
  { id: "materials", label: "Materials" },
  { id: "assignments", label: "Assignments" },
];

export function CourseLibraryPage({
  initialTab,
  courseTitle,
  userRole,
}: {
  initialTab: LibraryTab;
  courseTitle: string;
  userRole: "TEACHER" | "STUDENT";
}) {
  const [tab, setTab] = useState<LibraryTab>(initialTab);
  const [itemsSource, setItemsSource] = useState<LibraryItem[]>(INITIAL_ITEMS);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [createMode, setCreateMode] = useState<"assignment" | "material" | null>(null);

  const items = useMemo(() => {
    if (tab === "recents") return itemsSource;
    if (tab === "materials") return itemsSource.filter((item) => item.type === "material");
    return itemsSource.filter((item) => item.type === "assignment");
  }, [itemsSource, tab]);

  const handleCreate = (payload: CreatePayload) => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const newItem: LibraryItem = {
      id: `new-${Date.now()}`,
      name: payload.name,
      icon: payload.mode === "assignment" ? "✓" : "📄",
      course: courseTitle,
      createdBy: "当前教师",
      createdAt: `${yyyy}-${mm}-${dd}`,
      status: payload.mode === "assignment" ? "Not Started" : undefined,
      dueDate: payload.mode === "assignment" ? payload.dueDate ?? "-" : undefined,
      lastEdited: "刚刚",
      type: payload.mode,
      description: payload.description + (payload.link ? `\n\n资料链接：${payload.link}` : ""),
    };

    setItemsSource((prev) => [newItem, ...prev]);
    setTab(payload.mode === "assignment" ? "assignments" : "materials");
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
      />
    </div>
  );
}
