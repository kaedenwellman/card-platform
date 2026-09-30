// Website layouts, color palettes, and business card designs a customer can pick from.
// Stored on profiles.theme as { templateId, paletteId, cardTemplateId }.

export type TemplateId = "carousel" | "profile" | "timeline" | "gallery";
export type PaletteId = "gold" | "charcoal" | "ocean" | "forest" | "crimson" | "paper";
export type CardTemplateId = "classic" | "bold" | "split" | "photo" | "paper";

export const TEMPLATES: { id: TemplateId; name: string; description: string }[] = [
  { id: "carousel", name: "Carousel", description: "One entry at a time, swipe through." },
  { id: "profile", name: "Profile", description: "Photo and stats up top, one long page." },
  { id: "timeline", name: "Timeline", description: "Entries in order down a line." },
  { id: "gallery", name: "Gallery", description: "A grid of cards with photos." },
];

// Every template reads these CSS variables, so any palette works with any layout.
export type Palette = {
  id: PaletteId;
  name: string;
  bg: string; // page background
  surface: string; // cards, dialogs
  ink: string; // main text
  ink2: string; // body text
  ink3?: string; // quieter body text (defaults to ink2)
  muted: string; // labels, secondary text
  line: string; // borders
  accent: string; // the one accent color
  onAccent: string; // text on accent buttons
  light?: boolean;
};

export const PALETTES: Palette[] = [
  { id: "gold", name: "Black & gold", bg: "#000000", surface: "#0e0e0e", ink: "#EDEBE6", ink2: "#CFCCC6", ink3: "#BDBAB4", muted: "#8C8A85", line: "#262626", accent: "#CFB87C", onAccent: "#000000" },
  { id: "charcoal", name: "Charcoal & brass", bg: "#0F1317", surface: "#161B21", ink: "#ECEAE4", ink2: "#C9CBCD", muted: "#8A9097", line: "#242A31", accent: "#D6B465", onAccent: "#0F1317" },
  { id: "ocean", name: "Midnight blue", bg: "#07111C", surface: "#0D1A28", ink: "#E6EEF5", ink2: "#C3D0DC", muted: "#7F93A6", line: "#1B2A3A", accent: "#62B6FF", onAccent: "#07111C" },
  { id: "forest", name: "Forest", bg: "#0A120D", surface: "#111C15", ink: "#E7EFE9", ink2: "#C6D3CA", muted: "#869A8C", line: "#1E2C23", accent: "#7FD3A0", onAccent: "#0A120D" },
  { id: "crimson", name: "Crimson", bg: "#0E0A0B", surface: "#181113", ink: "#F0E9EA", ink2: "#D6C9CB", muted: "#9A8B8E", line: "#2B1F22", accent: "#EE6A7C", onAccent: "#0E0A0B" },
  { id: "paper", name: "Paper", bg: "#F4F1EA", surface: "#FFFFFF", ink: "#16150F", ink2: "#3A3833", muted: "#6E6A61", line: "#DDD7CB", accent: "#8A6417", onAccent: "#FFFFFF", light: true },
];

export const CARD_TEMPLATES: { id: CardTemplateId; name: string; description: string }[] = [
  { id: "classic", name: "Classic", description: "Spaced caps, contact at the bottom." },
  { id: "bold", name: "Bold", description: "Big name." },
  { id: "split", name: "Split", description: "Initials on a color panel." },
  { id: "photo", name: "Photo", description: "Round headshot." },
  { id: "paper", name: "Paper", description: "Light card stock look." },
];

export const DEFAULT_THEME = { templateId: "carousel", paletteId: "gold", cardTemplateId: "classic" } as const;

export const templateIds = TEMPLATES.map((t) => t.id) as [TemplateId, ...TemplateId[]];
export const paletteIds = PALETTES.map((p) => p.id) as [PaletteId, ...PaletteId[]];
export const cardTemplateIds = CARD_TEMPLATES.map((c) => c.id) as [CardTemplateId, ...CardTemplateId[]];

export function getPalette(id: string | undefined): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}
export function getTemplateId(id: string | undefined): TemplateId {
  return (templateIds as string[]).includes(id ?? "") ? (id as TemplateId) : "carousel";
}
export function getCardTemplateId(id: string | undefined): CardTemplateId {
  return (cardTemplateIds as string[]).includes(id ?? "") ? (id as CardTemplateId) : "classic";
}

// CSS variables for a palette; an explicit accent (legacy theme.accent) overrides the palette's.
export function paletteVars(p: Palette, accentOverride?: string): Record<string, string> {
  return {
    "--bg": p.bg,
    "--surface": p.surface,
    "--ink": p.ink,
    "--ink-2": p.ink2,
    "--ink-3": p.ink3 ?? p.ink2,
    "--muted": p.muted,
    "--line": p.line,
    "--gold": accentOverride ?? p.accent,
    "--on-accent": p.onAccent,
  };
}
