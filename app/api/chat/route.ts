import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { appendUserMessageAndGetAssistantReply } from "@/lib/chat-pipeline";
import { err, ok } from "@/lib/api-response";
import { getSessionUser } from "@/lib/auth";

/**
 * POST JSON: { "message": string, "sessionId": string }
 * 需登录 Cookie；会话须属于当前用户。若 ChatSession 绑定 courseId，则走课程 grounded prompt（与 Server Action 一致）。
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(err("Unauthorized"), { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(err("Invalid JSON body"), { status: 400 });
  }

  const o =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : null;
  const message =
    o && typeof o.message === "string" ? o.message.trim() : "";
  const sessionId =
    o && typeof o.sessionId === "string" ? o.sessionId.trim() : "";

  if (!message) {
    return NextResponse.json(err("message is required"), { status: 400 });
  }
  if (!sessionId) {
    return NextResponse.json(err("sessionId is required"), { status: 400 });
  }

  const result = await appendUserMessageAndGetAssistantReply(
    user.id,
    sessionId,
    message,
  );
  if (!result.ok) {
    return NextResponse.json(err(result.error), { status: 400 });
  }

  revalidatePath("/chat");
  return NextResponse.json(ok({ reply: result.reply }), { status: 200 });
}
