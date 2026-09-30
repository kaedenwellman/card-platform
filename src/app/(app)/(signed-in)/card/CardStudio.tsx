"use client";

import { useState, useTransition } from "react";
import type { CardFace } from "@/components/card/BusinessCard";
import { CardDesignPicker } from "@/components/design/CardDesignPicker";
import { saveCardDesign } from "@/lib/actions";
import type { CardTemplateId, PaletteId } from "@/lib/design";

// Card design picker that saves the choice as soon as it changes.
export function CardStudio({ initial, paletteId, card }: { initial: CardTemplateId; paletteId: PaletteId; card: CardFace }) {
  const [design, setDesign] = useState(initial);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const choose = (id: CardTemplateId) => {
    setDesign(id);
    setError(null);
    startSaving(async () => {
      try {
        await saveCardDesign({ cardTemplateId: id });
      } catch {
        setError("Couldn't save your choice. Try again.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <CardDesignPicker value={design} onChange={choose} paletteId={paletteId} card={card} />
      <p aria-live="polite" className="min-h-5 text-sm text-muted">
        {saving ? "Saving…" : error ? <span className="text-red-300">{error}</span> : null}
      </p>
    </div>
  );
}
