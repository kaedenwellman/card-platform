"use client";

import { uploadPresigned } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VoiceTextarea } from "@/components/VoiceTextarea";
import { MAX_PHOTO_BYTES } from "@/lib/limits";
import { INTERVIEW_QUESTIONS, type InterviewAnswers } from "@/lib/resume/questions";

const STORAGE_KEY = "resume-interview-v1";
const empty = (): InterviewAnswers =>
  ({ name: "", email: "", phone: "", ...Object.fromEntries(INTERVIEW_QUESTIONS.map((q) => [q.id, ""])) }) as InterviewAnswers;

const input = "w-full rounded-sm border border-line bg-transparent p-3 text-base outline-none focus:border-muted";

// "Don't have a resume?" One question per screen; answers can be typed or spoken.
export function InterviewForm({
  clerkId,
  defaults,
  theme,
  onCancel,
}: {
  clerkId: string;
  defaults: { name: string; email: string };
  theme: { templateId: string; paletteId: string; cardTemplateId: string };
  onCancel: () => void;
}) {
  const router = useRouter();
  // Restores answers saved in this browser (the form only renders after a click, never on the server).
  const [a, setA] = useState<InterviewAnswers>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...empty(), ...defaults, ...JSON.parse(saved) };
    } catch {}
    return { ...empty(), ...defaults };
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [step, setStep] = useState(0); // 0 = basics, 1..n = questions
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = INTERVIEW_QUESTIONS.length;

  // Keep answers if the page is refreshed (this browser only; cleared after a successful build).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
    } catch {}
  }, [a]);

  const set = (k: keyof InterviewAnswers) => (v: string) => setA((cur) => ({ ...cur, [k]: v }));
  const go = (n: number) => {
    setError(null);
    setStep(n);
    window.scrollTo({ top: 0 });
  };

  async function build() {
    setError(null);
    if (!a.name.trim()) return go(0);
    if (photo && photo.size > MAX_PHOTO_BYTES) return setError("Photos can be at most 8 MB.");
    setBusy(true);
    try {
      const ext = photo?.name.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[1]?.replace("jpeg", "jpg") ?? "jpg";
      const photoBlob = photo
        ? await uploadPresigned(`uploads/${clerkId}/${crypto.randomUUID()}.${ext}`, photo, {
            access: "private",
            handleUploadUrl: "/api/upload",
          })
        : null;
      const res = await fetch("/api/resume/interview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers: a, photoPathname: photoBlob?.pathname ?? null, theme }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; photoError?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Something went wrong. Try again.");
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      router.push(`/edit${data.photoError ? `?photo=${encodeURIComponent(data.photoError)}` : ""}`);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  const q = step > 0 ? INTERVIEW_QUESTIONS[step - 1] : null;
  const last = step === total;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        {step === 0 ? "The basics" : `Question ${step} of ${total}`}
      </p>

      {step === 0 ? (
        <div className="flex flex-col gap-5">
          <h2 className="text-2xl font-extrabold [font-stretch:112%]">Let&apos;s build your resume together.</h2>
          <p className="-mt-2 text-sm text-muted">
            A few questions about school, work, and what you&apos;re into. Answer as much or as little as you want, typed
            or out loud. We turn your answers into your site, using only what you tell us.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm">Full name</span>
            <input className={input} value={a.name} onChange={(e) => set("name")(e.target.value)} autoComplete="name" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm">Email for your card</span>
            <input className={input} type="email" value={a.email} onChange={(e) => set("email")(e.target.value)} autoComplete="email" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm">
              Phone <span className="text-muted">(optional)</span>
            </span>
            <input className={input} type="tel" value={a.phone} onChange={(e) => set("phone")(e.target.value)} autoComplete="tel" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm">
              Photo of you <span className="text-muted">(optional, at least 600px wide)</span>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="rounded-sm border border-line p-3 file:mr-3 file:rounded-sm file:border-0 file:bg-ink file:px-3 file:py-1 file:text-black"
            />
          </label>
        </div>
      ) : (
        q && (
          <div className="flex flex-col gap-3">
            <label htmlFor={`q-${q.id}`} className="text-2xl font-extrabold [font-stretch:112%]">
              {q.question}
            </label>
            <p className="-mt-1 text-sm text-muted">{q.hint}</p>
            <VoiceTextarea key={q.id} id={`q-${q.id}`} value={a[q.id]} onChange={set(q.id)} />
          </div>
        )
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => (step === 0 ? onCancel() : go(step - 1))}
          className="rounded-sm border border-line px-6 py-3 hover:border-muted disabled:opacity-50"
        >
          Back
        </button>
        {last ? (
          <button
            type="button"
            onClick={build}
            disabled={busy}
            className="rounded-sm bg-gold px-8 py-3 font-bold text-black [font-stretch:110%] hover:bg-ink disabled:opacity-60"
          >
            {busy ? "Building your site…" : "Build my website and card"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => (step === 0 && !a.name.trim() ? setError("Add your name to continue.") : go(step + 1))}
            className="rounded-sm bg-gold px-8 py-3 font-bold text-black [font-stretch:110%] hover:bg-ink"
          >
            {step > 0 && !a[q!.id].trim() ? "Skip" : "Next →"}
          </button>
        )}
      </div>
      {busy && <p className="text-sm text-muted">This usually takes 30 to 60 seconds. Keep this page open.</p>}
    </div>
  );
}
