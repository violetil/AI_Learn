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
  courseId: string;
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
  question?: string | null;
  materialContent?: string | null;
  materialUrl?: string | null;
  submissionRecordId?: string;
  submissionAnswer?: string;
  teacherReviewStatus?: "APPROVED" | "REJECTED" | null;
  teacherReviewComment?: string | null;
  teacherReviewScore?: number | null;
  reviewedAt?: string | null;
  aiReview?: {
    scoreSuggestion?: number | null;
    strengths?: string[];
    issues?: string[];
    suggestions?: string[];
    mode?: string;
    model?: string;
  } | null;
};
