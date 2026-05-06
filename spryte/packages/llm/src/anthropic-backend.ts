import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "./types.js";
import { estimateAnthropicCostUsd } from "./cost.js";
import { withTimeout } from "./timeout.js";

function toAnthropicMessages(messages: ChatMessage[]): Anthropic.MessageParam[] {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));
}

export async function completeAnthropic(options: {
  system?: string;
  messages: ChatMessage[];
  maxOutputTokens?: number;
  timeoutMs?: number;
  temperature?: number;
}): Promise<{ text: string; usage: { inputTokens: number; outputTokens: number }; latencyMs: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const model =
    process.env.SPRYTE_ANTHROPIC_MODEL?.trim() ||
    process.env.SPRITE_ANTHROPIC_MODEL?.trim() ||
    "claude-3-5-haiku-20241022";

  const client = new Anthropic({ apiKey });
  const timeoutMs = options.timeoutMs ?? 25_000;
  const started = Date.now();

  const response = await withTimeout(
    client.messages.create({
      model,
      max_tokens: options.maxOutputTokens ?? 1024,
      temperature: options.temperature ?? 0.2,
      system: options.system,
      messages: toAnthropicMessages(options.messages),
    }),
    timeoutMs,
    `Anthropic (${model})`,
  );

  const latencyMs = Date.now() - started;

  const textParts: string[] = [];
  for (const block of response.content) {
    if (block.type === "text") textParts.push(block.text);
  }

  const usage = {
    inputTokens:
      typeof response.usage?.input_tokens === "number"
        ? response.usage.input_tokens
        : 0,
    outputTokens:
      typeof response.usage?.output_tokens === "number"
        ? response.usage.output_tokens
        : 0,
  };

  return {
    text: textParts.join("") || "",
    usage,
    latencyMs,
  };
}

export function finalizeAnthropicUsage(usage: {
  inputTokens: number;
  outputTokens: number;
}) {
  return {
    ...usage,
    estimatedCostUsd: estimateAnthropicCostUsd(
      usage.inputTokens,
      usage.outputTokens,
    ),
  };
}
