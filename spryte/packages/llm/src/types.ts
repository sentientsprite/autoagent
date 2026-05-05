import { z } from "zod";

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const LlmUsageSchema = z.object({
  inputTokens: z.number().nonnegative(),
  outputTokens: z.number().nonnegative(),
  estimatedCostUsd: z.number().nonnegative(),
});

export type LlmUsage = z.infer<typeof LlmUsageSchema>;

export const LlmCompletionResultSchema = z.object({
  text: z.string(),
  provider: z.enum(["anthropic", "mlx"]),
  usage: LlmUsageSchema,
  latencyMs: z.number().nonnegative(),
});

export type LlmCompletionResult = z.infer<typeof LlmCompletionResultSchema>;

export interface CompleteOptions {
  system?: string;
  messages: ChatMessage[];
  maxOutputTokens?: number;
  timeoutMs?: number;
  temperature?: number;
}
