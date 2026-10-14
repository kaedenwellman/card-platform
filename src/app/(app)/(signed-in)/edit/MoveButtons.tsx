"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { moveEntry, moveSection } from "@/lib/actions";

// ↑ / ↓ for an entry (within its section) or a whole section.
export function MoveButtons({
  target,
  label,
  first,
  last,
}: {
  target: { entry: string } | { section: string };
  label: string; // what's being moved, for screen readers
  first: boolean;
  last: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const move = (direction: "up" | "down") =>
    start(async () => {
      await ("entry" in target ? moveEntry(target.entry, direction) : moveSection(target.section, direction));
      router.refresh();
    });
  const btn =
    "grid h-8 w-8 place-items-center rounded-sm border border-line text-sm text-muted hover:border-muted hover:text-ink disabled:opacity-30 disabled:hover:border-line";

  return (
    <span className="inline-flex gap-1.5" aria-busy={pending}>
      <button type="button" className={btn} disabled={first || pending} onClick={() => move("up")} aria-label={`Move ${label} up`} title="Move up">
        ↑
      </button>
      <button type="button" className={btn} disabled={last || pending} onClick={() => move("down")} aria-label={`Move ${label} down`} title="Move down">
        ↓
      </button>
    </span>
  );
}
