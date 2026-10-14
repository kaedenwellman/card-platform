import Link from "next/link";
import { LegalPage, List, Section } from "@/components/legal/LegalPage";
import { LEGAL, placeholder } from "@/lib/legal";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  const name = LEGAL.serviceName;
  const business = placeholder(LEGAL.businessName, "business name");
  const email = placeholder(LEGAL.contactEmail, "contact email");

  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms are an agreement between you and {business} (&ldquo;we&rdquo;, &ldquo;us&rdquo;), which runs {name}.
        By creating an account or using {name}, you agree to them. Please also read our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <Section title="What we provide">
        <p>
          {name} turns your resume, or your answers to our questions, into a personal website and a print-ready business
          card. The card has a QR code that opens your website. You print the cards yourself; we don&apos;t print or
          ship anything.
        </p>
      </Section>

      <Section title="Your account">
        <List
          items={[
            `You must be at least ${LEGAL.minimumAge} years old. If you're under 18, a parent or guardian must agree to these terms and handle any payment.`,
            "Give accurate information, and keep your sign-in secure. You're responsible for what happens under your account.",
            "Each account gets one website and card.",
          ]}
        />
      </Section>

      <Section title="Your content">
        <p>
          You own what you upload and write: your resume, photos, and everything on your site. You give us permission to
          store it, display it on your public website, put it on your card files, and process it as needed to run{" "}
          {name} (for example, sending your resume text to our AI provider to draft your site). This permission ends
          when you delete your content or account, except for copies we must keep by law or that remain briefly in
          backups.
        </p>
        <p>
          Your website is public. Anyone with the link or your QR code can see it, and search engines may list it.
          Only include what you&apos;re comfortable sharing.
        </p>
        <p>
          <strong>Check the AI&apos;s work.</strong> Our AI drafts your site from what you give it and is told not to
          invent anything, but it can still make mistakes. You&apos;re responsible for reviewing and correcting your
          site and card before you share or print them.
        </p>
      </Section>

      <Section title="What you can't post">
        <List
          items={[
            "Anything illegal, or that infringes someone else's copyright, trademark, or privacy.",
            "False claims about degrees, jobs, awards, or other credentials, or pretending to be someone else.",
            "Other people's personal information without their permission.",
            "Harassment, threats, hate speech, or sexual content.",
            "Spam, scams, phishing, or links to malware.",
          ]}
        />
        <p>
          We may remove content or suspend a site that breaks these rules. If you see a site that does, email{" "}
          {email}.
        </p>
      </Section>

      <Section title="Payment and renewal">
        <List
          items={[
            "Publishing your site costs the price shown before you pay: a yearly subscription, plus a one-time setup fee if one is listed. Payments are handled by Stripe.",
            "Your subscription renews automatically each year at the then-current price, charged to your saved payment method, until you cancel. We'll remind you by email before a renewal.",
            <>
              You can cancel any time from <strong>Manage billing</strong> on your dashboard. Your site stays live until the
              end of the year you&apos;ve paid for.
            </>,
            "Payments aren't refundable, including for unused parts of a year, except where the law requires a refund or we charged you by mistake.",
          ]}
        />
      </Section>

      <Section title="If your subscription ends">
        <p>
          Your site is paused: it shows only your name, headline, and email instead of your full site. Your content is
          kept so you can renew and pick up where you left off, unless you ask us to delete it. Printed cards keep
          working the whole time; their QR code opens the paused page.
        </p>
      </Section>

      <Section title="Your printed cards">
        <p>
          The QR code on your card points to a permanent link that we redirect to your site, so you can edit your site
          without reprinting. Print one card and scan it before printing a batch. We aren&apos;t responsible for
          printing costs caused by mistakes in your content or by a printer&apos;s settings. If {name} ever shuts down,
          we&apos;ll give you at least 60 days&apos; notice by email.
        </p>
      </Section>

      <Section title="Ending your account">
        <p>
          You can stop using {name} at any time. To delete your account and site, email {email}. We may suspend or
          close accounts that break these terms, misuse the service, or don&apos;t pay. If we close your account for a
          reason other than a violation of these terms, we&apos;ll refund the unused part of your current year.
        </p>
      </Section>

      <Section title="No warranty">
        <p>
          We work to keep {name} running and your QR code working, but the service is provided &ldquo;as is&rdquo; and
          &ldquo;as available&rdquo;, without warranties of any kind, to the extent the law allows. We don&apos;t
          promise it will be uninterrupted or error-free, or that it will get you a job or any other result.
        </p>
      </Section>

      <Section title="Limits on our liability">
        <p>
          To the extent the law allows, we aren&apos;t liable for indirect, incidental, or consequential damages, or for
          lost profits or opportunities. Our total liability for any claim about {name} is limited to the amount you
          paid us in the 12 months before the claim.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          We may update these terms. If a change is significant, we&apos;ll email you or show a notice when you sign in
          before it takes effect. Continuing to use {name} after that means you accept the new terms.
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          These terms are governed by the laws of the State of {LEGAL.governingState}, USA, without regard to its
          conflict-of-laws rules. Disputes will be handled in the state or federal courts located in{" "}
          {LEGAL.governingState}, unless the law where you live says otherwise.
        </p>
      </Section>

      <Section title="Contact">
        <p>Questions about these terms: {email}.</p>
      </Section>
    </LegalPage>
  );
}
