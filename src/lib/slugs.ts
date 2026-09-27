// Slugs that collide with app routes or could look official. Checked on every slug change.
export const RESERVED_SLUGS = new Set([
  "c", "api", "start", "edit", "dashboard", "print-guide", "terms", "privacy",
  "admin", "login", "logout", "signin", "sign-in", "signup", "sign-up", "signout", "sign-out",
  "help", "support", "about", "pricing", "contact", "blog", "docs", "legal", "security",
  "settings", "account", "billing", "checkout", "static", "public", "assets", "seed",
  "_next", "favicon.ico", "robots.txt", "sitemap.xml", "www", "mail", "status", "report",
  "official", "staff", "team", "root", "system", "null", "undefined",
]);

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug) && !slug.includes("--") && !RESERVED_SLUGS.has(slug);
}

// 8 chars, no look-alikes (0/O, 1/l/I) so a code can be read aloud or typed from a card.
const QR_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

export function newQrCode() {
  const n = QR_ALPHABET.length;
  const limit = 256 - (256 % n); // reject the tail so every character is equally likely
  let code = "";
  while (code.length < 8) {
    for (const b of crypto.getRandomValues(new Uint8Array(16))) {
      if (b < limit && code.length < 8) code += QR_ALPHABET[b % n];
    }
  }
  return code;
}
