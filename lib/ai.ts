/**
 * 集中调用 LLM；路由与 UI 不直接请求外部 API。
 * 未配置 OPENAI_API_KEY 时返回演示文案，便于本地开发。
 */
type ChatTurn = { role: "user" | "assistant" | "system"; content: string };

export async function generateAssistantReply(history: ChatTurn[]): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  const lastUser = history.filter((m) => m.role === "user").pop()?.content ?? "";

  if (!key?.trim()) {
    return `[演示模式] 未配置 OPENAI_API_KEY。你刚才说：「${lastUser.slice(0, 500)}」`;
  }

  const baseUrl =
    process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`LLM 请求失败 (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("LLM 返回为空");
  }
  return text;
}
