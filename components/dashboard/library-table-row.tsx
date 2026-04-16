import { AssignmentStatusBadge } from "@/components/dashboard/assignment-status-badge";
import {
  getAssignmentStatusForRole,
  type LibraryItem,
  type LibraryTab,
  type UserRole,
} from "@/components/dashboard/library-types";

export function LibraryTableRow({
  item,
  tab,
  userRole,
  onEdit,
  onDelete,
  onClick,
}: {
  item: LibraryItem;
  tab: LibraryTab;
  userRole: UserRole;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const showAssignmentColumns = tab === "assignments";
  const showRowActions = userRole === "TEACHER";

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        className="grid w-full grid-cols-[minmax(11rem,2fr)_minmax(6rem,1fr)_minmax(6rem,1fr)_minmax(5.5rem,1fr)_minmax(5.5rem,1fr)_minmax(6rem,1fr)_5rem] items-center gap-2.5 px-3 py-3 text-left transition-colors hover:bg-[#f8f7f6]"
      >
        <span className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#f1f0ef] text-[11px] text-[rgba(0,0,0,0.85)]">
            {item.icon}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-[rgba(0,0,0,0.95)]">
              {item.name}
            </span>
          </span>
        </span>
        <span className="truncate text-[13px] text-[#615d59]">{item.course}</span>
        <span className="truncate text-[13px] text-[#615d59]">{item.createdBy}</span>
        <span className="truncate text-[13px] text-[#7a746f]">
          {showAssignmentColumns && item.type === "assignment" && item.status ? (
            <AssignmentStatusBadge status={getAssignmentStatusForRole(item.status, userRole)} />
          ) : (
            "-"
          )}
        </span>
        <span className="truncate text-[13px] text-[#7a746f]">
          {showAssignmentColumns ? item.dueDate ?? "-" : "-"}
        </span>
        <span className="truncate text-[13px] text-[#7a746f]">{item.lastEdited}</span>
      <span className="text-right text-[13px] text-[#7a746f]">{showRowActions ? "" : "-"}</span>
      </button>

      {showRowActions ? (
        <div className="absolute inset-y-0 right-0 flex w-[5rem] items-center justify-end gap-1.5 pr-1.5">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            className="rounded-md px-2 py-1 text-xs text-[#615d59] opacity-0 transition-all duration-150 hover:bg-[#f4f3f2] hover:text-[rgba(0,0,0,0.95)] group-hover:opacity-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="rounded-md px-2 py-1 text-xs text-[#8a847f] opacity-0 transition-all duration-150 hover:bg-[#f4f3f2] hover:text-[#6f6964] group-hover:opacity-100"
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
