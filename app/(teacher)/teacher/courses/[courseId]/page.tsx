import { redirect } from "next/navigation";

export default async function TeacherCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  redirect(`/dashboard?section=library&courseId=${encodeURIComponent(courseId)}`);
}
