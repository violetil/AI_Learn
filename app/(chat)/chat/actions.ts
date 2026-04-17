"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { appendUserMessageAndGetAssistantReply } from "@/lib/chat-pipeline";
import { getSessionUser } from "@/lib/auth";
import { canAccessCourseChat } from "@/lib/course-access";
import { prisma } from "@/lib/db";
import type { SendMessageState } from "@/types/chat";

export async function sendChatMessage(
  _prev: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }

  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!sessionId) {
    return { error: "会话无效" };
  }
  if (!content) {
    return { error: "请输入内容" };
  }
  if (content.length > 32000) {
    return { error: "内容过长" };
  }

  const result = await appendUserMessageAndGetAssistantReply(
    user.id,
    sessionId,
    content,
  );
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/dashboard");
  return { error: null };
}

export async function createNewChatSession(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const raw = formData.get("courseId");
  const courseId =
    typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : undefined;

  if (courseId) {
    const course = await prisma.learningCourse.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      redirect("/dashboard?section=ai");
    }
    const canAccess = await canAccessCourseChat(user.id, course.id);
    if (!canAccess) {
      redirect("/dashboard?section=ai");
    }
    await prisma.chatSession.create({
      data: {
        userId: user.id,
        title: course.title,
        courseId: course.id,
      },
    });
    revalidatePath("/dashboard");
    redirect(`/dashboard?section=ai&courseId=${encodeURIComponent(course.id)}`);
  }

  await prisma.chatSession.create({
    data: { userId: user.id, title: "新对话" },
  });
  revalidatePath("/dashboard");
  redirect("/dashboard?section=ai");
}

export async function renameChatSessionAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const courseIdRaw = String(formData.get("courseId") ?? "").trim();
  const courseId = courseIdRaw || null;

  if (!sessionId || !title) {
    return;
  }

  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId: user.id, status: "ACTIVE" },
    select: { id: true, courseId: true },
  });
  if (!session) {
    return;
  }

  await prisma.chatSession.update({
    where: { id: session.id },
    data: { title: title.slice(0, 80) },
  });
  revalidatePath("/dashboard");

  if (courseId) {
    redirect(`/dashboard?section=ai&courseId=${encodeURIComponent(courseId)}`);
  }
  redirect("/dashboard?section=ai");
}

export async function deleteChatSessionAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const courseIdRaw = String(formData.get("courseId") ?? "").trim();
  const courseId = courseIdRaw || null;

  if (!sessionId) {
    return;
  }

  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId: user.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (!session) {
    return;
  }

  await prisma.chatSession.delete({
    where: { id: session.id },
  });
  revalidatePath("/dashboard");

  if (courseId) {
    redirect(`/dashboard?section=ai&courseId=${encodeURIComponent(courseId)}`);
  }
  redirect("/dashboard?section=ai");
}
