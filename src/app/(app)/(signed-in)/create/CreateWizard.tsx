"use client";

import { useState } from "react";
import type { CardFace } from "@/components/card/BusinessCard";
import { CardDesignPicker } from "@/components/design/CardDesignPicker";
import { WebsiteDesignPicker, type WebsiteDesign } from "@/components/design/WebsiteDesignPicker";
import { DEFAULT_THEME, type CardTemplateId } from "@/lib/design";
import { UploadForm } from "../start/UploadForm";

const STEPS = ["Website design", "Business card", "Your resume"] as const;

export function CreateWizard({
  clerkId,
  sampleCard,
  limitReached,
  limit,
}: {
  clerkId: string;
  sampleCard: CardFace;
  limitReached: boolean;
  limit: number;
}) {
  const [step, setStep] = useState(0);
  const [site, setSite] = useState<WebsiteDesign>({ templateId: DEFAULT_THEME.templateId, paletteId: DEFAULT_THEME.paletteId });
  const [card, setCard] = useState<CardTemplateId>(DEFAULT_THEME.cardTemplateId);

  const next = () => {
    setStep((s) => s + 1);
    window.scrollTo({ top: 0 });
  };

  return (
    <section className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-extrabold [font-stretch:112%]">Create your website and card</h1>
        <ol className="mt-5 flex flex-wrap gap-2 text-sm">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => setStep(i)}
                className={`rounded-full border px-3 py-1.5 ${
                  i === step ? "border-gold text-ink" : i < step ? "border-line text-ink hover:border-gold" : "border-line text-muted"
                }`}
              >
                {i + 1}. {label}
              </button>
            </li>
          ))}
        </ol>
      </header>

      {step === 0 && (
        <>
          <p className="text-muted">Pick a layout and colors. You can change both later.</p>
          <WebsiteDesignPicker value={site} onChange={setSite} />
        </>
      )}
      {step === 1 && (
        <>
          <p className="text-muted">
            Pick a card design. The back has a QR code that opens your site. You print these yourself at FedEx Office,
            a UPS Store, or at home.
          </p>
          <CardDesignPicker value={card} onChange={setCard} paletteId={site.paletteId} card={sampleCard} />
        </>
      )}
      {step === 2 &&
        (limitReached ? (
          <p className="rounded-md border border-line p-4">
            You&apos;ve uploaded {limit} resumes in the last day. Try again tomorrow.
          </p>
        ) : (
          <div className="max-w-xl">
            <p className="text-muted">
              We&apos;ll turn your resume into your site: one slide per job, project, and activity, in your resume&apos;s
              order and wording. You review everything before anything goes live.
            </p>
            <UploadForm
              clerkId={clerkId}
              replacing={false}
              theme={{ ...site, cardTemplateId: card }}
              submitLabel="Build my website and card"
            />
          </div>
        ))}

      {step < 2 && (
        <div className="flex gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="rounded-md border border-line px-6 py-3 hover:border-gold">
              Back
            </button>
          )}
          <button
            type="button"
            onClick={next}
            className="rounded-md bg-gold px-8 py-3 font-bold text-black [font-stretch:110%] hover:bg-ink"
          >
            Next: {STEPS[step + 1]}
          </button>
        </div>
      )}
    </section>
  );
}
