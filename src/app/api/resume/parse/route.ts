import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { del, get } from "@vercel/blob";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { PhotoError, processPhoto } from "@/lib/images";
import { MAX_RESUME_BYTES } from "@/lib/limits";
import {
  DAILY_PARSE_LIMIT,
  ProfileLockedError,
  ensureUser,
  getOwnedProfile,
  parsesInLastDay,
  recordParse,
  saveDraft,
} from "@/lib/owner";
import { detectResumeKind, extractResumeText } from "@/lib/resume/extract";
import { normalizeDraft, type Draft } from "@/lib/resume/normalize";
import { draftFromResumeText } from "@/lib/resume/parse-ai";

// Text extraction + a Claude call with one retry can take a minute or two.
export const maxDuration = 300;

const Body = z.object({
  resumePathname: z.string().min(1).max(300),
  photoPathname: z.string().min(1).max(300).nullable().default(null),
});

const fail = (status: number, error: string) => Response.json({ ok: false, error }, { status });

async function readBlob(pathname: string, access: "private" | "public") {
  const res = await get(pathname, { access });
  if (!res || res.statusCode !== 200) return null;
  return new Uint8Array(await new Response(res.stream).arrayBuffer());
}

async function aiDraft(text: string): Promise<{ draft: Draft | null; error?: string }> {
  let lastError = "The AI draft didn't come back in the expected shape.";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const ai = await draftFromResumeText(text);
      if (ai) return { draft: normalizeDraft(ai) };
    } catch (err) {
      // Don't burn the retry on problems a retry can't fix.
      if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
        console.error("Anthropic auth error", err.message);
        return { draft: null, error: "The AI service isn't configured correctly." };
      }
      if (err instanceof Anthropic.APIError) lastError = `AI service error (${err.status ?? "network"}).`;
      console.error(`Resume parse attempt ${attempt} failed`, err);
    }
  }
  return { draft: null, error: lastError };
}

export async function POST(request: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return fail(401, "Sign in first.");
  if (!hasDatabase()) return fail(503, "The database isn't configured.");

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid request.");
  const { resumePathname, photoPathname } = parsed.data;
  // Uploads are only ever issued under the user's own folders (see /api/upload).
  if (!resumePathname.startsWith(`resumes/${clerkId}/`)) return fail(403, "That file isn't yours.");
  if (photoPathname && !photoPathname.startsWith(`uploads/${clerkId}/`)) return fail(403, "That photo isn't yours.");

  const user = await ensureUser();
  if (!user) return fail(401, "Sign in first.");
  const existing = await getOwnedProfile(user.id);
  if (existing && existing.status !== "draft") {
    return fail(409, "Your site is already published. Editing a live site comes in the editor.");
  }
  if ((await parsesInLastDay(user.id)) >= DAILY_PARSE_LIMIT) {
    return fail(429, `You can upload up to ${DAILY_PARSE_LIMIT} resumes a day. Try again tomorrow.`);
  }

  // 1. Read the resume (private blob) and pull out its text.
  const bytes = await readBlob(resumePathname, "private");
  if (!bytes) return fail(400, "We couldn't find that upload. Try again.");
  if (bytes.byteLength > MAX_RESUME_BYTES) return fail(400, "Resumes can be at most 5 MB.");
  const kind = detectResumeKind(bytes);
  if (!kind) return fail(400, "Upload a PDF or Word (.docx) file.");

  let text: string;
  try {
    text = await extractResumeText(bytes, kind);
  } catch (err) {
    console.error("Text extraction failed", err);
    await recordParse(user.id, false, "extract failed");
    return fail(422, "We couldn't read that file. If it's a scan or a photo, export your resume as a PDF from Word or Google Docs.");
  }
  if (text.length < 200) {
    await recordParse(user.id, false, "too little text");
    return fail(422, "We couldn't find text in that file. If it's a scan or a photo, export your resume as a PDF from Word or Google Docs.");
  }

  // 2. Claude drafts the profile and slides; retried once, then we fall back to raw text.
  const { draft, error } = await aiDraft(text);

  // 3. Optional photo: goes on the first slide, shown whole ("contain").
  let photoError: string | undefined;
  if (photoPathname && draft) {
    try {
      const photo = await readBlob(photoPathname, "public");
      if (!photo) throw new PhotoError("We couldn't find that photo upload.");
      const url = await processPhoto(photo, `photos/${clerkId}/headshot`);
      draft.slides[0] = { ...draft.slides[0], media: { type: "image", url, fit: "contain" } };
    } catch (err) {
      photoError = err instanceof PhotoError ? err.message : "We couldn't process that photo.";
      if (!(err instanceof PhotoError)) console.error("Photo processing failed", err);
    }
  }
  if (photoPathname) await del(photoPathname).catch(() => {}); // the original; we keep the WebP

  // 4. Save as a draft (not public yet).
  try {
    const saved = await saveDraft({
      userId: user.id,
      fallbackName: [user.firstName].filter(Boolean).join(" "),
      fallbackEmail: user.email,
      draft,
      resumeText: text,
      resumeBlobUrl: resumePathname,
    });
    await recordParse(user.id, Boolean(draft), error);
    return Response.json({ ok: true, drafted: Boolean(draft), slug: saved.slug, error, photoError });
  } catch (err) {
    if (err instanceof ProfileLockedError) {
      return fail(409, "Your site is already published. Editing a live site comes in the editor.");
    }
    console.error("Saving draft failed", err);
    return fail(500, "Something went wrong saving your draft. Try again.");
  }
}
