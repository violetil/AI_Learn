import { NextResponse } from "next/server";
import { err, ok } from "@/lib/api-response";

/** 对话 API 占位：后续接入 LLM 与流式响应 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(err("Invalid JSON body"), { status: 400 });
  }

  const message =
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof (body as { message: unknown }).message === "string"
      ? (body as { message: string }).message
      : null;

  if (!message?.trim()) {
    return NextResponse.json(err("message is required"), { status: 400 });
  }

  return NextResponse.json(
    ok({ reply: `[placeholder] 收到：${message}` }),
    { status: 200 },
  );
}
