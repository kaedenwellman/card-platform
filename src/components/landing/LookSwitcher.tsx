"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

// Visual styles for the landing page. The choice is stored per visitor and applied as
// <html data-look="…">; src/components/landing/looks.css styles each look, scoped to pages that
// contain .look-scope (only the landing page), so the rest of the app is never restyled.
export const LOOKS = [
  { id: "original", name: "Original" },
  { id: "editorial", name: "Editorial" },
  { id: "cinematic", name: "Cinematic" },
] as const;
export type LookId = (typeof LOOKS)[number]["id"];

const KEY = "landing-look";
const EVENT = "landing-look-change";

// Runs before the page paints (inline in the layout), so a returning visitor never sees a flash
// of the default look. A saved look that no longer exists (e.g. a removed one) is ignored.
export const lookBootScript = `try{var l=localStorage.getItem("${KEY}");if(${JSON.stringify(LOOKS.map((x) => x.id))}.indexOf(l)>0)document.documentElement.dataset.look=l}catch(e){}`;

function current(): LookId {
  const l = document.documentElement.dataset.look;
  return LOOKS.some((x) => x.id === l) ? (l as LookId) : "original";
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

function choose(id: LookId) {
  document.documentElement.dataset.look = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // private mode: the look still applies for this visit
  }
  window.dispatchEvent(new Event(EVENT));
}

export function LookSwitcher() {
  const pathname = usePathname();
  const look = useSyncExternalStore(subscribe, current, () => "original" as LookId);
  if (pathname !== "/") return null;

  return (
    <div className="look-switcher" role="group" aria-label="Page style">
      <span className="look-switcher-label">Style</span>
      {LOOKS.map((l) => (
        <button key={l.id} type="button" aria-pressed={look === l.id} onClick={() => choose(l.id)}>
          {l.name}
        </button>
      ))}
    </div>
  );
}
