"use client";

import { useState, useTransition } from "react";
import { WebsiteDesignPicker, type WebsiteDesign } from "@/components/design/WebsiteDesignPicker";
import { saveWebsiteDesign } from "@/lib/actions";

export function DesignEditor({ initial }: { initial: WebsiteDesign }) {
  const [design, setDesign] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dirty = design.templateId !== saved.templateId || design.paletteId !== saved.paletteId;

  const save = () =>
    startSaving(async () => {
      setError(null);
      try {
        await saveWebsiteDesign(design);
        setSaved(design);
      } catch {
        setError("Couldn't save. Try again.");
      }
    });

  return (
    <div className="flex flex-col gap-4">
      <WebsiteDesignPicker value={design} onChange={setDesign} ownPreview />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="rounded-md bg-gold px-6 py-3 font-bold text-black [font-stretch:110%] hover:bg-ink disabled:opacity-50"
        >
          {saving ? "Saving…" : dirty ? "Save design" : "Saved"}
        </button>
        {error && <span className="text-sm text-red-300">{error}</span>}
      </div>
    </div>
  );
}
