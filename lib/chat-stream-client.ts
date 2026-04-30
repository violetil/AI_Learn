/**
 * 消费本应用 `/api/chat/stream` 返回的 SSE（`data: {...}` 块以空行分隔）。
 */
export async function consumeChatSseStream(
  response: Response,
  onDelta: (chunk: string) => void,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const reader = response.body?.getReader();
  if (!reader) {
    return { ok: false, error: "无法读取响应流" };
  }

  const decoder = new TextDecoder();
  let carry = "";

  const dispatchBlock = (block: string): { ok: true } | { ok: false; error: string } | null => {
    for (const line of block.split("\n")) {
      const trimmed = line.replace(/\r$/, "").trim();
      if (!trimmed.startsWith("data:")) continue;
      const raw = trimmed.slice(5).trim();
      if (raw === "[DONE]") continue;
      try {
        const ev = JSON.parse(raw) as {
          delta?: string;
          done?: boolean;
          error?: string;
        };
        if (typeof ev.error === "string") {
          return { ok: false, error: ev.error };
        }
        if (ev.done) {
          return { ok: true };
        }
        if (typeof ev.delta === "string" && ev.delta.length > 0) {
          onDelta(ev.delta);
        }
      } catch {
        /* 忽略残缺 JSON */
      }
    }
    return null;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = carry.indexOf("\n\n")) >= 0) {
      const block = carry.slice(0, sep);
      carry = carry.slice(sep + 2);
      const r = dispatchBlock(block);
      if (r) return r;
    }
  }

  const tail = carry.trim();
  if (tail) {
    const r = dispatchBlock(tail);
    if (r) return r;
  }

  return { ok: true };
}
