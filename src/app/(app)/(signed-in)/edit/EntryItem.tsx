"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { setEntryPhoto } from "@/lib/actions";
import { uploadPhoto } from "@/lib/upload-photo";
import { EntryForm, type EntryValues } from "./EntryForm";
import { RemoveEntryButton } from "./RemoveEntryButton";

const action = "text-sm text-muted underline underline-offset-4 hover:text-ink disabled:opacity-50";

// One entry on the Update page: read view with Edit / photo / Remove, or the edit form in place.
export function EntryItem({ entry, points, body, clerkId, sections }: { entry: EntryValues & { id: string }; points: string[]; body: string | null; clerkId: string; sections: string[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  async function changePhoto(f: File | null) {
    if (!f) return;
    setError(null);
    setBusy("Uploading photo…");
    try {
      const res = await setEntryPhoto(entry.id, await uploadPhoto(f, clerkId));
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that photo.");
    } finally {
      setBusy(null);
      if (file.current) file.current.value = "";
    }
  }

  async function removePhoto() {
    if (!confirm("Remove this photo?")) return;
    setBusy("Removing photo…");
    await setEntryPhoto(entry.id, null).catch(() => setError("Couldn't remove the photo."));
    setBusy(null);
    router.refresh();
  }

  if (editing) {
    return (
      <li className="border-b border-line py-5">
        <EntryForm clerkId={clerkId} sections={sections} entry={entry} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
      </li>
    );
  }

  const hasPhoto = Boolean(entry.photoUrl) && !entry.isVideo;
  return (
    <li className="flex flex-col gap-3 border-b border-line py-4 sm:flex-row sm:items-start">
      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.photoUrl!} alt="" className="h-20 w-32 shrink-0 border border-line object-cover" />
      ) : entry.isVideo ? (
        <div className="grid h-20 w-32 shrink-0 place-items-center border border-line text-xs text-muted">Video</div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="font-bold">{entry.title}</p>
        {entry.role && <p className="text-sm text-gold">{entry.role}</p>}
        {body && <p className="mt-2 text-sm text-ink/80">{body}</p>}
        {points.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-sm text-ink/80 marker:text-gold">
            {points.map((p, i) => (
              <li key={i}>{p.replace(/\*\*/g, "")}</li>
            ))}
          </ul>
        )}
        {entry.linkUrl && (
          <p className="mt-2 break-all text-sm text-gold">
            {entry.linkLabel || entry.linkUrl} → {entry.linkUrl}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button type="button" onClick={() => setEditing(true)} className={action}>
            Edit
          </button>
          <button type="button" disabled={Boolean(busy)} onClick={() => file.current?.click()} className={action}>
            {hasPhoto ? "Change photo" : "Add photo"}
          </button>
          {hasPhoto && (
            <button type="button" disabled={Boolean(busy)} onClick={removePhoto} className={action}>
              Remove photo
            </button>
          )}
          <RemoveEntryButton id={entry.id} title={entry.title} />
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => changePhoto(e.target.files?.[0] ?? null)} />
          {busy && <span className="text-sm text-muted">{busy}</span>}
          {error && <span className="text-sm text-red-300">{error}</span>}
        </div>
      </div>
    </li>
  );
}
