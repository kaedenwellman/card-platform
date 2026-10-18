import "server-only";
import { adminEmails } from "./email";
import { ensureUser } from "./owner";

// Admins are the signed-in users whose email is listed in ADMIN_EMAILS.
export async function currentAdmin() {
  const user = await ensureUser();
  if (!user?.email) return null;
  return adminEmails().includes(user.email.toLowerCase()) ? user : null;
}
