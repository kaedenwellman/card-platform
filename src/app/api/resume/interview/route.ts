import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { cardTemplateIds, paletteIds, templateIds } from "@/lib/design";
import { DAILY_PARSE_LIMIT, ProfileLockedError, ensureUser, getOwnedProfile, parsesInLastDay, recordParse, saveDraft } from "@/lib/owner";
import { aiDraft, takePhoto } from "@/lib/resume/draft";
import { INTERVIEW_QUESTIONS, interviewTranscript } from "@/lib/resume/questions";

// "Don't have a resume?" Builds the draft from interview answers instead of a file.
export const maxDuration = 300;

const answer = z.string().trim().max(4000).default("");
const Body = z.object({
  answers: z.object({
    name: z.string().trim().min(1, "Add your name.").max(80),
    email: z.string().trim().max(200).default(""),
    phone: z.string().trim().max(30).default(""),
    ...Object.fromEntries(INTERVIEW_QUESTIONS.map((q) => [q.id, answer])),
  }),
  photoPathname: z.string().min(1).max(300).nullable().default(null),
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
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Invalid request.");
  const { answers, photoPathname, theme } = parsed.data;
  if (photoPathname && !photoPathname.startsWith(`uploads/${clerkId}/`)) return fail(403, "That photo isn't yours.");

  const text = interviewTranscript(answers as Parameters<typeof interviewTranscript>[0]);
  const answered = INTERVIEW_QUESTIONS.filter((q) => (answers as Record<string, string>)[q.id]?.length > 0).length;
  if (answered < 2) return fail(400, "Answer at least two questions so there's something to build from.");

  const user = await ensureUser();
  if (!user) return fail(401, "Sign in first.");
  const existing = await getOwnedProfile(user.id);
  if (existing && existing.status !== "draft") return fail(409, "Your site is already published.");
  if ((await parsesInLastDay(user.id)) >= DAILY_PARSE_LIMIT) {
    return fail(429, `You can build up to ${DAILY_PARSE_LIMIT} drafts a day. Try again tomorrow.`);
  }

  const { draft, error } = await aiDraft(text, "interview");

  let photoError: string | undefined;
  if (photoPathname) {
    const photo = await takePhoto(photoPathname, clerkId, "headshot");
    if (photo.url && draft) draft.slides[0] = { ...draft.slides[0], media: { type: "image", url: photo.url, fit: "contain" } };
    photoError = photo.error;
  }

  try {
    const saved = await saveDraft({
      userId: user.id,
      fallbackName: answers.name,
      fallbackEmail: answers.email || user.email,
      draft,
      resumeText: text,
      resumeBlobUrl: null,
      theme,
    });
    await recordParse(user.id, Boolean(draft), error);
    return Response.json({ ok: true, drafted: Boolean(draft), slug: saved.slug, error, photoError });
  } catch (err) {
    if (err instanceof ProfileLockedError) return fail(409, "Your site is already published.");
    console.error("Saving interview draft failed", err);
    return fail(500, "Something went wrong saving your draft. Try again.");
  }
}
