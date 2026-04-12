import { NextResponse } from "next/server";
import { ok } from "@/lib/api-response";

/** 会话探测示例：后续可接入 Cookie / JWT 等 */
export async function GET() {
  return NextResponse.json(
    ok({ authenticated: false as const }),
    { status: 200 },
  );
}
