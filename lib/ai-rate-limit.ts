/**
 * 进程内 AI 请求粗粒度限流（多实例部署需换 Redis 等共享存储）。
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;

export function takeAiTurn(userId: string): { ok: true } | { ok: false; error: string } {
  const now = Date.now();
  const b = buckets.get(userId);
  if (!b || now >= b.resetAt) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (b.count >= MAX_PER_WINDOW) {
    return { ok: false, error: "请求过于频繁，请约一分钟后再试。" };
  }
  b.count += 1;
  return { ok: true };
}

/** 测试用：清空桶 */
export function __resetAiRateLimitForTests() {
  buckets.clear();
}
