import { redirect } from "next/navigation";

type Search = { courseId?: string };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const courseId = sp.courseId?.trim();
  const query = new URLSearchParams();
  query.set("section", "ai");
  if (courseId) {
    query.set("courseId", courseId);
  }
  redirect(`/dashboard?${query.toString()}`);
}
