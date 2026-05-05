import { completeAnthropic, finalizeAnthropicUsage } from "./anthropic-backend.js";
import { completeMlx, finalizeMlxUsage } from "./mlx-backend.js";
import type { CompleteOptions, LlmCompletionResult } from "./types.js";

export interface StructuredLog {
  timestamp: string;
  level: "info" | "warn" | "error";
  event: string;
  provider?: string;
  latencyMs?: number;
  error?: string;
  extra?: Record<string, unknown>;
}

export type StructuredLogger = (entry: StructuredLog) => void;

const defaultLogger: StructuredLogger = (entry) => {
  console.log(JSON.stringify(entry));
};

export async function completeWithFallback(
  options: CompleteOptions,
  log: StructuredLogger = defaultLogger,
): Promise<LlmCompletionResult> {
  const anthropicConfigured = Boolean(
    process.env.ANTHROPIC_API_KEY?.trim(),
  );

  const errors: string[] = [];

  if (anthropicConfigured) {
    try {
      const { text, usage, latencyMs } = await completeAnthropic(options);
      const usageFull = finalizeAnthropicUsage(usage);
      log({
        timestamp: new Date().toISOString(),
        level: "info",
        event: "llm.complete",
        provider: "anthropic",
        latencyMs,
        extra: { ...usageFull },
      });
      return { text, provider: "anthropic", usage: usageFull, latencyMs };
    } catch (e) {
      const message =
        typeof e === "object" && e && "message" in e ? String(e.message) : String(e);
      errors.push(`anthropic: ${message}`);
      log({
        timestamp: new Date().toISOString(),
        level: "warn",
        event: "llm.complete.fallback_from_anthropic",
        provider: "anthropic",
        error: message,
      });
    }
  }

  try {
    const { text, usage, latencyMs } = await completeMlx({
      messages: options.messages,
      maxOutputTokens: options.maxOutputTokens,
      timeoutMs: options.timeoutMs,
      temperature: options.temperature,
      system: options.system,
    });
    const usageFull = finalizeMlxUsage(usage);
    log({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "llm.complete",
      provider: "mlx",
      latencyMs,
      extra: {
        fallbackFromAnthropicAttempts: anthropicConfigured,
        ...usageFull,
      },
    });
    return {
      text,
      provider: "mlx",
      usage: usageFull,
      latencyMs,
    };
  } catch (e) {
    const message =
      typeof e === "object" && e && "message" in e ? String(e.message) : String(e);
    errors.push(`mlx: ${message}`);
    log({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "llm.complete.failure",
      error: [...errors, `mlx: ${message}`].join(" | "),
    });
    throw new Error(`No LLM available. ${errors.concat(`mlx: ${message}`).join(" | ")}`);
  }
}
