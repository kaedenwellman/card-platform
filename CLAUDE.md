# Project handoff: Resume → Website + Business Card platform

> Working name: **BRAND** (placeholder: replace everywhere once Kaeden picks a name and domain).
> Owner: Kaeden Wellman. This file is the source of truth for what we're building. Read it fully before writing code, and update the "Status" section as milestones finish.

## 1. What we're building

A self-serve web app. A person uploads their resume, and within minutes they get:

1. **A hosted personal site**: a slideshow of their experience, like Kaeden's own site at meetkaeden.site.
2. **A print-ready business card PDF** with a QR code that points to that site. They print it themselves at FedEx Office, a UPS Store, or at home.

**Goal: zero manual work per customer.** Kaeden should never have to touch an order. Everything from upload to live site to PDF download is automatic.

**We do not print or ship anything.** No print APIs, no fulfillment. Shipped premium cards may be added much later as an upsell; don't build for it now.

### Target customers (v1)
College students applying for internships, recruited athletes, and early-career people who want "something better than a resume."

## 2. Reference implementation

`/reference/` contains Kaeden's own working versions. Match their look and behavior.

- `reference/portfolio/index.html` (+ `media/`): his live site, copied from the OnlineResume repo on 2026-09-27 (newer than the original handoff copy: adds `media.position`, `fit: "contain"`, underlined section tabs, and the desktop footer peek). The slide data shape (`section`, `title`, `role`, `body`, `points`, `link`, `media`, `tint`), the carousel (current slide large, neighbors dimmed and peeking), section tabs, the "View my full resume" and "Download PDF" links, the Future Projects popup, and the phone-first layout are the baseline template.
- `reference/resume.pdf`: Kaeden's resume. Use it as the test input for resume parsing (M2); the parsed result should closely match the slides in `reference/portfolio/index.html`.
- **Business card design** (Kaeden to add an export as `reference/card-front.png` and `reference/card-back.png`): 3.5 × 2 in trim with ⅛ in bleed (3.75 × 2.25 in), black background, Archivo font.
  - Front: name top left in small, widely spaced caps (weight 600, wide stretch); one line under it in gold `#CFB87C` ("Electrical Engineering, UCCS"); phone and email bottom left in gray `#A9A6A0`.
  - Back: QR code centered on a white tile (about 1.2 in), with the site domain in small spaced gold caps underneath. Nothing else.
- Design tokens from the site: background `#000000`, ink `#EDEBE6`, muted `#8C8A85`, lines `#262626`, accent gold `#CFB87C`, font Archivo (Google Fonts, variable `wdth` 62–125).

## 3. Core user flow

1. **Landing** (`/`): what it is, an example (Kaeden's site), price, "Get started."
2. **Sign up / sign in.**
3. **Upload resume** (`/start`): PDF or DOCX, max 5 MB. Optional headshot.
4. **AI parse**: the server sends the resume text to the Claude API, which returns structured profile data (name, headline, contact, links) and an ordered list of slides grouped by resume section. Slides mirror the resume closely; the AI must not invent facts.
5. **Editor** (`/edit`) with live preview side by side (stacked on mobile):
   - Edit profile fields and every slide; add, remove, and reorder slides; upload a photo per slide.
   - Choose the URL slug (checked for uniqueness).
   - Choose what goes on the card (phone optional) and the accent color.
   - Preview the site at phone width and the card front and back.
6. **Checkout** via Stripe.
7. **After payment** (triggered by the Stripe webhook, not the redirect):
   - Profile is published at `BRAND.com/{slug}`.
   - Card PDFs are generated and stored.
   - Email sent: "Your site is live" with a site link, PDF links, and a printing guide.
8. **Dashboard** (`/dashboard`): site link, download PDFs, printing guide, edit site, scan count, subscription status.

Editing after launch updates the live site immediately. Card PDFs regenerate only when something printed on the card changes. The QR code never changes (see §5).

## 4. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | |
| Styling | Tailwind CSS | App pages use Tailwind. Public profile pages use plain CSS ported 1:1 from the reference (`src/components/profile/profile.css`) so they match it exactly |
| Hosting | Vercel **Pro** | The Hobby plan is non-commercial only |
| Database | Railway Postgres + Drizzle ORM | Switched from Neon on 2026-09-27 (Kaeden already has Railway). Driver: `postgres` (postgres.js) with a small per-instance pool. Vercel connects over Railway's **public** URL (`DATABASE_PUBLIC_URL`), not the private `.railway.internal` one |
| Auth | Clerk | Decided 2026-09-27. `ClerkProvider` wraps only the signed-in app (`src/app/(app)`), not public pages |
| File storage | Vercel Blob | Resumes **private**; photos and PDFs public |
| AI | Anthropic API | Use tool use with a JSON schema for structured output. Check docs.claude.com for the current model names; a Sonnet-class model is right for parsing |
| Payments | Stripe Checkout + webhooks | |
| Email | Resend | |
| Card PDFs | `@react-pdf/renderer` | Vector output with embedded fonts. No headless Chrome |
| QR codes | `qrcode` npm package → SVG | Error correction level Q |
| Resume text extraction | `pdf-parse` (PDF), `mammoth` (DOCX) | |

## 5. Key design decisions (don't change without asking Kaeden)

1. **One multi-tenant app.** Every customer's site is the same code rendered from database rows. Never generate or deploy a separate site per customer.
2. **The QR code points to a permanent short URL we control: `BRAND.com/c/{code}`.**
   - `code` is a random 8-character ID assigned once per profile and never reused or changed.
   - The route looks up the profile, redirects (302) to the current `/{slug}`, and logs a scan.
   - This means customers can change their slug, add a custom domain later, or edit anything else, and **printed cards keep working.** This is the product's main promise; protect it.
3. **Cards never break, even if a subscription lapses.** If a profile is unpaid or lapsed, `/{slug}` shows a minimal contact page (name, headline, email) instead of a 404, and the owner sees a reactivate prompt when signed in. Only a takedown (§10) fully removes a page.
4. **The resume is the source of truth.** The AI parser keeps the resume's order and wording. It may shorten text to fit a slide but must never add accomplishments, numbers, or skills that aren't in the resume.
5. **Phone-first.** Almost every visitor arrives by scanning a QR code with a phone. Design and test public pages at 390px wide first.
6. **Customers print their own cards.** We deliver PDFs and a printing guide; we never place print orders.

## 6. Data model (starting point)

```
users           id, auth_id, email, created_at
profiles        id, user_id, slug (unique), qr_code (unique, immutable), status (draft|active|lapsed|removed),
                name, headline, email, phone, show_phone_on_site, show_phone_on_card,
                links (jsonb: github, linkedin, website...), theme (jsonb: accent color, template id),
                resume_blob_url (private), resume_pdf_public_url (optional), noindex (bool),
                created_at, updated_at, published_at
slides          id, profile_id, position, section, title, role, body, points (jsonb string[]),
                link (jsonb {label, href} | null), media (jsonb {type: image|video, url} | null), tint
future_items    id, profile_id, position, title, body
cards           id, profile_id, template_id, version, fields_hash,
                pdf_bleed_url, pdf_trim_url, pdf_sheet_url, generated_at
scans           id, profile_id, scanned_at, user_agent_family, referrer (no IPs stored)
subscriptions   id, profile_id, stripe_customer_id, stripe_subscription_id, status, current_period_end
```

## 7. Routes

```
/                      landing page
/start                 upload resume (auth required)
/edit                  editor + live preview (auth required)
/dashboard             owner dashboard (auth required)
/[slug]                public profile page (server-rendered, cached, revalidated on edit)
/c/[code]              QR redirect + scan logging
/print-guide           public printing instructions
/terms, /privacy       legal pages
/api/resume/parse      POST: extract text → Claude → return draft profile + slides
/api/upload            signed upload for photos and resumes
/api/cards/generate    regenerate card PDFs for a profile
/api/stripe/checkout   create a Checkout session
/api/stripe/webhook    handle checkout.session.completed, invoice.paid, customer.subscription.updated/deleted
```

Reserve slugs that collide with routes or look official: `start, edit, dashboard, c, api, print-guide, terms, privacy, admin, login, signup, help, support, about, pricing`, and similar.

## 8. AI resume parsing

- Extract plain text from the upload, then call Claude with a tool whose input schema matches `{ profile, slides[], future_items[] }`.
- Instructions to the model:
  - Use only facts present in the resume. Never invent.
  - Keep the resume's section order: summary → education → projects → leadership/activities → work → skills → awards.
  - One slide per resume entry. `role` = position + organization + dates. `points` = the entry's bullets, lightly shortened (max about 5 per slide, about 220 characters each).
  - Extract URLs only if they appear in the resume.
- Validate the output with Zod. On failure, retry once, then fall back to an empty editor with the raw text shown so the user can fill it in.
- Rate limit: 5 parses per user per day. Keep resume files private; never expose them publicly unless the user turns on "Show my resume PDF on my site."
- Show a banner in the editor: "Review everything. The AI drafted this from your resume."

## 9. Business card PDFs

Generate three files per card version:

1. **`card-bleed.pdf`**: 2 pages (front, back), 3.75 × 2.25 in, content inside a 0.125 in safe zone from trim. For print shops that accept bleed.
2. **`card-trim.pdf`**: 2 pages at exactly 3.5 × 2 in. For FedEx Office "Quick Business Cards" upload (double-sided = a 2-page PDF).
3. **`card-sheet.pdf`**: US Letter, 10-up fronts on page 1 and matching backs on page 2 (mirrored layout for duplex), with crop marks. For home or self-serve printing.

Rules:
- The QR encodes `https://BRAND.com/c/{code}`, rendered as a vector, dark on a white tile with a 4-module quiet zone, at least 1.0 in printed.
- **Every generated QR must be verified** by decoding it (for example `jsqr` on a rasterized render) in the generation pipeline; fail loudly if it doesn't match.
- Embed fonts. No text under 8 pt. Enforce max lengths on card fields and shrink-to-fit within limits; block generation if text still overflows.
- The printing guide (`/print-guide`, also linked in emails and the dashboard) covers: which file to use where; choosing FedEx "Quick Business Cards" (same day or next day), not "Premium" (about 5 business days); matte, heavier stock recommended; printing at 100% (never "fit to page"); and scanning one card before cutting or taking the whole batch.

## 10. Trust, safety, privacy

- Phone number is optional and separately toggleable for the site and the card.
- Public pages get an optional `noindex` toggle so the page doesn't show up in search results.
- Terms of Service and Privacy Policy pages before launch (placeholder text is fine during development, clearly marked).
- An admin-only takedown switch (`status = removed`) and a "Report this page" link in public page footers that emails the admins.
- Sanitize all user text before rendering; allow only `https://` links.
- Uploaded images: max 8 MB, re-encoded to WebP around 1600px wide; reject slide photos under 600px wide.
- Never log IP addresses for scans.

## 11. Pricing (placeholder, owned by Kaeden)

Store prices in Stripe, not code. Assume **one-time setup fee + annual renewal** (the renewal keeps the site live). The card PDF is free to download and reprint forever.

## 12. Milestones

Work in order. Each milestone ends with a working deploy and its acceptance check passing. Update §14 as you go.

**M1: Foundation**
- Next.js app, Tailwind, Drizzle + Railway Postgres, auth, Vercel project with preview deploys.
- Public `/[slug]` page that renders a seed profile (Kaeden's content from `/reference`) and **matches the reference site** on phone and desktop.
- ✅ The seed profile at `/kaeden` looks and behaves like meetkaeden.site at 390px and 1400px.

**M2: Resume → draft**
- Upload, text extraction, Claude parsing, Zod validation, draft saved to the database.
- ✅ Uploading `reference/resume.pdf` produces slides that match his site's content, with no invented facts.

**M3: Editor**
- Edit all fields and slides, reorder, photo upload, slug picker, live preview.
- ✅ Every field on the public page can be changed in the editor, and the preview updates without a reload.

**M4: Cards**
- `/c/[code]` redirect with scan logging, the three PDF outputs, QR verification, card preview in the editor.
- ✅ All three PDFs open at the correct physical size; the QR decodes to the right URL; changing the slug doesn't change the QR.

**M5: Payments + launch flow**
- Stripe Checkout, webhook-driven publishing, Resend emails, dashboard, lapsed-state page.
- ✅ A test-mode purchase goes from upload to live site to emailed PDFs with no manual steps; cancelling the subscription shows the lapsed page, and the QR still resolves.

**M6: Launch polish**
- Landing page, print guide, terms and privacy, report link, admin takedown, reserved slugs, rate limits, error states, empty states.
- ✅ A stranger can complete the full flow on a phone without help.

**Later (not now):** multiple site and card templates, custom domains via the Vercel Domains API, scan analytics charts, team or school bulk accounts, shipped premium cards.

## 13. Conventions

- TypeScript strict mode. Zod for every external input (forms, API bodies, AI output, webhooks).
- Server components by default; client components only for interactive parts (editor, carousel).
- Secrets only in environment variables; never commit `.env*`.
- Small, focused commits with clear messages. Open a PR per milestone.
- Before finishing any task: typecheck, lint, test the changed flow at 390px wide, and check for console errors.
- Ask Kaeden before adding a paid service, changing anything in §5, or changing the data model in a way that breaks existing rows.

### Environment variables
```
DATABASE_URL
CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
BLOB_READ_WRITE_TOKEN
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_PRICE_SETUP, STRIPE_PRICE_ANNUAL
RESEND_API_KEY, EMAIL_FROM
NEXT_PUBLIC_SITE_URL          # e.g. https://BRAND.com
ADMIN_EMAILS                  # comma-separated, for takedowns and reports
```

## 14. Status

- [x] M1 Foundation (done 2026-09-30). Live at https://card-platform-mu.vercel.app (`/kaeden`, sign-up and sign-in verified).
  - Next.js 16 + Tailwind 4, Drizzle schema for every table in §6 (`drizzle/0000_init.sql`), Clerk sign-in with protected `/start`, `/edit`, `/dashboard` (placeholders), public `/[slug]` page with lapsed (contact-only) and draft/removed (404) states, reserved slugs, https-only link sanitizing.
  - `/kaeden` vs. the live site in Chromium at 390 and 1400 px: pixel-identical within antialiasing; arrows, arrow keys, swipe, section tabs, Future projects popup, and `tel:` links behave the same; no console errors; no horizontal scroll.
  - Deploys: `vercel-build` applies migrations and inserts the /kaeden seed if missing. `/healthz` shows which env vars the running deployment can see (set/missing only).
  - Without `DATABASE_URL` the app serves the built-in seed (`src/seed/kaeden.ts`) at `/kaeden`.
  - Font: Archivo is self-hosted (`src/fonts/`, from `@fontsource-variable/archivo`) via `next/font/local` instead of the Google Fonts stylesheet.
  - Clerk is on the development instance (`pk_test_`). Before launch: create a production instance on the real domain and swap in `pk_live_`/`sk_live_` keys. Consider enabling first/last name at sign-up.
  - Vercel env var gotcha: `NEXT_PUBLIC_*` vars must be type Config, and switching a var between Sensitive and Config can blank its value. Check `/healthz` after changing vars, and redeploy without the build cache.
- [x] M2 Resume → draft (live upload verified 2026-09-30). Still to do: Kaeden's line-by-line review of the AI draft against `reference/resume.pdf` for invented facts.
  - Flow: `/start` uploads the resume (private) and optional photo straight from the browser to Vercel Blob via `/api/upload` (Vercel caps request bodies at ~4.5 MB), then `/api/resume/parse` extracts text, asks Claude for a draft, validates it, and saves a `draft` profile. `/edit` shows the draft for review with the "Review everything" banner; `/preview` renders it exactly like the public page (owner only).
  - AI: `claude-sonnet-5-5` via `client.beta.messages.parse` with a Zod schema (structured outputs, the current replacement for "tool use with a JSON schema"), effort `medium`, server-side refusal fallback. Output goes through `src/lib/resume/normalize.ts` (app Zod schemas, https-only links, tints). Retried once; if both fail, the draft keeps the raw resume text for the editor.
  - PDF text: `unpdf` instead of `pdf-parse` (pdf-parse's worker file breaks inside the Next.js bundle; unpdf is built for serverless and gives the same text). DOCX: `mammoth`.
  - Photos: re-encoded with `sharp` to WebP, 1600px wide, min 600px; the headshot goes on the first slide (`fit: "contain"`). The Blob store is **private**, so photos are served through `/media/photos/...` (only that folder, immutable cache headers); resumes are never readable publicly.
  - Limits: 5 parses per user per 24h (`resume_parses` table). Re-uploading replaces a draft; published profiles are never overwritten.
  - Blob store is private and connected via OIDC (`BLOB_STORE_ID`, no `BLOB_READ_WRITE_TOKEN`), so uploads use presigned URLs (`handleUploadPresigned` + `uploadPresigned`, browser picks a random path inside the user's folder). `/healthz` reports both Blob credentials.
  - Verified locally with a fake Claude server: extraction of `reference/resume.pdf` inside the built server, retry after malformed output, link normalization, save and re-save, draft not public (404).
- [ ] M3 Editor: partly done
  - Designs (2026-09-30, Kaeden's request): 4 website layouts (`carousel` = Kaeden's site, `profile` = modeled on Bryson States's site, `timeline`, `gallery`) × 6 palettes, and 5 card designs, all in `src/lib/design.ts`, stored on `profiles.theme` ({templateId, paletteId, cardTemplateId}). Layouts live in `src/components/profile/*Template.tsx`; `ProfileView` picks one. Every color is a palette CSS variable; the default gold palette keeps `/kaeden` pixel-identical to meetkaeden.site (re-verified).
  - `profiles.facts` (up to 4 {label, value, detail}) feeds the Profile layout's stat grid; the AI drafts them from the resume.
  - Flow: dashboard has three options: Create website & card (`/create`: layout + colors, card design, resume upload; once per account), Update your website (`/edit`: change layout/colors with a live preview of your own site, review content), Print my business card (`/card`: card design picker, QR link, printing guide). `/start` is now only for re-uploading a draft.
  - `/examples/[template]?palette=` renders the fictional sample profile "John Doe" (`src/seed/example.ts`, photos from meetkaeden.site with permission, all text made up) in any design; used for previews, the landing page, and sample cards. Don't use Kaeden's name or content in examples. The landing page's "Real sites" section links meetkaeden.site and https://brysonstates.website (screenshot in `public/examples/`).
  - Style note from Kaeden: keep the app UI plain and editorial, not "AI-generated" looking: no glowing rings, pill chips, boxed card grids, or marketing slogans; square corners, thin rules, short copy.
  - Still to do: editing slide text, reordering, per-slide photos, slug picker.
- [ ] M4 Cards: partly done
  - Done: `/c/[code]` redirect (302, scan logging without IPs), 5 card designs rendered in HTML/CSS at card proportions (`src/components/card/`), QR via `qrcode` (EC level Q, 4-module quiet zone). QR URLs use `NEXT_PUBLIC_SITE_URL` (falls back to the Vercel production URL): set it to the permanent domain before anyone prints.
  - Still to do: the three PDFs (@react-pdf), QR decode verification, download buttons on `/card`.
- [ ] M5 Payments + launch flow
- [ ] M6 Launch polish

### Open decisions for Kaeden
- [ ] Brand name and domain
- [x] Clerk vs. Auth0: **Clerk**
- [ ] Setup price and annual price
- [ ] Which business entity runs this (existing LLC or a new one)
- [ ] Whether meetkaeden.site moves onto the platform as its first profile or stays separate

@AGENTS.md
