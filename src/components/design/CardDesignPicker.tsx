"use client";

import { BusinessCard, type CardFace } from "@/components/card/BusinessCard";
import { CARD_TEMPLATES, getPalette, type CardTemplateId, type PaletteId } from "@/lib/design";

// Card design grid (fronts) plus the chosen design's front and back side by side.
export function CardDesignPicker({
  value,
  onChange,
  paletteId,
  card,
}: {
  value: CardTemplateId;
  onChange: (id: CardTemplateId) => void;
  paletteId: PaletteId;
  card: CardFace;
}) {
  const palette = getPalette(paletteId);
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 rounded-xl border border-line bg-[#111] p-4 sm:grid-cols-2 sm:p-6">
        <BusinessCard design={value} palette={palette} side="front" card={card} />
        <BusinessCard design={value} palette={palette} side="back" card={card} />
      </div>
      <fieldset>
        <legend className="mb-3 font-bold">Card design</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CARD_TEMPLATES.map((t) => {
            const on = t.id === value;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => onChange(t.id)}
                className={`flex flex-col gap-3 rounded-lg border p-3 text-left ${
                  on ? "border-gold ring-2 ring-gold/40" : "border-line hover:border-muted"
                }`}
              >
                <BusinessCard design={t.id} palette={palette} side="front" card={card} />
                <span>
                  <span className="block font-bold">{t.name}</span>
                  <span className="mt-1 block text-sm text-muted">{t.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
