import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { del, get } from "@vercel/blob";
import { PhotoError, processPhoto } from "../images";
import { normalizeDraft, type Draft } from "./normalize";
import { draftFromResumeText } from "./parse-ai";

// Shared by the resume upload (/api/resume/parse) and the resume interview (/api/resume/interview).

export async function readPrivateBlob(pathname: string) {
  const res = await get(pathname, { access: "private" });
  if (!res || res.statusCode !== 200) return null;
  return new Uint8Array(await new Response(res.stream).arrayBuffer());
}

// Claude drafts the profile and slides; one retry, then null (the caller falls back to raw text).
export async function aiDraft(text: string, source: "resume" | "interview" = "resume"): Promise<{ draft: Draft | null; error?: string }> {
  let lastError = "The AI draft didn't come back in the expected shape.";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const ai = await draftFromResumeText(text, source);
      if (ai) return { draft: normalizeDraft(ai) };
    } catch (err) {
      // Don't burn the retry on problems a retry can't fix.
      if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
        console.error("Anthropic auth error", err.message);
        return { draft: null, error: "The AI service isn't configured correctly." };
      }
      if (err instanceof Anthropic.APIError) lastError = `AI service error (${err.status ?? "network"}).`;
      console.error(`Draft attempt ${attempt} failed`, err);
    }
  }
  return { draft: null, error: lastError };
}

// Re-encodes an uploaded photo and returns its /media URL; always deletes the original upload.
// Returns { error } with a user-facing message instead of throwing.
export async function takePhoto(uploadPathname: string, clerkId: string, name: string): Promise<{ url?: string; error?: string }> {
  try {
    const bytes = await readPrivateBlob(uploadPathname);
    if (!bytes) return { error: "We couldn't find that photo upload." };
    return { url: await processPhoto(bytes, `photos/${clerkId}/${name}`) };
  } catch (err) {
    if (!(err instanceof PhotoError)) console.error("Photo processing failed", err);
    return { error: err instanceof PhotoError ? err.message : "We couldn't process that photo." };
  } finally {
    await del(uploadPathname).catch(() => {});
  }
}
