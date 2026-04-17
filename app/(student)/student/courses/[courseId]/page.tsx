import { redirect } from "next/navigation";

export default async function StudentCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  redirect(`/dashboard?section=library&courseId=${encodeURIComponent(courseId)}`);
}
