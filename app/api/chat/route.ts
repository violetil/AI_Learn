import { revalidatePath } from "next/cache";
import { z } from "zod";
import { appendUserMessageAndGetAssistantReply } from "@/lib/chat-pipeline";
import { err, ok } from "@/lib/api-response";
import { withAuthApiHandler } from "@/lib/api/handler";

const ChatPostBodySchema = z.object({
  message: z.string().trim().min(1).max(32000),
  sessionId: z.string().trim().min(1).max(128),
});

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

    const parsed = ChatPostBodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid body";
      return err(msg);
    }
    const { message, sessionId } = parsed.data;

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
