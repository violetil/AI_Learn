/**
 * 前端 / Server Action 以外场景：统一调用本应用 JSON API。
 * 自动附带 Cookie；可选附带 Bearer Token（如移动端或脚本）。
 */
import type { ApiResult } from "@/lib/api-response";

export type ApiClientOptions = {
  /** 显式传入 JWT（通常与 Cookie 二选一即可） */
  accessToken?: string;
};

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function apiPostJson<T>(
  path: string,
  body: Record<string, unknown>,
  options?: ApiClientOptions,
): Promise<ApiResult<T>> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const res = await fetch(path, {
    method: "POST",
    headers,
    credentials: "same-origin",
    body: JSON.stringify(body),
  });

  const data = (await parseJsonSafe(res)) as ApiResult<T> | null;
  if (!data || typeof data !== "object" || !("success" in data)) {
    return {
      success: false,
      error: `请求异常 (${res.status})`,
    };
  }
  return data;
}

export async function apiGetJson<T>(
  path: string,
  options?: ApiClientOptions,
): Promise<ApiResult<T>> {
  const headers: HeadersInit = {};
  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const res = await fetch(path, {
    method: "GET",
    headers,
    credentials: "same-origin",
  });

  const data = (await parseJsonSafe(res)) as ApiResult<T> | null;
  if (!data || typeof data !== "object" || !("success" in data)) {
    return {
      success: false,
      error: `请求异常 (${res.status})`,
    };
  }
  return data;
}
