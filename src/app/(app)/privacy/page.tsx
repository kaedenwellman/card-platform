import Link from "next/link";
import { LegalPage, List, Section } from "@/components/legal/LegalPage";
import { LEGAL, placeholder } from "@/lib/legal";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  const name = LEGAL.serviceName;
  const business = placeholder(LEGAL.businessName, "business name");
  const email = placeholder(LEGAL.contactEmail, "contact email");

  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what {business} collects when you use {name}, why, and what you can do about it. The short
        version: we use your information to build and run your site and card, we don&apos;t sell it, and we don&apos;t
        show ads. See also our <Link href="/terms">Terms of Service</Link>.
      </p>

      <Section title="What we collect">
        <List
          items={[
            <>
              <strong>Account details:</strong> your name and email address when you sign up.
            </>,
            <>
              <strong>Your resume:</strong> the file you upload and the text we extract from it, or your answers if you
              use our questions instead of a resume. The file is stored privately and isn&apos;t shown on your site.
            </>,
            <>
              <strong>Your site content:</strong> everything you add or edit, including contact details, links, and
              photos.
            </>,
            <>
              <strong>Payment records:</strong> Stripe handles your card details; we never see or store your card
              number. We keep your Stripe customer ID, subscription status, and renewal date.
            </>,
            <>
              <strong>QR code scans:</strong> when someone scans your card, we record the time, the general type of
              browser (for example &ldquo;iPhone Safari&rdquo;), and the referring page if there is one. We don&apos;t
              store their IP address.
            </>,
            <>
              <strong>Usage data:</strong> anonymous, aggregated page-view statistics, collected without cookies. Our
              hosting provider also keeps short-lived technical logs (which can include IP addresses) for security and
              troubleshooting.
            </>,
          ]}
        />
      </Section>

      <Section title="How we use it">
        <List
          items={[
            "To build, host, and update your website and generate your card files.",
            "To process payments and renewals.",
            "To send emails about your account: when your site goes live, payment problems, renewals, and important changes. We don't send marketing emails without asking.",
            "To keep the service secure, prevent abuse, and fix problems.",
          ]}
        />
      </Section>

      <Section title="What's public">
        <p>
          Everything on your website is public: anyone with the link or your QR code can see it, and search engines may
          list it. Your phone number appears only if you turn it on. Your uploaded resume file, account email (unless
          you put it on your site), and payment details are never shown.
        </p>
      </Section>

      <Section title="AI drafting">
        <p>
          To draft your site, we send your resume text (or your answers) to Anthropic, which provides the AI model we
          use. Anthropic processes it to return a draft and, under its commercial terms, doesn&apos;t use it to train
          its models.
        </p>
      </Section>

      <Section title="Who we share it with">
        <p>We use these service providers to run {name}. They only get what they need to do their job:</p>
        <List
          items={[
            "Clerk: sign-in and account management.",
            "Vercel: website hosting, file storage, and page-view statistics.",
            "Railway: our database.",
            "Anthropic: AI drafting of your site.",
            "Stripe: payments.",
            "Resend: account emails.",
          ]}
        />
        <p>
          We don&apos;t sell your personal information or share it for advertising. We may disclose information if the
          law requires it, to protect people&apos;s safety, or as part of a sale or merger of the business (in which
          case this policy keeps applying to your information).
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          Signing in uses cookies from Clerk to keep you logged in on the account pages. Public website pages don&apos;t
          set cookies, and our page-view statistics don&apos;t use them.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your information while you have an account, and keep a paused site&apos;s content so you can renew.
          When you ask us to delete your account, we delete your site, resume, photos, and scan history within 30 days.
          Payment records are kept as long as tax and accounting laws require, and copies can remain in backups for a
          short time after deletion.
        </p>
      </Section>

      <Section title="Your choices">
        <List
          items={[
            "Edit or remove anything on your site at any time from your dashboard.",
            "Turn your phone number on or off.",
            `Ask for a copy of your information, a correction, or deletion of your account by emailing ${email}.`,
          ]}
        />
        <p>
          Depending on where you live, you may have further rights over your data; contact us and we&apos;ll help. We
          won&apos;t treat you differently for using them.
        </p>
      </Section>

      <Section title="Children">
        <p>
          {name} isn&apos;t meant for children under {LEGAL.minimumAge}, and we don&apos;t knowingly collect their
          information. If you believe a child under {LEGAL.minimumAge} has signed up, email {email} and we&apos;ll
          delete the account.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Connections are encrypted, resumes are stored privately, and access to your account requires signing in. No
          system is perfectly secure, but we&apos;ll tell you promptly if a breach affects your information.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If we make significant changes, we&apos;ll email you or show a notice when you sign in before they take
          effect.
        </p>
      </Section>

      <Section title="Contact">
        <p>Privacy questions or requests: {email}.</p>
      </Section>
    </LegalPage>
  );
}
