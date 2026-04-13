import { redirect } from "next/navigation";
import { MessageRole } from "../../../node_modules/.prisma/client/default";
import { ChatApp, type ChatMessageVm } from "@/components/chat/chat-app";
import { getSessionUser } from "@/lib/auth";
import { isCourseMember } from "@/lib/course-access";
import { prisma } from "@/lib/db";

type Search = { courseId?: string; sessionId?: string };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const sp = await searchParams;
  const queryCourseId = sp.courseId?.trim();
  const querySessionId = sp.sessionId?.trim();

  let courseTitle: string | null = null;
  let boundCourseId: string | null = null;

  let session = null as Awaited<
    ReturnType<typeof prisma.chatSession.findFirst>
  >;

  if (queryCourseId) {
    const course = await prisma.learningCourse.findFirst({
      where: {
        id: queryCourseId
      },
    });
    if (!course) {
      redirect("/chat");
    }
    const canAccess =
      course.ownerId === user.id || (await isCourseMember(user.id, course.id));
    if (!canAccess) {
      redirect("/chat");
    }
    courseTitle = course.title;
    boundCourseId = course.id;

    if (querySessionId) {
      session = await prisma.chatSession.findFirst({
        where: {
          id: querySessionId,
          userId: user.id,
          courseId: course.id,
          status: "ACTIVE",
        },
      });
    }

    if (!session) {
      session = await prisma.chatSession.findFirst({
        where: {
          userId: user.id,
          courseId: course.id,
          status: "ACTIVE",
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          userId: user.id,
          title: course.title,
          courseId: course.id,
        },
      });
    }
  } else {
    if (querySessionId) {
      session = await prisma.chatSession.findFirst({
        where: {
          id: querySessionId,
          userId: user.id,
          status: "ACTIVE",
          courseId: null,
        },
      });
    }

    if (!session) {
      session = await prisma.chatSession.findFirst({
        where: {
          userId: user.id,
          status: "ACTIVE",
          courseId: null,
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: { userId: user.id, title: "新对话" },
      });
    }
  }

  if (!session) {
    redirect("/login");
  }

  const rows = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true },
  });

  const initialMessages: ChatMessageVm[] = rows.map((r) => ({
    id: r.id,
    role:
      r.role === MessageRole.USER
        ? "USER"
        : r.role === MessageRole.ASSISTANT
          ? "ASSISTANT"
          : "SYSTEM",
    content: r.content,
  }));

  const sessions = await prisma.chatSession.findMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
      courseId: boundCourseId,
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
    take: 30,
  });

  return (
    <ChatApp
      sessionId={session.id}
      initialMessages={initialMessages}
      userEmail={user.email}
      courseId={boundCourseId}
      courseTitle={courseTitle}
      sessions={sessions.map((s) => ({
        id: s.id,
        title: s.title?.trim() || "未命名会话",
        updatedAtLabel: s.updatedAt.toLocaleString(),
      }))}
    />
  );
}
