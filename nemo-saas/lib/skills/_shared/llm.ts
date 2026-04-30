/**
 * Thin wrapper over the Vercel AI SDK so skills don't import provider SDKs
 * directly. Choosing a model here is one place to change; failover lives here
 * when we add OpenRouter behind a feature flag.
 */
import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import type { z } from "zod";

const DEFAULT_MODEL = process.env.NEMO_NARRATIVE_MODEL ?? "gpt-4o-mini";

function pickModel(name: string = DEFAULT_MODEL) {
  if (name.startsWith("claude")) return anthropic(name);
  return openai(name);
}

export interface NarrativeArgs<T> {
  /** System-level instructions = the per-tenant playbook markdown. */
  playbook: string;
  /** Structured deterministic output the LLM must turn into prose. */
  structured: unknown;
  /** Schema the model output must conform to. */
  schema: z.ZodType<T>;
  /** Free-form task instructions on top of the playbook. */
  task: string;
  /** Optional model override (default: NEMO_NARRATIVE_MODEL env). */
  model?: string;
}

export async function narrative<T>(args: NarrativeArgs<T>): Promise<{ value: T; usage: Usage }> {
  const result = await generateObject({
    model: pickModel(args.model),
    schema: args.schema,
    system: args.playbook,
    prompt:
      `Task: ${args.task}\n\nStructured input (JSON):\n` +
      JSON.stringify(args.structured, null, 2) +
      `\n\nReturn ONLY a JSON value matching the schema. ` +
      `Every claim you make must trace back to a field in the structured input.`,
  });
  return {
    value: result.object,
    usage: {
      tokensIn: result.usage.promptTokens ?? 0,
      tokensOut: result.usage.completionTokens ?? 0,
    },
  };
}

export async function paragraph(playbook: string, task: string, model?: string): Promise<{ text: string; usage: Usage }> {
  const result = await generateText({
    model: pickModel(model),
    system: playbook,
    prompt: task,
  });
  return {
    text: result.text,
    usage: {
      tokensIn: result.usage.promptTokens ?? 0,
      tokensOut: result.usage.completionTokens ?? 0,
    },
  };
}

export interface Usage {
  tokensIn: number;
  tokensOut: number;
}
