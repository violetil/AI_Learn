import { redirect } from "next/navigation";

export default async function AssignmentReviewsPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
}) {
  const { courseId } = await params;
  redirect(`/dashboard?section=library&courseId=${encodeURIComponent(courseId)}`);
}
