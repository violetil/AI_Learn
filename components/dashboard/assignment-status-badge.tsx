import type { AssignmentDisplayStatus } from "@/components/dashboard/library-types";

const STATUS_STYLE: Record<AssignmentDisplayStatus, string> = {
  "Not Started": "bg-[#f3f2f1] text-[#6f6964]",
  Submitted: "bg-[#eef5ff] text-[#5a78a8]",
  Ungraded: "bg-[#f5f3ef] text-[#736c63]",
  Graded: "bg-[#eef8f2] text-[#4f7a61]",
};

export function AssignmentStatusBadge({
  status,
}: {
  status: AssignmentDisplayStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLE[status]}`}
    >
      {status}
    </span>
  );
}
