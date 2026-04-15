import { revalidatePath } from "next/cache";
import { appendUserMessageAndGetAssistantReply } from "@/lib/chat-pipeline";
import { err, ok } from "@/lib/api-response";
import { withAuthApiHandler } from "@/lib/api/handler";

/**
 * POST JSON: { "message": string, "sessionId": string }
 * 鉴权：Cookie 会话 或 `Authorization: Bearer <JWT>`。
 */
export async function POST(request: Request) {
  return withAuthApiHandler(request, async ({ user }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return err("Invalid JSON body");
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
      return err("message is required");
    }
    if (!sessionId) {
      return err("sessionId is required");
    }

    const result = await appendUserMessageAndGetAssistantReply(
      user.id,
      sessionId,
      message,
    );
    if (!result.ok) {
      return err(result.error);
    }

    revalidatePath("/chat");
    return ok({ reply: result.reply });
  });
}
