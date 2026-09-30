"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MAX_PHOTO_BYTES, MAX_RESUME_BYTES } from "@/lib/limits";

type Stage = "idle" | "uploading" | "reading" | "error";

const RESUME_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

// Safe file name for the blob path; the real name never matters.
const ext = (f: File) => (f.name.toLowerCase().match(/\.(pdf|docx|jpe?g|png|webp)$/)?.[1] ?? "bin").replace("jpeg", "jpg");

export function UploadForm({ clerkId, replacing }: { clerkId: string; replacing: boolean }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const resume = form.get("resume") as File | null;
    const photo = form.get("photo") as File | null;
    setError(null);

    if (!resume || resume.size === 0) return setError("Choose your resume file.");
    const kind = ext(resume);
    if (kind !== "pdf" && kind !== "docx") return setError("Upload a PDF or Word (.docx) file.");
    if (resume.size > MAX_RESUME_BYTES) return setError("Resumes can be at most 5 MB.");
    const hasPhoto = photo && photo.size > 0;
    if (hasPhoto && photo.size > MAX_PHOTO_BYTES) return setError("Photos can be at most 8 MB.");

    try {
      setStage("uploading");
      const resumeBlob = await upload(`resumes/${clerkId}/resume.${kind}`, resume, {
        access: "private",
        handleUploadUrl: "/api/upload",
        contentType: RESUME_TYPES[kind],
      });
      const photoBlob = hasPhoto
        ? await upload(`uploads/${clerkId}/photo.${ext(photo)}`, photo, {
            access: "public",
            handleUploadUrl: "/api/upload",
          })
        : null;

      setStage("reading");
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resumePathname: resumeBlob.pathname, photoPathname: photoBlob?.pathname ?? null }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; photoError?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Something went wrong. Try again.");
      const note = data.photoError ? `?photo=${encodeURIComponent(data.photoError)}` : "";
      router.push(`/edit${note}`);
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
    }
  }

  const busy = stage === "uploading" || stage === "reading";

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="font-bold">Resume</span>
        <span className="text-sm text-muted">PDF or Word (.docx), up to 5 MB.</span>
        <input
          name="resume"
          type="file"
          required
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={busy}
          className="rounded-md border border-line p-3 file:mr-3 file:rounded file:border-0 file:bg-ink file:px-3 file:py-1 file:text-black"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="font-bold">
          Photo of you <span className="font-normal text-muted">(optional)</span>
        </span>
        <span className="text-sm text-muted">JPG, PNG, or WebP, at least 600px wide. Goes on your first slide.</span>
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          className="rounded-md border border-line p-3 file:mr-3 file:rounded file:border-0 file:bg-ink file:px-3 file:py-1 file:text-black"
        />
      </label>

      {replacing && (
        <p className="text-sm text-muted">This replaces your current draft with a new one from this resume.</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-gold px-6 py-4 font-bold text-black [font-stretch:110%] hover:bg-ink disabled:opacity-60"
      >
        {stage === "uploading" ? "Uploading…" : stage === "reading" ? "Reading your resume…" : "Build my draft"}
      </button>

      <p aria-live="polite" className="min-h-6 text-sm">
        {stage === "reading" && <span className="text-muted">This usually takes 30 to 60 seconds. Keep this page open.</span>}
        {error && <span className="text-red-300">{error}</span>}
      </p>
    </form>
  );
}
