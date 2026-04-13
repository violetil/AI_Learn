"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { appendUserMessageAndGetAssistantReply } from "@/lib/chat-pipeline";
import { getSessionUser } from "@/lib/auth";
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

  revalidatePath("/chat");
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
    const course = await prisma.learningCourse.findFirst({
      where: {
        id: courseId,
        OR: [{ ownerId: user.id }, { status: "PUBLISHED" }],
      },
    });
    if (!course) {
      redirect("/chat");
    }
    await prisma.chatSession.create({
      data: {
        userId: user.id,
        title: course.title,
        courseId: course.id,
      },
    });
    revalidatePath("/chat");
    redirect(`/chat?courseId=${encodeURIComponent(course.id)}`);
  }

  await prisma.chatSession.create({
    data: { userId: user.id, title: "新对话" },
  });
  revalidatePath("/chat");
  redirect("/chat");
}
