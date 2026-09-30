"use client";

import { useState } from "react";
import type { CardFace } from "@/components/card/BusinessCard";
import { CardDesignPicker } from "@/components/design/CardDesignPicker";
import { WebsiteDesignPicker, type WebsiteDesign } from "@/components/design/WebsiteDesignPicker";
import { DEFAULT_THEME, type CardTemplateId } from "@/lib/design";
import { UploadForm } from "../start/UploadForm";
import { InterviewForm } from "./InterviewForm";

const STEPS = ["Choose a website design", "Choose a business card", "Upload your resume"] as const;

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
  const [interview, setInterview] = useState(false); // "Don't have a resume?" path on step 3

  const next = () => {
    setStep((s) => s + 1);
    window.scrollTo({ top: 0 });
  };

  return (
    <section className="flex flex-col gap-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          Step {step + 1} of {STEPS.length}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold [font-stretch:112%]">
          {step === 2 && interview ? "Build your resume" : STEPS[step]}
        </h1>
      </header>

      {step === 0 && (
        <>
          <p className="-mt-4 text-sm text-muted">You can change this later.</p>
          <WebsiteDesignPicker value={site} onChange={setSite} />
        </>
      )}
      {step === 1 && (
        <>
          <p className="-mt-4 text-sm text-muted">The QR code on the back opens your site.</p>
          <CardDesignPicker value={card} onChange={setCard} paletteId={site.paletteId} card={sampleCard} />
        </>
      )}
      {step === 2 &&
        (limitReached ? (
          <p className="rounded-md border border-line p-4">
            You&apos;ve uploaded {limit} resumes in the last day. Try again tomorrow.
          </p>
        ) : interview ? (
          <InterviewForm
            clerkId={clerkId}
            defaults={{ name: sampleCard.name === "Your Name" ? "" : sampleCard.name, email: sampleCard.email ?? "" }}
            theme={{ ...site, cardTemplateId: card }}
            onCancel={() => setInterview(false)}
          />
        ) : (
          <div className="max-w-xl">
            <p className="-mt-4 text-sm text-muted">
              We build your site from what&apos;s on your resume. Nothing goes live until you check it.
            </p>
            <UploadForm
              clerkId={clerkId}
              replacing={false}
              theme={{ ...site, cardTemplateId: card }}
              submitLabel="Build my website and card"
            />
            <div className="mt-10 border-t border-line pt-6">
              <p className="font-bold">Don&apos;t have a resume?</p>
              <button
                type="button"
                onClick={() => {
                  setInterview(true);
                  window.scrollTo({ top: 0 });
                }}
                className="mt-1 text-left text-gold underline underline-offset-4 hover:text-ink"
              >
                Have our AI assistant help you build one →
              </button>
              <p className="mt-1 text-sm text-muted">Answer a few questions, typed or out loud.</p>
            </div>
          </div>
        ))}

      {step < 2 && (
        <div className="flex gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="rounded-sm border border-line px-6 py-3 hover:border-muted">
              Back
            </button>
          )}
          <button
            type="button"
            onClick={next}
            className="rounded-sm bg-gold px-8 py-3 font-bold text-black [font-stretch:110%] hover:bg-ink"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
