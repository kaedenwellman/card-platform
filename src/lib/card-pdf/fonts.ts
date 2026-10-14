import "server-only";
import path from "node:path";
import { Font } from "@react-pdf/renderer";
import * as fontkit from "fontkit";

// Static Archivo instances cut from the site's variable font (src/fonts/archivo-latin-wdth-normal.woff2)
// with fontTools, one file per weight/width the card designs use. react-pdf can't pick axes of a
// variable font, so each style is its own family.
const FILES = {
  regular: "archivo-regular.ttf", // 400, normal width
  wide600: "archivo-wide-600.ttf", // 600, 125% width (classic name)
  wide850: "archivo-wide-850.ttf", // 850, 125% width (bold name, initials)
  semi750: "archivo-semi-750.ttf", // 750, 112% width (split and photo names)
  semi700: "archivo-semi-700.ttf", // 700, 112% width (paper name)
} as const;

export type FontId = keyof typeof FILES;

const dir = path.join(process.cwd(), "src/fonts/pdf");
const family = (id: FontId) => `Archivo-${id}`;

let registered = false;
const metrics = new Map<FontId, fontkit.Font>();

export function registerFonts() {
  if (registered) return;
  for (const id of Object.keys(FILES) as FontId[]) {
    Font.register({ family: family(id), src: path.join(dir, FILES[id]) });
  }
  // Names and emails must never be split mid-word with a hyphen.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

export const fontFamily = family;

// Width in points of one line of text, the way react-pdf lays it out: letter spacing is added
// after every character.
export function textWidth(font: FontId, text: string, size: number, tracking = 0) {
  let f = metrics.get(font);
  if (!f) {
    f = fontkit.openSync(path.join(dir, FILES[font]));
    metrics.set(font, f);
  }
  return (f.layout(text).advanceWidth / f.unitsPerEm) * size + tracking * size * [...text].length;
}
