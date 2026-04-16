import { revalidatePath } from "next/cache";
import { ok, err } from "@/lib/api-response";
import { withAuthApiHandler } from "@/lib/api/handler";
import { canAccessCourseChat } from "@/lib/course-access";
import { prisma } from "@/lib/db";

function toVmRole(role: string): "USER" | "ASSISTANT" | "SYSTEM" {
  if (role === "USER") return "USER";
  if (role === "ASSISTANT") return "ASSISTANT";
  return "SYSTEM";
}

export async function GET(request: Request) {
  return withAuthApiHandler(request, async ({ user }) => {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId")?.trim() || "";
    const sessionId = searchParams.get("sessionId")?.trim() || "";

    if (!courseId) {
      return err("缺少 courseId");
    }

    const canAccess = await canAccessCourseChat(user.id, courseId);
    if (!canAccess) {
      return err("无权访问该课程聊天");
    }

    let session =
      (sessionId
        ? await prisma.chatSession.findFirst({
            where: {
              id: sessionId,
              userId: user.id,
              courseId,
              status: "ACTIVE",
            },
          })
        : null) ||
      (await prisma.chatSession.findFirst({
        where: {
          userId: user.id,
          courseId,
          status: "ACTIVE",
        },
        orderBy: { updatedAt: "desc" },
      }));

    if (!session) {
      const course = await prisma.learningCourse.findUnique({
        where: { id: courseId },
        select: { title: true },
      });
      if (!course) {
        return err("课程不存在");
      }
      session = await prisma.chatSession.create({
        data: {
          userId: user.id,
          courseId,
          title: course.title,
        },
      });
    }

    const [rows, sessions] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true },
      }),
      prisma.chatSession.findMany({
        where: { userId: user.id, courseId, status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, updatedAt: true },
        take: 30,
      }),
    ]);

    return ok({
      sessionId: session.id,
      messages: rows.map((row) => ({
        id: row.id,
        role: toVmRole(row.role),
        content: row.content,
      })),
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title?.trim() || "未命名会话",
        updatedAtLabel: s.updatedAt.toLocaleString(),
      })),
    });
  });
}

export async function POST(request: Request) {
  return withAuthApiHandler(request, async ({ user }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return err("请求体格式错误");
    }

    const courseId =
      body && typeof body === "object" && "courseId" in body
        ? String((body as { courseId?: string }).courseId ?? "").trim()
        : "";

    if (!courseId) {
      return err("缺少 courseId");
    }

    const course = await prisma.learningCourse.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    });
    if (!course) {
      return err("课程不存在");
    }

    const canAccess = await canAccessCourseChat(user.id, course.id);
    if (!canAccess) {
      return err("无权访问该课程聊天");
    }

    const created = await prisma.chatSession.create({
      data: {
        userId: user.id,
        courseId: course.id,
        title: course.title,
      },
      select: { id: true },
    });
    revalidatePath("/dashboard");
    revalidatePath("/chat");
    return ok({ sessionId: created.id });
  });
}
