"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { VoiceTextarea } from "@/components/VoiceTextarea";
import { addEntry, updateEntry } from "@/lib/actions";
import { uploadPhoto } from "@/lib/upload-photo";

export const fieldClass = "w-full rounded-sm border border-line bg-transparent p-3 text-base outline-none focus:border-muted";
const NEW = "__new__";

export type EntryValues = {
  id?: string;
  section: string;
  title: string;
  role: string;
  text: string; // body, or points one per line
  linkUrl: string;
  linkLabel: string;
  photoUrl: string | null;
  isVideo?: boolean;
};

// Add a new entry, or edit an existing one (when `entry.id` is set).
export function EntryForm({
  clerkId,
  sections,
  entry,
  onDone,
  onCancel,
}: {
  clerkId: string;
  sections: string[];
  entry?: EntryValues;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const editing = Boolean(entry?.id);
  const blank: EntryValues = { section: sections[0] ?? NEW, title: "", role: "", text: "", linkUrl: "", linkLabel: "", photoUrl: null };
  const [v, setV] = useState<EntryValues>(entry ?? blank);
  const [newSection, setNewSection] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const set = (k: keyof EntryValues) => (x: string) => setV((cur) => ({ ...cur, [k]: x }));
  const sectionOptions = v.section !== NEW && !sections.includes(v.section) ? [v.section, ...sections] : sections;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const photoPathname = photo ? await uploadPhoto(photo, clerkId) : null;
      const fields = {
        section: v.section === NEW ? newSection : v.section,
        title: v.title,
        role: v.role,
        text: v.text,
        linkUrl: v.linkUrl,
        linkLabel: v.linkLabel,
        photoPathname,
      };
      const res = editing ? await updateEntry({ ...fields, id: entry!.id!, removePhoto }) : await addEntry(fields);
      if (!res.ok) throw new Error(res.error);
      router.refresh();
      if (editing) {
        onDone?.();
        return;
      }
      setV({ ...blank, section: fields.section });
      setPhoto(null);
      setFileKey((k) => k + 1);
      setMessage({ kind: "ok", text: res.photoError ? `Added, but the photo wasn't: ${res.photoError}` : "Added to your site." });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Couldn't save. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm">Section</span>
          <select className={`${fieldClass} bg-bg`} value={v.section} onChange={(e) => set("section")(e.target.value)}>
            {sectionOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value={NEW}>New section…</option>
          </select>
        </label>
        {v.section === NEW && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm">New section name</span>
            <input className={fieldClass} value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="e.g. Volunteering" />
          </label>
        )}
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm">Title</span>
        <input className={fieldClass} value={v.title} onChange={(e) => set("title")(e.target.value)} placeholder="e.g. Summer Research Intern" required />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm">
          Where and when <span className="text-muted">(optional)</span>
        </span>
        <input className={fieldClass} value={v.role} onChange={(e) => set("role")(e.target.value)} placeholder="e.g. City Hospital · Summer 2026" />
      </label>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`text-${entry?.id ?? "new"}`} className="text-sm">
          What you did <span className="text-muted">(one point per line)</span>
        </label>
        <VoiceTextarea id={`text-${entry?.id ?? "new"}`} value={v.text} onChange={set("text")} rows={5} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm">
            Link <span className="text-muted">(optional)</span>
          </span>
          <input className={fieldClass} value={v.linkUrl} onChange={(e) => set("linkUrl")(e.target.value)} placeholder="github.com/you/project" inputMode="url" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm">
            Link text <span className="text-muted">(optional)</span>
          </span>
          <input className={fieldClass} value={v.linkLabel} onChange={(e) => set("linkLabel")(e.target.value)} placeholder="See the code" />
        </label>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm">
          Photo <span className="text-muted">(optional, at least 600px wide)</span>
        </span>
        {editing && v.photoUrl && !v.isVideo && !removePhoto && !photo && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.photoUrl} alt="" className="h-16 w-24 border border-line object-cover" />
            <button type="button" onClick={() => setRemovePhoto(true)} className="text-sm text-muted underline underline-offset-4 hover:text-red-300">
              Remove photo
            </button>
          </div>
        )}
        {editing && v.isVideo && <p className="text-sm text-muted">This entry has a video. Uploading a photo replaces it.</p>}
        {removePhoto && (
          <p className="text-sm text-muted">
            Photo will be removed.{" "}
            <button type="button" onClick={() => setRemovePhoto(false)} className="underline underline-offset-4">
              Undo
            </button>
          </p>
        )}
        <input
          key={fileKey}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label={editing && v.photoUrl ? "Replace photo" : "Add a photo"}
          onChange={(e) => {
            setPhoto(e.target.files?.[0] ?? null);
            setRemovePhoto(false);
          }}
          className="rounded-sm border border-line p-3 file:mr-3 file:rounded-sm file:border-0 file:bg-ink file:px-3 file:py-1 file:text-black"
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy} className="rounded-sm bg-gold px-6 py-3 font-bold text-black [font-stretch:110%] hover:bg-ink disabled:opacity-60">
          {busy ? "Saving…" : editing ? "Save changes" : "Add to my site"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-sm border border-line px-6 py-3 hover:border-muted">
            Cancel
          </button>
        )}
        {message && (
          <span aria-live="polite" className={`text-sm ${message.kind === "error" ? "text-red-300" : "text-muted"}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
