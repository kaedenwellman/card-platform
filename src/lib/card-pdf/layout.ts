import "server-only";
import { getPalette, type CardTemplateId, type Palette } from "@/lib/design";
import { fit, type Fitted } from "./fit";
import { textWidth } from "./fonts";
import type { QrMatrix } from "./qr";

// Business card geometry in PDF points (72 pt = 1 in). Trim 3.5 × 2 in, ⅛ in bleed.
export const W = 252;
export const H = 144;
export const BLEED = 9;
const CW = W / 100; // the on-screen card's cqw unit, so PDF and preview share proportions
const P = 8 * CW; // padding; well inside the ⅛ in safe zone

export type El =
  | { kind: "rect"; x: number; y: number; w: number; h: number; color: string; radius?: number }
  | { kind: "text"; x: number; y: number; w: number; t: Fitted; color: string; lineHeight: number }
  | { kind: "image"; x: number; y: number; d: number; data: Buffer }
  | { kind: "qr"; x: number; y: number; size: number; matrix: QrMatrix };

// Everything to draw for one side, in trim coordinates (0,0 = top left of the trimmed card).
// Shapes that touch an edge extend into the bleed; the renderer clips to the page.
export type Face = { bg: string; els: El[] };

export type CardInput = {
  design: CardTemplateId;
  palette: Palette;
  name: string;
  line: string;
  phone: string | null;
  email: string | null;
  domain: string;
  photo: Buffer | null; // PNG, already cropped square
  qr: QrMatrix;
};

export class CardFitError extends Error {}

const LH = 1.2; // line box height for small text, in em

function need(t: Fitted | null, what: string): Fitted {
  if (!t) throw new CardFitError(what);
  return t;
}

const height = (t: Fitted, lh: number) => t.lines.length * t.size * lh;

function textEl(x: number, y: number, w: number, t: Fitted, color: string, lineHeight = LH): El {
  return { kind: "text", x, y, w, t, color, lineHeight };
}

// Centered variant: each line positioned by its own measured width.
function centered(cx: number, y: number, t: Fitted, color: string, lineHeight = LH): El[] {
  return t.lines.map((line, i) => {
    const lw = textWidth(t.font, line, t.size, t.tracking);
    return textEl(cx - lw / 2, y + i * t.size * lineHeight, lw, { ...t, lines: [line] }, color, lineHeight);
  });
}

// Phone and email stacked (bottom-anchored or flowing). Long emails may break before the "@".
function contactLines(input: CardInput, maxWidth: number, size: number): Fitted[] {
  const out: Fitted[] = [];
  const base = { font: "regular" as const, size, maxWidth };
  if (input.phone) out.push(need(fit(input.phone, base), "Your phone number doesn't fit on the card."));
  if (input.email) {
    const one = fit(input.email, base);
    if (one) out.push(one);
    else {
      const at = input.email.indexOf("@");
      const parts = at > 0 ? [input.email.slice(0, at), input.email.slice(at)] : [input.email];
      const fitted = parts.map((p) => fit(p, base));
      if (parts.length < 2 || fitted.some((f) => !f)) throw new CardFitError("Your email address is too long for this card design.");
      const s = Math.min(...fitted.map((f) => f!.size));
      out.push({ size: s, lines: parts, tracking: 0, font: "regular" });
    }
  }
  return out;
}

const stackHeight = (items: Fitted[], gap: number) =>
  items.reduce((h, t) => h + height(t, LH), 0) + Math.max(0, items.length - 1) * gap;

function stack(x: number, y: number, w: number, items: Fitted[], gap: number, color: string): El[] {
  const els: El[] = [];
  for (const t of items) {
    els.push(textEl(x, y, w, t, color));
    y += height(t, LH) + gap;
  }
  return els;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .slice(0, 2)
    .join("");

const tooMuch = () => new CardFitError("There's too much text to fit on this card design. Shorten your headline or try another design.");

// Tries the name on up to 3 lines first; if the card is then too crowded, retries with fewer,
// smaller name lines. The first error is reported if nothing fits.
export function frontFace(input: CardInput): Face {
  let first: unknown;
  for (const nameLines of [3, 2, 1]) {
    try {
      return buildFront(input, nameLines);
    } catch (err) {
      if (!(err instanceof CardFitError)) throw err;
      first ??= err;
    }
  }
  throw first;
}

function buildFront(input: CardInput, nameLines: number): Face {
  const pal = input.design === "paper" ? getPalette("paper") : input.palette;
  const els: El[] = [];
  const nameErr = "Your name is too long for this card design.";
  const lineErr = "Your headline is too long for the card. Shorten it, or try another design.";

  switch (input.design) {
    case "classic": {
      const maxWidth = W - 2 * P;
      const name = need(fit(input.name.toUpperCase(), { font: "wide600", size: 4.4 * CW, maxWidth, maxLines: nameLines, tracking: 0.22 }), nameErr);
      els.push(textEl(P, P, maxWidth, name, pal.ink, 1.05));
      let y = P + height(name, 1.05);
      if (input.line) {
        const line = need(fit(input.line, { font: "regular", size: 3.6 * CW, maxWidth, maxLines: 2 }), lineErr);
        y += 2 * CW;
        els.push(textEl(P, y, maxWidth, line, pal.accent));
        y += height(line, LH);
      }
      const contact = contactLines(input, maxWidth, 3.3 * CW);
      const top = H - P - stackHeight(contact, 0.8 * CW);
      if (y + 2 * CW > top) throw tooMuch();
      els.push(...stack(P, top, maxWidth, contact, 0.8 * CW, pal.muted));
      break;
    }

    case "bold": {
      const maxWidth = W - 2 * P;
      els.push({ kind: "rect", x: P, y: P, w: 14 * CW, h: 1.4 * CW, color: pal.accent });
      const name = need(fit(input.name, { font: "wide850", size: 9 * CW, minSize: 11, maxWidth, maxLines: nameLines, tracking: -0.01 }), nameErr);
      const line = input.line ? need(fit(input.line, { font: "regular", size: 3.6 * CW, maxWidth, maxLines: 2 }), lineErr) : null;
      // Phone and email side by side when they fit, otherwise stacked.
      const size = 3.3 * CW;
      const gap = 4 * CW;
      const parts = [input.phone, input.email].filter((s): s is string => Boolean(s));
      const row = parts.reduce((w, s, i) => w + textWidth("regular", s, size) + (i ? gap : 0), 0);
      const contact = parts.length === 2 && row <= maxWidth ? null : contactLines(input, maxWidth, size);
      const contactH = contact ? stackHeight(contact, 0.5 * CW) : parts.length ? size * LH : 0;

      let y = H - P - contactH;
      if (contact) els.push(...stack(P, y, maxWidth, contact, 0.5 * CW, pal.muted));
      else {
        let x = P;
        for (const s of parts) {
          const t = { size, lines: [s], tracking: 0, font: "regular" as const };
          const w = textWidth("regular", s, size);
          els.push(textEl(x, y, w, t, pal.muted));
          x += w + gap;
        }
      }
      if (parts.length) y -= 4 * CW;
      if (line) {
        y -= height(line, LH);
        els.push(textEl(P, y, maxWidth, line, pal.accent));
        y -= 2 * CW;
      }
      y -= height(name, 0.95);
      els.push(textEl(P, y, maxWidth, name, pal.ink, 0.95));
      if (y < P + 1.4 * CW + 3 * CW) throw tooMuch();
      break;
    }

    case "split": {
      const panelW = W * 0.36;
      els.push({ kind: "rect", x: -BLEED, y: -BLEED, w: panelW + BLEED, h: H + 2 * BLEED, color: pal.accent });
      const initials = fit(initialsOf(input.name), { font: "wide850", size: 13 * CW, maxWidth: panelW - 4 * CW, tracking: -0.02 });
      if (initials) {
        const ih = initials.size * 1.0;
        els.push(...centered(panelW / 2, H / 2 - ih / 2, initials, pal.onAccent, 1.0));
      }
      const pad = 7 * CW;
      const x = panelW + pad;
      const maxWidth = W - x - pad;
      const name = need(fit(input.name, { font: "semi750", size: 5.6 * CW, maxWidth, maxLines: nameLines }), nameErr);
      els.push(textEl(x, pad, maxWidth, name, pal.ink, 1.05));
      let y = pad + height(name, 1.05);
      if (input.line) {
        const line = need(fit(input.line, { font: "regular", size: 3.6 * CW, maxWidth, maxLines: 3 }), lineErr);
        y += 2 * CW;
        els.push(textEl(x, y, maxWidth, line, pal.accent));
        y += height(line, LH);
      }
      const contact = contactLines(input, maxWidth, 3.3 * CW);
      const top = H - pad - stackHeight(contact, 0.8 * CW);
      if (y + 2 * CW > top) throw tooMuch();
      els.push(...stack(x, top, maxWidth, contact, 0.8 * CW, pal.muted));
      break;
    }

    case "photo": {
      const d = 28 * CW;
      const ay = (H - d) / 2;
      const ring = 0.8 * CW;
      els.push({ kind: "rect", x: P, y: ay, w: d, h: d, color: pal.accent, radius: d / 2 });
      if (input.photo) {
        els.push({ kind: "image", x: P + ring, y: ay + ring, d: d - 2 * ring, data: input.photo });
      } else {
        const initials = fit(initialsOf(input.name), { font: "wide850", size: 10 * CW, maxWidth: d - 4 * CW });
        if (initials) els.push(...centered(P + d / 2, H / 2 - initials.size / 2, initials, pal.onAccent, 1.0));
      }
      const x = 42 * CW;
      const maxWidth = W - x - 7 * CW;
      const name = need(fit(input.name, { font: "semi750", size: 6 * CW, maxWidth, maxLines: nameLines }), nameErr);
      const line = input.line ? need(fit(input.line, { font: "regular", size: 3.6 * CW, maxWidth, maxLines: 2 }), lineErr) : null;
      const contact = contactLines(input, maxWidth, 3.3 * CW);
      const idH = height(name, 1.05) + (line ? 2 * CW + height(line, LH) : 0);
      const cH = stackHeight(contact, 0.8 * CW);
      const total = idH + (contact.length ? 5 * CW + cH : 0);
      if (total > H - 2 * P) throw tooMuch();
      let y = (H - total) / 2;
      els.push(textEl(x, y, maxWidth, name, pal.ink, 1.05));
      y += height(name, 1.05);
      if (line) {
        y += 2 * CW;
        els.push(textEl(x, y, maxWidth, line, pal.accent));
        y += height(line, LH);
      }
      els.push(...stack(x, y + 5 * CW, maxWidth, contact, 0.8 * CW, pal.muted));
      break;
    }

    case "paper": {
      const maxWidth = W - 2 * P;
      const cx = W / 2;
      const name = need(fit(input.name, { font: "semi700", size: 6.4 * CW, maxWidth, maxLines: nameLines }), nameErr);
      const line = input.line ? need(fit(input.line, { font: "regular", size: 3.6 * CW, maxWidth, maxLines: 2 }), lineErr) : null;
      const contact = contactLines(input, maxWidth, 3.3 * CW);
      const lineBlock = line ? 2 * CW + 2.4 * CW + height(line, LH) : 0;
      const cH = contact.reduce((h, t) => h + height(t, LH), 0) + Math.max(0, contact.length - 1) * 0.8 * CW;
      const total = height(name, 1.05) + lineBlock + (contact.length ? 5 * CW + cH : 0);
      if (total > H - 2 * P) throw tooMuch();
      let y = (H - total) / 2;
      els.push(...centered(cx, y, name, pal.ink, 1.05));
      y += height(name, 1.05);
      if (line) {
        y += 2 * CW;
        els.push({ kind: "rect", x: cx - 5 * CW, y, w: 10 * CW, h: 0.35 * CW, color: pal.accent });
        y += 2.4 * CW;
        els.push(...centered(cx, y, line, pal.accent));
        y += height(line, LH);
      }
      y += 5 * CW;
      for (const t of contact) {
        els.push(...centered(cx, y, t, pal.muted));
        y += height(t, LH) + 0.8 * CW;
      }
      break;
    }
  }
  return { bg: pal.bg, els };
}

export function backFace(input: CardInput): Face {
  const pal = input.design === "paper" ? getPalette("paper") : input.palette;
  const split = input.design === "split";
  const tile = 34 * CW; // 1.19 in, above the 1.0 in minimum for reliable scanning
  const domain = need(
    fit(input.domain.toUpperCase(), { font: "regular", size: 3.2 * CW, maxWidth: W - 2 * P, tracking: 0.24 }),
    "The site address is too long for the card.",
  );
  const gap = 3.2 * CW;
  const total = tile + gap + domain.size * LH;
  const y = (H - total) / 2;
  return {
    bg: split ? pal.accent : pal.bg,
    els: [
      { kind: "rect", x: (W - tile) / 2, y, w: tile, h: tile, color: "#FFFFFF", radius: 1.2 * CW },
      { kind: "qr", x: (W - tile) / 2, y, size: tile, matrix: input.qr },
      ...centered(W / 2, y + tile + gap, domain, split ? pal.onAccent : pal.accent),
    ],
  };
}
