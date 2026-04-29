/**
 * 文本嵌入（OpenAI 兼容 /v1/embeddings）。失败时返回 null，供 RAG 降级。
 */
export async function embedQuery(text: string): Promise<number[] | null> {
  const batch = await embedTexts([text]);
  return batch?.[0] ?? null;
}

export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || texts.length === 0) return null;

  const baseUrl =
    process.env.OPENAI_EMBEDDINGS_BASE_URL?.replace(/\/$/, "") ??
    process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ??
    "https://api.openai.com/v1";
  const model =
    process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";

  try {
    const res = await fetch(`${baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        input: texts,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(
        `[embeddings] HTTP ${res.status}: ${errText.slice(0, 200)}`,
      );
      return null;
    }

    const data = (await res.json()) as {
      data?: Array<{ embedding?: number[]; index?: number }>;
    };
    const rows = data.data;
    if (!rows?.length) return null;

    const sorted = [...rows].sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0),
    );
    return sorted.map((r) => r.embedding ?? []);
  } catch (e) {
    console.warn(
      "[embeddings] failed:",
      e instanceof Error ? e.message : e,
    );
    return null;
  }
}
