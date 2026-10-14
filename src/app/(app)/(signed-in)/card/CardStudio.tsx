"use client";

import { useState, useTransition } from "react";
import type { CardFace } from "@/components/card/BusinessCard";
import { CardDesignPicker } from "@/components/design/CardDesignPicker";
import { saveCardDesign } from "@/lib/actions";
import type { CardTemplateId, PaletteId } from "@/lib/design";

const FILES = [
  { id: "trim", label: "FedEx / UPS", note: "3.5 × 2 in, 2 pages", filename: "card-trim.pdf" },
  { id: "bleed", label: "Print shop", note: "with ⅛ in bleed", filename: "card-bleed.pdf" },
  { id: "sheet", label: "Home printer", note: "Letter, 10 per sheet", filename: "card-sheet.pdf" },
] as const;

// Card design picker (saves as soon as it changes) and the PDF downloads, which always use the
// saved design.
export function CardStudio({
  initial,
  paletteId,
  card,
  canDownload,
}: {
  initial: CardTemplateId;
  paletteId: PaletteId;
  card: CardFace;
  canDownload: boolean;
}) {
  const [design, setDesign] = useState(initial);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const choose = (id: CardTemplateId) => {
    setDesign(id);
    setError(null);
    setDownloadError(null);
    startSaving(async () => {
      try {
        await saveCardDesign({ cardTemplateId: id });
      } catch {
        setError("Couldn't save your choice. Try again.");
      }
    });
  };

  const download = async (file: (typeof FILES)[number]) => {
    setBusy(file.id);
    setDownloadError(null);
    try {
      const res = await fetch(`/api/cards/${file.id}`);
      if (!res.ok) {
        setDownloadError(await res.text());
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setDownloadError("Download failed. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <CardDesignPicker value={design} onChange={choose} paletteId={paletteId} card={card} />
        <p aria-live="polite" className="min-h-5 text-sm text-muted">
          {saving ? "Saving…" : error ? <span className="text-red-300">{error}</span> : null}
        </p>
      </div>

      <div className="border-t border-line pt-8">
        <h2 className="font-bold">Download</h2>
        {canDownload ? (
          <>
            <ul className="mt-3 border-t border-line">
              {FILES.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-4 border-b border-line py-3">
                  <div>
                    <div>{f.label}</div>
                    <div className="text-sm text-muted">{f.note}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => download(f)}
                    disabled={saving || busy !== null}
                    className="rounded-sm border border-line px-4 py-2 text-sm hover:border-muted disabled:opacity-50"
                  >
                    {busy === f.id ? "Making PDF…" : "Download PDF"}
                  </button>
                </li>
              ))}
            </ul>
            <p aria-live="polite" className="mt-3 min-h-5 text-sm">
              {downloadError && <span className="text-red-300">{downloadError}</span>}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Your card files are ready to download once your site is published. The QR code needs a live site to open.
          </p>
        )}
      </div>
    </div>
  );
}
