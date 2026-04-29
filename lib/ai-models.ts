const SUPPORTED_CHAT_MODELS = ["deepseek-v4-flash"] as const;

type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];

function normalizeChatModel(input: string | null | undefined): SupportedChatModel {
  const candidate = input?.trim();
  if (!candidate) return "deepseek-v4-flash";
  if ((SUPPORTED_CHAT_MODELS as readonly string[]).includes(candidate)) {
    return candidate as SupportedChatModel;
  }
  return "deepseek-v4-flash";
}

function resolveDefaultChatModel(): SupportedChatModel {
  return normalizeChatModel(process.env.OPENAI_MODEL);
}

export { SUPPORTED_CHAT_MODELS, normalizeChatModel, resolveDefaultChatModel };
export type { SupportedChatModel };
