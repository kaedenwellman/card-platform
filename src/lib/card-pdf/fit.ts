import "server-only";
import { textWidth, type FontId } from "./fonts";

export const MIN_PT = 8; // nothing printed smaller than 8 pt

export type FitSpec = {
  font: FontId;
  size: number; // preferred size, pt
  minSize?: number; // smallest allowed, pt (never below MIN_PT)
  maxWidth: number; // pt
  maxLines?: number; // default 1
  tracking?: number; // letter spacing in em
};

export type Fitted = { size: number; lines: string[]; tracking: number; font: FontId };

// Breaks text onto lines greedily, at spaces or after hyphens ("Smith-|Jones"); null if one piece
// is wider than the line.
function wrap(text: string, spec: FitSpec, size: number): string[] | null {
  const pieces = text
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => word.split(/(?<=-)(?=.)/).map((p, i) => ({ p, space: i === 0 })));
  const fits = (s: string) => textWidth(spec.font, s, size, spec.tracking) <= spec.maxWidth;
  const lines: string[] = [];
  let current = "";
  for (const { p: word, space } of pieces) {
    const next = current ? `${current}${space ? " " : ""}${word}` : word;
    if (fits(next)) current = next;
    else {
      if (!current || !fits(word)) return null;
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Fewest lines first: shrinks up to 20% to stay on n lines before wrapping to n + 1, and on the
// last allowed line count shrinks down to the minimum size (never below 8 pt). Returns null if it
// still doesn't fit; the caller refuses to make that PDF.
export function fit(text: string, spec: FitSpec): Fitted | null {
  const min = Math.max(MIN_PT, spec.minSize ?? MIN_PT);
  const maxLines = spec.maxLines ?? 1;
  for (let n = 1; n <= maxLines; n++) {
    const floor = n === maxLines ? min : Math.max(min, spec.size * 0.8);
    for (let size = spec.size; size >= floor - 1e-6; size -= 0.5) {
      const lines = wrap(text, spec, size);
      if (lines && lines.length <= n) return { size, lines, tracking: spec.tracking ?? 0, font: spec.font };
    }
  }
  return null;
}
