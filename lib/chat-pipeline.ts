import {
  MessageRole,
  StudyRecordType,
  UserRole,
} from "../node_modules/.prisma/client/default";
import type { ChatTurn } from "@/lib/ai";
import { generateAssistantReply, streamAssistantReply } from "@/lib/ai";
import { takeAiTurn } from "@/lib/ai-rate-limit";
import { resolveDefaultChatModel } from "@/lib/ai-models";
import { logStructured } from "@/lib/app-log";
import { prismaCourseToPayload } from "./chat-course-context";
import type { CourseChatOrchestration, CourseChatViewerRole } from "@/lib/chat-prompt-orchestrator";
import type { CourseRagRetrievalResult } from "@/lib/chat-rag-retrieval";
import { retrieveCourseKnowledgeForChat } from "@/lib/chat-rag-retrieval";
import type { CourseContextPayload } from "@/lib/course-context";
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

type LoadedTurnContext =
  | { ok: false; error: string }
  | {
      ok: true;
      session: {
        id: string;
        userId: string;
        courseId: string | null;
        title: string | null;
        model: string | null;
      };
      history: ChatTurn[];
      courseContext: CourseContextPayload | null;
      orchestration: CourseChatOrchestration | undefined;
      model: string;
      retrieval: CourseRagRetrievalResult;
      viewerRole: CourseChatViewerRole;
    };

/** 校验配额与会话、组装本轮 LLM 所需 history（含尚未落库的用户句） */
async function loadCourseChatTurnContext(
  userId: string,
  sessionId: string,
  content: string,
): Promise<LoadedTurnContext> {
  const quota = takeAiTurn(userId);
  if (!quota.ok) {
    return { ok: false, error: quota.error };
  }

  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      title: true,
      model: true,
    },
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

  const history: ChatTurn[] = prior.map((m) => ({
    role: toOpenAIRole(m.role),
    content: m.content,
  }));
  history.push({ role: "user", content });

  const courseContext = session.courseId
    ? await prisma.learningCourse
        .findUnique({
          where: { id: session.courseId },
          include: { materials: { orderBy: { position: "asc" } } },
        })
        .then((course) => (course ? prismaCourseToPayload(course) : null))
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

  const orchestration: CourseChatOrchestration | undefined =
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

  const model = session.model?.trim() || resolveDefaultChatModel();

  return {
    ok: true,
    session,
    history,
    courseContext,
    orchestration,
    model,
    retrieval,
    viewerRole,
  };
}

async function persistAssistantAndSideEffects(params: {
  userId: string;
  sessionId: string;
  sessionCourseId: string | null;
  sessionTitle: string | null;
  userContent: string;
  reply: string;
  model: string;
  retrieval: CourseRagRetrievalResult;
  viewerRole: CourseChatViewerRole;
  /** 为 true 时在 StudyRecord.meta 中标记 streaming，便于排查 */
  streaming?: boolean;
}): Promise<void> {
  await prisma.chatMessage.create({
    data: {
      sessionId: params.sessionId,
      role: MessageRole.ASSISTANT,
      content: params.reply,
    },
  });

  if (params.sessionCourseId) {
    await prisma.studyRecord.create({
      data: {
        userId: params.userId,
        courseId: params.sessionCourseId,
        chatSessionId: params.sessionId,
        recordType: StudyRecordType.AI_SESSION,
        eventName: "ai_chat",
        source: "ai_sidebar",
        note: params.userContent.slice(0, 500),
        meta: {
          model: params.model,
          promptLength: params.userContent.length,
          promptVersion: CHAT_PROMPT_VERSION,
          viewerRole: params.viewerRole,
          ragMode: params.retrieval.ragMode,
          retrievalChunkIds: params.retrieval.retrievalChunkIds,
          ...(params.streaming ? { streaming: true } : {}),
          trackedAt: new Date().toISOString(),
        },
      },
    });
  }

  await prisma.chatSession.update({
    where: { id: params.sessionId },
    data: {
      title: params.sessionTitle?.trim()
        ? params.sessionTitle
        : params.userContent.slice(0, 40),
      model: params.model,
    },
  });
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
  const ctx = await loadCourseChatTurnContext(userId, sessionId, content);
  if (!ctx.ok) {
    return { ok: false, error: ctx.error };
  }

  const userRow = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: MessageRole.USER,
      content,
    },
  });

  let reply: string;
  try {
    reply = await generateAssistantReply(ctx.history, {
      courseContext: ctx.courseContext,
      orchestration: ctx.orchestration,
      model: ctx.model,
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

  await persistAssistantAndSideEffects({
    userId,
    sessionId,
    sessionCourseId: ctx.session.courseId,
    sessionTitle: ctx.session.title,
    userContent: content,
    reply,
    model: ctx.model,
    retrieval: ctx.retrieval,
    viewerRole: ctx.viewerRole,
  });

  return { ok: true, reply };
}

/**
 * 流式生成：先写入用户消息，边生成边回调 delta，完成后写入助手消息。
 * 失败时删除已写入的用户消息（与非流式路径一致）。
 */
export async function appendUserMessageStreamReply(
  userId: string,
  sessionId: string,
  content: string,
  onDelta: (chunk: string) => void | Promise<void>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await loadCourseChatTurnContext(userId, sessionId, content);
  if (!ctx.ok) {
    return { ok: false, error: ctx.error };
  }

  const userRow = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: MessageRole.USER,
      content,
    },
  });

  let reply: string;
  try {
    reply = await streamAssistantReply(
      ctx.history,
      {
        courseContext: ctx.courseContext,
        orchestration: ctx.orchestration,
        model: ctx.model,
      },
      onDelta,
    );
  } catch (e) {
    await prisma.chatMessage.delete({ where: { id: userRow.id } });
    logStructured("ai_chat_stream_failed", {
      userId,
      sessionId,
      err: e instanceof Error ? e.name : "unknown",
    });
    return {
      ok: false,
      error: e instanceof Error ? e.message : "生成回复失败",
    };
  }

  await persistAssistantAndSideEffects({
    userId,
    sessionId,
    sessionCourseId: ctx.session.courseId,
    sessionTitle: ctx.session.title,
    userContent: content,
    reply,
    model: ctx.model,
    retrieval: ctx.retrieval,
    viewerRole: ctx.viewerRole,
    streaming: true,
  });

  return { ok: true };
}
