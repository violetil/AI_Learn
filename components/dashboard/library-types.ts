export type LibraryTab = "recents" | "materials" | "assignments";

export type UserRole = "TEACHER" | "STUDENT";
export type StudentAssignmentStatus = "Not Started" | "Submitted" | "Graded";
export type TeacherAssignmentStatus = "Ungraded" | "Graded";
export type AssignmentDisplayStatus = StudentAssignmentStatus | TeacherAssignmentStatus;

export function getAssignmentStatusForRole(
  status: StudentAssignmentStatus,
  role: UserRole,
): AssignmentDisplayStatus {
  if (role === "TEACHER") {
    return status === "Graded" ? "Graded" : "Ungraded";
  }
  return status;
}

export type LibraryItem = {
  id: string;
  name: string;
  icon: string;
  course: string;
  createdBy: string;
  createdAt: string;
  status?: StudentAssignmentStatus;
  dueDate?: string;
  lastEdited: string;
  type: "material" | "assignment";
  description: string;
};
