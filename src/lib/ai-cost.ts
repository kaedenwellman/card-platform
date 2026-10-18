// Claude API list prices in dollars per million tokens (input, output), for the cost estimates on
// /admin. Update when prices change. Models not listed show as unpriced instead of a wrong number.
const PRICES: Record<string, [number, number]> = {
  "claude-sonnet-5-5": [2, 10],
  "claude-opus-5-5": [4, 20],
  "claude-opus-5": [5, 25],
  "claude-fable-5-1": [10, 50],
};

export function costUsd(model: string | null, inputTokens: number, outputTokens: number): number | null {
  const base = model?.replace(/-\d{8}$/, ""); // tolerate dated model IDs in responses
  const p = base ? PRICES[base] : undefined;
  return p ? (inputTokens * p[0] + outputTokens * p[1]) / 1_000_000 : null;
}
