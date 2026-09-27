import { httpsUrl } from "./validation";

// Render-time guard, on top of validation at write time: anything that isn't https:// (or one of
// our own relative paths) is dropped rather than rendered.
export function safeHref(href: string | null | undefined): string | null {
  if (!href) return null;
  return httpsUrl.safeParse(href).success ? href : null;
}

export function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

// CSS values we interpolate into style attributes.
export function safeColor(c: string | undefined, fallback: string) {
  return c && /^#[0-9a-fA-F]{6}$/.test(c) ? c : fallback;
}

export function safePosition(p: string | undefined) {
  return p && /^[a-z0-9%.\s-]{1,40}$/i.test(p) ? p : "center";
}

// "**bold** rest" → segments. The only formatting user text supports; never raw HTML.
export function boldSegments(text: string): { text: string; bold: boolean }[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    );
}
