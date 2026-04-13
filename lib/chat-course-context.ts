import type { CourseContextPayload } from "@/lib/course-context";

/** 将 Prisma 查询出的课程 + 资料映射为 prompt 构造用的 payload */
export function prismaCourseToPayload(course: {
  title: string;
  description: string | null;
  materials: Array<{
    title: string;
    kind: string;
    url: string | null;
    content: string | null;
    position: number;
  }>;
}): CourseContextPayload {
  const materials = [...course.materials].sort(
    (a, b) => a.position - b.position,
  );
  return {
    courseTitle: course.title,
    courseDescription: course.description ?? "",
    materials: materials.map((m) => ({
      title: m.title,
      kind: String(m.kind),
      url: m.url,
      content: m.content,
      position: m.position,
    })),
  };
}
