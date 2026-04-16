/**
 * App Router Route Handlers 统一封装：标准 JSON、错误捕获、鉴权钩子。
 */
import { NextResponse } from "next/server";
import type { ApiResult } from "@/lib/api-response";
import { err } from "@/lib/api-response";
import { getSessionUserFromRequest } from "@/lib/auth";
import type { SessionUser } from "@/types/auth";

export type ApiContext = {
  request: Request;
  user: SessionUser;
};

type HandlerResult<T> = NextResponse<ApiResult<T>>;

function toResponse<T>(result: ApiResult<T>, status: number): HandlerResult<T> {
  return NextResponse.json(result, { status });
}

export async function withApiHandler<T>(
  request: Request,
  fn: () => Promise<ApiResult<T>>,
): Promise<HandlerResult<T>> {
  try {
    const result = await fn();
    const status = result.success ? 200 : 400;
    return toResponse(result, status);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "服务器内部错误";
    const isProd = process.env.NODE_ENV === "production";
    return toResponse(
      err(isProd ? "服务器内部错误" : message),
      500,
    );
  }
}

export async function withAuthApiHandler<T>(
  request: Request,
  fn: (ctx: ApiContext) => Promise<ApiResult<T>>,
): Promise<HandlerResult<T>> {
  try {
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return toResponse(err("未授权：请先登录或携带有效 JWT"), 401);
    }
    const result = await fn({ request, user });
    const status = result.success ? 200 : 400;
    return toResponse(result, status);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "服务器内部错误";
    const isProd = process.env.NODE_ENV === "production";
    return toResponse(
      err(isProd ? "服务器内部错误" : message),
      500,
    );
  }
}
