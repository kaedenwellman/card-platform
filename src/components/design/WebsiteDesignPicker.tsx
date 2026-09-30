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
          <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Layout</legend>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((t) => {
              const on = t.id === value.templateId;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange({ ...value, templateId: t.id })}
                  className={`overflow-hidden border text-left ${on ? "border-gold" : "border-line hover:border-muted"}`}
                >
                  <ScaledFrame src={src({ ...value, templateId: t.id })} width={1280} height={800} title={`${t.name} layout`} />
                  <div className="px-3 py-2.5">
                    <p className={on ? "text-gold" : ""}>{t.name}</p>
                    <p className="text-sm text-muted">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Colors</legend>
          <div className="flex flex-wrap gap-2">
            {PALETTES.map((p) => {
              const on = p.id === value.paletteId;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange({ ...value, paletteId: p.id })}
                  className={`flex items-center gap-2 border py-1.5 pl-1.5 pr-3 text-sm ${
                    on ? "border-gold text-gold" : "border-line hover:border-muted"
                  }`}
                >
                  <span className="flex h-6 w-9 border border-white/15" style={{ background: p.bg }}>
                    <span className="m-auto block h-2 w-5" style={{ background: p.accent }} />
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
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Preview</p>
          <div className="flex gap-3 text-sm">
            {(["phone", "desktop"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                className={`capitalize ${device === d ? "text-ink underline underline-offset-4" : "text-muted hover:text-ink"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden border border-line">
          {device === "phone" ? (
            <ScaledFrame key={`p-${big}`} src={big} width={390} height={760} title="Phone preview" />
          ) : (
            <ScaledFrame key={`d-${big}`} src={big} width={1280} height={800} title="Desktop preview" />
          )}
        </div>
        <p className="mt-2 text-xs text-muted">
          {ownPreview ? "Your site with this design. Save to use it." : "Sample content. Yours comes from your resume."}
        </p>
      </div>
    </div>
  );
}
