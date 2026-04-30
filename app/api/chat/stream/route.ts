import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { appendUserMessageStreamReply } from "@/lib/chat-pipeline";
import { err } from "@/lib/api-response";
import { getSessionUserFromRequest } from "@/lib/auth";

const ChatStreamBodySchema = z.object({
  message: z.string().trim().min(1).max(32000),
  sessionId: z.string().trim().min(1).max(128),
});

/**
 * POST JSON: { message, sessionId }
 * 返回 text/event-stream：`data: {"delta":"..."}`；结束 `data: {"done":true}` 或 `data: {"error":"..."}`。
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json(err("未授权：请先登录或携带有效 JWT"), {
        status: 401,
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(err("请求体必须为有效的 JSON"), { status: 400 });
    }

    const parsed = ChatStreamBodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "请求参数无效";
      return NextResponse.json(err(msg), { status: 400 });
    }
    const { message, sessionId } = parsed.data;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const push = (obj: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(obj)}\n\n`),
          );
        };
        try {
          const result = await appendUserMessageStreamReply(
            user.id,
            sessionId,
            message,
            (chunk) => {
              push({ delta: chunk });
            },
          );
          if (!result.ok) {
            push({ error: result.error });
          } else {
            push({ done: true });
            revalidatePath("/dashboard");
          }
        } catch (e) {
          push({
            error: e instanceof Error ? e.message : "流式生成失败",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器内部错误";
    return NextResponse.json(err(message), { status: 500 });
  }
}
