import { auth } from "@clerk/nextjs/server";

// Every page in this group requires a signed-in user; others are sent to /sign-in.
export default async function SignedInLayout({ children }: LayoutProps<"/">) {
  await auth.protect();
  return children;
}
