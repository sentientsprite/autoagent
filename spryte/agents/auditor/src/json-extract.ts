export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidateRaw = fence ? fence[1]!.trim() : trimmed;

  const firstBrace = candidateRaw.indexOf("{");
  const lastBrace = candidateRaw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in model output");
  }

  const slice = candidateRaw.slice(firstBrace, lastBrace + 1);
  return JSON.parse(slice) as unknown;
}
