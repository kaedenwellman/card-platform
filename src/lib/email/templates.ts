// Plain transactional emails: a short message, one button, a text version. Light background,
// because dark emails render badly in many mail apps. Everything user-supplied is escaped.

export type Message = { subject: string; html: string; text: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout({ heading, paragraphs, button, footer }: { heading: string; paragraphs: string[]; button: { label: string; href: string }; footer?: string }) {
  const p = (html: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#2b2a27">${html}</p>`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f2ee">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:6px"><tr><td style="padding:32px 28px;font-family:Helvetica Neue,Helvetica,Arial,sans-serif">
<h1 style="margin:0 0 20px;font-size:22px;line-height:1.25;color:#111111">${heading}</h1>
${paragraphs.map(p).join("\n")}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 8px"><tr><td style="background:#111111;border-radius:4px">
<a href="${esc(button.href)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none">${esc(button.label)}</a>
</td></tr></table>
${footer ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#77736b">${footer}</p>` : ""}
</td></tr></table>
</td></tr></table>
</body></html>`;
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

export function siteLiveEmail({ name, siteUrl, cardUrl, again }: { name: string; siteUrl: string; cardUrl: string; again: boolean }): Message {
  const subject = again ? "Your site is back online" : "Your site is live";
  const lead = again ? "Thanks for renewing. Your site is back online at:" : "Your site is live at:";
  return {
    subject,
    html: layout({
      heading: `Hi ${esc(firstName(name))}, ${again ? "you're back online" : "you're live"}`,
      paragraphs: [
        `${lead}<br><a href="${esc(siteUrl)}" style="color:#111111">${esc(siteUrl.replace(/^https?:\/\//, ""))}</a>`,
        again
          ? "Cards you've already printed work again; their QR code never changed."
          : "Your business card files are ready. Download them, then print at FedEx Office (choose &ldquo;Quick Business Cards&rdquo;), a UPS Store, or at home.",
        "Before printing a whole batch, print one card and scan its QR code with your phone.",
      ],
      button: { label: "Get my card files", href: cardUrl },
      footer: "You can edit your site any time. Changes show up right away, and printed cards keep working.",
    }),
    text: [
      `Hi ${firstName(name)},`,
      "",
      `${lead} ${siteUrl}`,
      "",
      again
        ? "Cards you've already printed work again; their QR code never changed."
        : `Your business card files are ready: ${cardUrl}`,
      "Print one card and scan its QR code with your phone before printing a whole batch.",
    ].join("\n"),
  };
}

export function paymentFailedEmail({ name, payUrl, siteUrl }: { name: string; payUrl: string; siteUrl: string }): Message {
  return {
    subject: "Your payment didn't go through",
    html: layout({
      heading: `Hi ${esc(firstName(name))}, your payment didn't go through`,
      paragraphs: [
        "We couldn't charge your card for your site's renewal. We'll try again over the next few days.",
        `Your site at <a href="${esc(siteUrl)}" style="color:#111111">${esc(siteUrl.replace(/^https?:\/\//, ""))}</a> stays up in the meantime. To keep it that way, update your card or pay now.`,
      ],
      button: { label: "Update payment", href: payUrl },
    }),
    text: [
      `Hi ${firstName(name)},`,
      "",
      "We couldn't charge your card for your site's renewal. We'll try again over the next few days.",
      `Your site (${siteUrl}) stays up in the meantime. Update your card or pay here: ${payUrl}`,
    ].join("\n"),
  };
}

export function sitePausedEmail({ name, renewUrl }: { name: string; renewUrl: string }): Message {
  return {
    subject: "Your site is paused",
    html: layout({
      heading: `Hi ${esc(firstName(name))}, your site is paused`,
      paragraphs: [
        "Your subscription ended, so your site now shows only your name and contact details. Your content is saved.",
        "Printed cards still work: their QR code opens that contact page. Renew and everything comes back right away.",
      ],
      button: { label: "Renew my site", href: renewUrl },
    }),
    text: [
      `Hi ${firstName(name)},`,
      "",
      "Your subscription ended, so your site now shows only your name and contact details. Your content is saved.",
      "Printed cards still work: their QR code opens that contact page.",
      `Renew here and everything comes back right away: ${renewUrl}`,
    ].join("\n"),
  };
}
