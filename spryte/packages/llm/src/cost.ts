/**
 * Default Haiku-era pricing placeholders (USD per 1M tokens).
 * Override with SPRITE_ANTHROPIC_INPUT_USD_PER_M / SPRITE_ANTHROPIC_OUTPUT_USD_PER_M.
 */
export function estimateAnthropicCostUsd(
  inputTokens: number,
  outputTokens: number,
): number {
  const inputPerM = Number(
    process.env.SPRITE_ANTHROPIC_INPUT_USD_PER_M ?? "1",
  );
  const outputPerM = Number(
    process.env.SPRITE_ANTHROPIC_OUTPUT_USD_PER_M ?? "5",
  );
  return (inputTokens / 1e6) * inputPerM + (outputTokens / 1e6) * outputPerM;
}

export function mlxCostUsd(): number {
  return Number(process.env.SPRITE_MLX_COST_PER_CALL_USD ?? "0");
}
