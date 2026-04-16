import type { LibraryTab } from "@/components/dashboard/library-types";

export function LibraryTableHeader({ tab }: { tab: LibraryTab }) {
  const showAssignmentColumns = tab === "assignments";

  return (
    <div className="grid grid-cols-[minmax(11rem,2fr)_minmax(6rem,1fr)_minmax(6rem,1fr)_minmax(5.5rem,1fr)_minmax(5.5rem,1fr)_minmax(6rem,1fr)_5rem] items-center gap-2.5 px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#7a746f]">
      <span>Name</span>
      <span>Course</span>
      <span>Created by</span>
      <span>{showAssignmentColumns ? "Status" : "-"}</span>
      <span>{showAssignmentColumns ? "Due Date" : "-"}</span>
      <span>Last edited</span>
      <span className="text-right">Actions</span>
    </div>
  );
}
