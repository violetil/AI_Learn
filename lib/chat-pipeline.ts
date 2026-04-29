import { MessageRole } from "../node_modules/.prisma/client/default";
import { generateAssistantReply } from "@/lib/ai";
import { takeAiTurn } from "@/lib/ai-rate-limit";
import { resolveDefaultChatModel } from "@/lib/ai-models";
import { logStructured } from "@/lib/app-log";
import { prismaCourseToPayload } from "./chat-course-context";
import { canAccessCourseChat } from "@/lib/course-access";
import { prisma } from "@/lib/db";

function toOpenAIRole(
  role: MessageRole,
): "user" | "assistant" | "system" {
  if (role === MessageRole.USER) return "user";
  if (role === MessageRole.ASSISTANT) return "assistant";
  return "system";
}

/**
 * 在已校验归属的会话中追加一条用户消息并生成助手回复（含课程上下文时走 grounded prompt）。
 * 供 Server Action 与 Route Handler 复用。
 */
export async function appendUserMessageAndGetAssistantReply(
  userId: string,
  sessionId: string,
  content: string,
): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  const quota = takeAiTurn(userId);
  if (!quota.ok) {
    return { ok: false, error: quota.error };
  }

  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { ok: false, error: "无权访问该会话" };
  }
  if (session.courseId) {
    const canAccess = await canAccessCourseChat(userId, session.courseId);
    if (!canAccess) {
      return { ok: false, error: "无权访问该课程对话" };
    }
  }

  const prior = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 40,
    select: { role: true, content: true },
  });

  const history = prior.map((m) => ({
    role: toOpenAIRole(m.role),
    content: m.content,
  }));
  history.push({ role: "user", content });

  const courseContext = session.courseId
    ? await prisma.learningCourse.findUnique({
        where: { id: session.courseId },
        include: { materials: { orderBy: { position: "asc" } } },
      }).then((course) => (course ? prismaCourseToPayload(course) : null))
    : null;

  const userRow = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: MessageRole.USER,
      content,
    },
  });

  let reply: string;
  const model = session.model?.trim() || resolveDefaultChatModel();
  try {
    reply = await generateAssistantReply(history, { courseContext, model });
  } catch (e) {
    await prisma.chatMessage.delete({ where: { id: userRow.id } });
    logStructured("ai_chat_reply_failed", {
      userId,
      sessionId,
      err: e instanceof Error ? e.name : "unknown",
    });
    return {
      ok: false,
      error: e instanceof Error ? e.message : "生成回复失败",
    };
  }

  await prisma.chatMessage.create({
    data: {
      sessionId,
      role: MessageRole.ASSISTANT,
      content: reply,
    },
  });

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      title: session.title?.trim() ? session.title : content.slice(0, 40),
      model,
    },
  });

  return { ok: true, reply };
}
