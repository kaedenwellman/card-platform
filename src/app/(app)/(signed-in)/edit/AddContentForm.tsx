"use client";

import { uploadPresigned } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { VoiceTextarea } from "@/components/VoiceTextarea";
import { addEntry } from "@/lib/actions";
import { MAX_PHOTO_BYTES } from "@/lib/limits";

const input = "w-full rounded-sm border border-line bg-transparent p-3 text-base outline-none focus:border-muted";
const NEW = "__new__";

// Adds one entry (a job, project, award...) to the site, with an optional photo.
export function AddContentForm({ clerkId, sections }: { clerkId: string; sections: string[] }) {
  const router = useRouter();
  const [section, setSection] = useState(sections[0] ?? NEW);
  const [newSection, setNewSection] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoKey, setPhotoKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (photo && photo.size > MAX_PHOTO_BYTES) return setMessage({ kind: "error", text: "Photos can be at most 8 MB." });
    setBusy(true);
    try {
      const ext = photo?.name.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[1]?.replace("jpeg", "jpg") ?? "jpg";
      const blob = photo
        ? await uploadPresigned(`uploads/${clerkId}/${crypto.randomUUID()}.${ext}`, photo, {
            access: "private",
            handleUploadUrl: "/api/upload",
          })
        : null;
      const res = await addEntry({
        section: section === NEW ? newSection : section,
        title,
        role,
        text,
        linkUrl,
        linkLabel,
        photoPathname: blob?.pathname ?? null,
      });
      if (!res.ok) throw new Error(res.error);
      setTitle("");
      setRole("");
      setText("");
      setLinkUrl("");
      setLinkLabel("");
      setPhoto(null);
      setPhotoKey((k) => k + 1);
      setMessage({ kind: "ok", text: res.photoError ? `Added, but the photo wasn't: ${res.photoError}` : "Added to your site." });
      router.refresh();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Couldn't add that. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm">Section</span>
          <select className={`${input} bg-bg`} value={section} onChange={(e) => setSection(e.target.value)}>
            {sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value={NEW}>New section…</option>
          </select>
        </label>
        {section === NEW && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm">New section name</span>
            <input className={input} value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="e.g. Volunteering" />
          </label>
        )}
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm">Title</span>
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Summer Research Intern" required />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm">
          Where and when <span className="text-muted">(optional)</span>
        </span>
        <input className={input} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. City Hospital · Summer 2026" />
      </label>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="add-text" className="text-sm">
          What you did <span className="text-muted">(one point per line)</span>
        </label>
        <VoiceTextarea id="add-text" value={text} onChange={setText} rows={5} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm">
            Link <span className="text-muted">(optional)</span>
          </span>
          <input className={input} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="github.com/you/project" inputMode="url" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm">
            Link text <span className="text-muted">(optional)</span>
          </span>
          <input className={input} value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="See the code" />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm">
          Photo <span className="text-muted">(optional, at least 600px wide)</span>
        </span>
        <input
          key={photoKey}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="rounded-sm border border-line p-3 file:mr-3 file:rounded-sm file:border-0 file:bg-ink file:px-3 file:py-1 file:text-black"
        />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-sm bg-gold px-6 py-3 font-bold text-black [font-stretch:110%] hover:bg-ink disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add to my site"}
        </button>
        {message && (
          <span aria-live="polite" className={`text-sm ${message.kind === "error" ? "text-red-300" : "text-muted"}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
