import { redirect } from "next/navigation";
import { MessageRole } from "../../../node_modules/.prisma/client/default";
import { ChatApp, type ChatMessageVm } from "@/components/chat/chat-app";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ChatPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  let session = await prisma.chatSession.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
  });

  if (!session) {
    session = await prisma.chatSession.create({
      data: { userId: user.id, title: "新对话" },
    });
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

  return (
    <ChatApp
      sessionId={session.id}
      initialMessages={initialMessages}
      userEmail={user.email}
    />
  );
}
