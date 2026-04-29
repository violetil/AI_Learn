import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ok, err } from "@/lib/api-response";
import { withAuthApiHandler } from "@/lib/api/handler";
import { normalizeChatModel, resolveDefaultChatModel } from "@/lib/ai-models";
import { canAccessCourseChat } from "@/lib/course-access";
import { prisma } from "@/lib/db";

function toVmRole(role: string): "USER" | "ASSISTANT" | "SYSTEM" {
  if (role === "USER") return "USER";
  if (role === "ASSISTANT") return "ASSISTANT";
  return "SYSTEM";
}

const createSessionSchema = z.object({
  courseId: z.string().trim().min(1),
  model: z.string().trim().optional(),
});

const updateSessionSchema = z.object({
  courseId: z.string().trim().min(1),
  sessionId: z.string().trim().min(1),
  title: z.string().trim().max(80).optional(),
  model: z.string().trim().optional(),
});

const deleteSessionSchema = z.object({
  courseId: z.string().trim().min(1),
  sessionId: z.string().trim().min(1),
});

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
          model: resolveDefaultChatModel(),
        },
      });
    }

    const [rows, sessions, materialCount, course] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true },
      }),
      prisma.chatSession.findMany({
        where: { userId: user.id, courseId, status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, model: true, updatedAt: true },
        take: 30,
      }),
      prisma.learningMaterial.count({ where: { courseId } }),
      prisma.learningCourse.findUnique({
        where: { id: courseId },
        select: { title: true },
      }),
    ]);

    return ok({
      sessionId: session.id,
      activeModel: session.model?.trim() || resolveDefaultChatModel(),
      contextMaterialCount: materialCount,
      courseTitle: course?.title || "",
      messages: rows.map((row) => ({
        id: row.id,
        role: toVmRole(row.role),
        content: row.content,
      })),
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title?.trim() || "未命名会话",
        model: s.model?.trim() || resolveDefaultChatModel(),
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

    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "请求参数无效");
    }
    const { courseId, model } = parsed.data;

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
        model: normalizeChatModel(model),
      },
      select: { id: true, model: true },
    });
    revalidatePath("/dashboard");
    return ok({ sessionId: created.id, model: created.model || resolveDefaultChatModel() });
  });
}

export async function PATCH(request: Request) {
  return withAuthApiHandler(request, async ({ user }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return err("请求体格式错误");
    }

    const parsed = updateSessionSchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "请求参数无效");
    }
    const { courseId, sessionId, title, model } = parsed.data;
    if (!title?.trim() && !model?.trim()) {
      return err("至少需要更新标题或模型");
    }

    const canAccess = await canAccessCourseChat(user.id, courseId);
    if (!canAccess) {
      return err("无权访问该课程聊天");
    }

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: user.id, courseId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!session) {
      return err("会话不存在");
    }

    const updated = await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        ...(title?.trim() ? { title: title.trim().slice(0, 80) } : {}),
        ...(model?.trim() ? { model: normalizeChatModel(model) } : {}),
      },
      select: { id: true, title: true, model: true },
    });
    revalidatePath("/dashboard");
    return ok({
      sessionId: updated.id,
      title: updated.title?.trim() || "未命名会话",
      model: updated.model?.trim() || resolveDefaultChatModel(),
    });
  });
}

export async function DELETE(request: Request) {
  return withAuthApiHandler(request, async ({ user }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return err("请求体格式错误");
    }

    const parsed = deleteSessionSchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "请求参数无效");
    }
    const { courseId, sessionId } = parsed.data;

    const canAccess = await canAccessCourseChat(user.id, courseId);
    if (!canAccess) {
      return err("无权访问该课程聊天");
    }

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: user.id, courseId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!session) {
      return err("会话不存在");
    }

    await prisma.chatSession.delete({
      where: { id: session.id },
    });
    revalidatePath("/dashboard");
    return ok({ deletedSessionId: session.id });
  });
}
