import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { cardTemplateIds, paletteIds, templateIds } from "@/lib/design";
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
import { aiDraft, readPrivateBlob, takePhoto } from "@/lib/resume/draft";

// Text extraction + a Claude call with one retry can take a minute or two.
export const maxDuration = 300;

const Body = z.object({
  resumePathname: z.string().min(1).max(300),
  photoPathname: z.string().min(1).max(300).nullable().default(null),
  // Design chosen in the create flow; omitted on a re-upload, which keeps the current design.
  theme: z
    .object({ templateId: z.enum(templateIds), paletteId: z.enum(paletteIds), cardTemplateId: z.enum(cardTemplateIds) })
    .optional(),
});

const fail = (status: number, error: string) => Response.json({ ok: false, error }, { status });

export async function POST(request: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return fail(401, "Sign in first.");
  if (!hasDatabase()) return fail(503, "The database isn't configured.");

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid request.");
  const { resumePathname, photoPathname, theme } = parsed.data;
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
  const bytes = await readPrivateBlob(resumePathname);
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
  if (photoPathname) {
    const photo = await takePhoto(photoPathname, clerkId, "headshot");
    if (photo.url && draft) draft.slides[0] = { ...draft.slides[0], media: { type: "image", url: photo.url, fit: "contain" } };
    photoError = photo.error;
  }

  // 4. Save as a draft (not public yet).
  try {
    const saved = await saveDraft({
      userId: user.id,
      fallbackName: [user.firstName].filter(Boolean).join(" "),
      fallbackEmail: user.email,
      draft,
      resumeText: text,
      resumeBlobUrl: resumePathname,
      theme,
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
