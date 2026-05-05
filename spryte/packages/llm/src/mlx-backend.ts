import type { ChatMessage } from "./types.js";
import { mlxCostUsd } from "./cost.js";
import { withTimeout } from "./timeout.js";

interface OpenAiCompatResponse {
  choices?: Array<{
    message?: { role?: string; content?: string | null };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

export async function completeMlx(options: {
  messages: ChatMessage[];
  maxOutputTokens?: number;
  timeoutMs?: number;
  temperature?: number;
  system?: string;
}): Promise<{ text: string; usage: { inputTokens: number; outputTokens: number }; latencyMs: number }> {
  const base = (
    process.env.MLX_BASE_URL?.trim() || "http://127.0.0.1:8000/v1"
  ).replace(/\/$/, "");
  const model = process.env.MLX_MODEL?.trim() || "mlx";
  const url = `${base}/chat/completions`;
  const timeoutMs = options.timeoutMs ?? 25_000;

  const mlxMessages =
    options.system && options.messages.length >= 0
      ? [{ role: "system" as const, content: options.system }, ...toOpenAiMessages(options.messages)]
      : toOpenAiMessages(options.messages);

  const payload = {
    model,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxOutputTokens ?? 1024,
    messages: mlxMessages,
  };

  const started = Date.now();

  const res = await withTimeout(
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    timeoutMs,
    "MLX fetch",
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MLX HTTP ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as OpenAiCompatResponse;
  const text = data.choices?.[0]?.message?.content ?? "";
  const latencyMs = Date.now() - started;

  const usage = {
    inputTokens: typeof data.usage?.prompt_tokens === "number" ? data.usage.prompt_tokens : 0,
    outputTokens:
      typeof data.usage?.completion_tokens === "number"
        ? data.usage.completion_tokens
        : 0,
  };

  return { text, usage, latencyMs };
}

function toOpenAiMessages(messages: ChatMessage[]): Array<{ role: string; content: string }> {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

export function finalizeMlxUsage(usage: {
  inputTokens: number;
  outputTokens: number;
}) {
  void usage;
  return {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    estimatedCostUsd: mlxCostUsd(),
  };
}
