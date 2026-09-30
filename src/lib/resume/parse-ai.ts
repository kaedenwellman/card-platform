import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

// Sonnet-class model for parsing, per the handoff (§4).
const MODEL = "claude-sonnet-5-5";

// Shape Claude must return. Kept simple (nullable, no length limits) for structured outputs;
// src/lib/resume/normalize.ts applies the app's real validation afterwards.
const DraftSchema = z.object({
  profile: z.object({
    name: z.string(),
    headline: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    links: z.object({
      github: z.string().nullable(),
      linkedin: z.string().nullable(),
      website: z.string().nullable(),
    }),
  }),
  slides: z.array(
    z.object({
      section: z.string(),
      title: z.string(),
      role: z.string(),
      body: z.string().nullable(),
      points: z.array(z.string()),
      link: z.object({ label: z.string(), href: z.string() }).nullable(),
    }),
  ),
  facts: z.array(z.object({ label: z.string(), value: z.string(), detail: z.string().nullable() })),
  future_items: z.array(z.object({ title: z.string(), body: z.string() })),
});

export type AiDraft = z.infer<typeof DraftSchema>;

const SYSTEM = `You turn a resume into the content of a one-page personal website: a profile plus an ordered list of slides shown one at a time in a carousel.

The resume is the only source of truth. Every fact on every slide must come from the resume text. Never add accomplishments, numbers, dates, skills, employers, links, or contact details that are not in it. When the resume is unclear, leave the detail out rather than guess. You may shorten wording to fit a slide, and you may reorder words, but keep the resume's meaning and its own phrasing where you can.

Profile:
- name: the person's name as written.
- headline: one short line for under the name, built only from the resume (for example "Electrical Engineering @ UCCS · D2 Track & Field"). Under 80 characters.
- email and phone: copied exactly, or null.
- links: GitHub, LinkedIn, and personal website URLs only if they appear in the resume; otherwise null.

Slides:
- Keep the resume's section order. Typical order: summary, education, projects, leadership/activities, work, skills, awards.
- section: a short tab label for the resume section, 1 to 3 words, e.g. "About", "Education", "Projects", "Teaching & leadership", "Work", "Skills", "Awards". Slides in the same resume section share the exact same label.
- One slide per resume entry (each job, project, school, or role). Skills get one slide total; awards and certifications get one slide total.
- A summary or objective becomes the first slide: section "About", title "Hi, I'm <first name>", body = the summary, points = [].
- title: the entry's main name (the project, the position, or the degree).
- role: position, organization, and dates joined with " · ", using only what the resume states.
- points: the entry's bullets, lightly shortened. At most 5, each under about 220 characters. Use body instead of points only for prose paragraphs.
- link: a URL from the resume that belongs to that entry, with a short label; otherwise null.

facts: up to 4 key facts for a stat grid at the top of the page, each a short label and value taken from the resume, most important first. Good labels: "Major", "School", "Academics", "Athletics", "Role", "Experience". The value is short (a few words, or a number like "4.0"); detail is an optional short line of context (e.g. value "4.0", detail "College GPA"). Only use facts the resume states; fewer than 4 is fine.

future_items: only if the resume has a section about planned or upcoming projects; otherwise an empty list.`;

let client: Anthropic | undefined;

// Returns the parsed draft, or null if Claude declined or the output didn't match the schema.
export async function draftFromResumeText(resumeText: string): Promise<AiDraft | null> {
  client ??= new Anthropic({ timeout: 120_000, maxRetries: 2 });

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: betaZodOutputFormat(DraftSchema) },
    // Server-side refusal fallback: if this model declines, the API retries on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Here is the resume text, extracted from the uploaded file:\n\n<resume>\n${resumeText}\n</resume>`,
      },
    ],
  });

  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return null;
  return response.parsed_output ?? null;
}
