"use client";

import { useState } from "react";
import { PALETTES, TEMPLATES, type PaletteId, type TemplateId } from "@/lib/design";
import { ScaledFrame } from "./ScaledFrame";

export type WebsiteDesign = { templateId: TemplateId; paletteId: PaletteId };

const src = (d: WebsiteDesign) => `/examples/${d.templateId}?palette=${d.paletteId}`;

// Layout cards + palette swatches + a large live preview (phone or desktop).
export function WebsiteDesignPicker({
  value,
  onChange,
  ownPreview = false,
}: {
  value: WebsiteDesign;
  onChange: (d: WebsiteDesign) => void;
  ownPreview?: boolean; // big preview shows the signed-in user's own site instead of the example
}) {
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const big = ownPreview ? `/preview?embed=1&template=${value.templateId}&palette=${value.paletteId}` : src(value);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-8">
        <fieldset>
          <legend className="mb-3 font-bold">Layout</legend>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((t) => {
              const on = t.id === value.templateId;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange({ ...value, templateId: t.id })}
                  className={`overflow-hidden rounded-lg border text-left transition-colors ${
                    on ? "border-gold ring-2 ring-gold/40" : "border-line hover:border-muted"
                  }`}
                >
                  <ScaledFrame src={src({ ...value, templateId: t.id })} width={1280} height={800} title={`${t.name} layout`} />
                  <div className="p-3">
                    <p className="font-bold">{t.name}</p>
                    <p className="mt-1 text-sm text-muted">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 font-bold">Colors</legend>
          <div className="flex flex-wrap gap-3">
            {PALETTES.map((p) => {
              const on = p.id === value.paletteId;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange({ ...value, paletteId: p.id })}
                  className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-sm ${
                    on ? "border-gold ring-2 ring-gold/40" : "border-line hover:border-muted"
                  }`}
                >
                  <span className="relative block h-7 w-7 overflow-hidden rounded-full border border-white/15" style={{ background: p.bg }}>
                    <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-tl-full" style={{ background: p.accent }} />
                  </span>
                  {p.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold">Preview</p>
          <div className="flex rounded-full border border-line p-0.5 text-sm">
            {(["phone", "desktop"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                className={`rounded-full px-3 py-1 capitalize ${device === d ? "bg-ink text-black" : "text-muted"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-line">
          {device === "phone" ? (
            <ScaledFrame key={`p-${big}`} src={big} width={390} height={760} title="Phone preview" />
          ) : (
            <ScaledFrame key={`d-${big}`} src={big} width={1280} height={800} title="Desktop preview" />
          )}
        </div>
        <p className="mt-2 text-xs text-muted">
          {ownPreview ? "Your site with this design. Save to apply it." : "Shown with example content. Yours comes from your resume."}
        </p>
      </div>
    </div>
  );
}
