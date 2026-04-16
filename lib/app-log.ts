/**
 * 轻量结构化日志（不含密钥与正文 PII）。
 */
export function logStructured(
  event: string,
  fields: Record<string, string | number | boolean | undefined>,
): void {
  const line = JSON.stringify({
    t: new Date().toISOString(),
    event,
    ...fields,
  });
  console.info(line);
}
