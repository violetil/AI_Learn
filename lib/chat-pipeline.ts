import {
  MessageRole,
  StudyRecordType,
  UserRole,
} from "../node_modules/.prisma/client/default";
import { generateAssistantReply } from "@/lib/ai";
import { takeAiTurn } from "@/lib/ai-rate-limit";
import { resolveDefaultChatModel } from "@/lib/ai-models";
import { logStructured } from "@/lib/app-log";
import { prismaCourseToPayload } from "./chat-course-context";
import type { CourseChatViewerRole } from "@/lib/chat-prompt-orchestrator";
import type { CourseRagRetrievalResult } from "@/lib/chat-rag-retrieval";
import { retrieveCourseKnowledgeForChat } from "@/lib/chat-rag-retrieval";
import { canAccessCourseChat } from "@/lib/course-access";
import { CHAT_PROMPT_VERSION } from "@/lib/rag-config";
import { buildStudentChatStateSummary } from "@/lib/student-state-summary";
import { buildTeacherCourseChatSummary } from "@/lib/teacher-course-chat-summary";
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

  let retrieval: CourseRagRetrievalResult = {
    ragMode: "fallback",
    snippets: [],
    retrievalChunkIds: [],
  };
  let studentStateSummary: string | null = null;
  let teacherCourseSummary: string | null = null;

  const chatUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (session.courseId && courseContext) {
    retrieval = await retrieveCourseKnowledgeForChat({
      courseId: session.courseId,
      userQuestion: content,
    });
    if (chatUser) {
      if (chatUser.role === UserRole.STUDENT) {
        studentStateSummary = await buildStudentChatStateSummary({
          userId,
          courseId: session.courseId,
          role: chatUser.role,
        });
      } else if (chatUser.role === UserRole.TEACHER) {
        teacherCourseSummary = await buildTeacherCourseChatSummary({
          userId,
          courseId: session.courseId,
          role: chatUser.role,
        });
      }
    }
  }

  const viewerRole: CourseChatViewerRole =
    chatUser?.role === UserRole.TEACHER ? "TEACHER" : "STUDENT";

  const orchestration =
    courseContext != null && chatUser
      ? {
          viewerRole,
          ragSnippets: retrieval.snippets,
          ragMode: retrieval.ragMode,
          studentStateSummary:
            chatUser.role === UserRole.STUDENT ? studentStateSummary : null,
          teacherCourseSummary:
            chatUser.role === UserRole.TEACHER ? teacherCourseSummary : null,
        }
      : undefined;

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
    reply = await generateAssistantReply(history, {
      courseContext,
      orchestration,
      model,
    });
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

  if (session.courseId) {
    await prisma.studyRecord.create({
      data: {
        userId,
        courseId: session.courseId,
        chatSessionId: session.id,
        recordType: StudyRecordType.AI_SESSION,
        eventName: "ai_chat",
        source: "ai_sidebar",
        note: content.slice(0, 500),
        meta: {
          model,
          promptLength: content.length,
          promptVersion: CHAT_PROMPT_VERSION,
          viewerRole,
          ragMode: retrieval.ragMode,
          retrievalChunkIds: retrieval.retrievalChunkIds,
          trackedAt: new Date().toISOString(),
        },
      },
    });
  }

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      title: session.title?.trim() ? session.title : content.slice(0, 40),
      model,
    },
  });

  return { ok: true, reply };
}
