"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeEntry } from "@/lib/actions";

export function RemoveEntryButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Remove "${title}" from your site?`)) return;
        start(async () => {
          await removeEntry(id);
          router.refresh();
        });
      }}
      className="text-sm text-muted underline underline-offset-4 hover:text-red-300 disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
