"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MessageRole } from "../../../node_modules/.prisma/client/default";
import { generateAssistantReply } from "@/lib/ai";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SendMessageState } from "@/types/chat";

function toOpenAIRole(
  role: MessageRole,
): "user" | "assistant" | "system" {
  if (role === MessageRole.USER) return "user";
  if (role === MessageRole.ASSISTANT) return "assistant";
  return "system";
}

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

  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });
  if (!session) {
    return { error: "无权访问该会话" };
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

  const userRow = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: MessageRole.USER,
      content,
    },
  });

  let reply: string;
  try {
    reply = await generateAssistantReply(history);
  } catch (e) {
    await prisma.chatMessage.delete({ where: { id: userRow.id } });
    return {
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
      model: session.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    },
  });

  revalidatePath("/chat");
  return { error: null };
}

export async function createNewChatSession(): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  await prisma.chatSession.create({
    data: { userId: user.id, title: "新对话" },
  });
  revalidatePath("/chat");
  redirect("/chat");
}
