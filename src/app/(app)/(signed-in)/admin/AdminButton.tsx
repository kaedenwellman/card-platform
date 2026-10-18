"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { dismissReport, restore, takeDown } from "@/lib/admin-actions";

const ACTIONS = { takeDown, restore, dismissReport };

export function AdminButton({
  action,
  id,
  label,
  confirmText,
  danger = false,
}: {
  action: keyof typeof ACTIONS;
  id: string;
  label: string;
  confirmText?: string;
  danger?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const go = () => {
    if (confirmText && !confirm(confirmText)) return;
    start(async () => {
      const res = await ACTIONS[action](id).catch(() => ({ ok: false as const, error: "Something went wrong." }));
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  };
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className={` border px-3 py-1.5 text-sm disabled:opacity-50 ${
          danger ? "border-red-700/60 text-red-700 hover:border-red-700" : "border-line hover:border-muted"
        }`}
      >
        {pending ? "…" : label}
      </button>
      {error && <span className="text-sm text-red-700">{error}</span>}
    </span>
  );
}
