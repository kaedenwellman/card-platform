import "server-only";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export type ResumeKind = "pdf" | "docx";

// Identify by content, not by the file name or the browser-reported type.
export function detectResumeKind(bytes: Uint8Array): ResumeKind | null {
  const head = String.fromCharCode(...bytes.subarray(0, 5));
  if (head === "%PDF-") return "pdf";
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "docx"; // ZIP container ("PK")
  return null;
}

export async function extractResumeText(bytes: Uint8Array, kind: ResumeKind): Promise<string> {
  let text: string;
  if (kind === "pdf") {
    // unpdf: pdf.js built for serverless (no worker file), unlike pdf-parse which breaks when bundled.
    const pdf = await getDocumentProxy(bytes.slice());
    try {
      text = (await extractText(pdf, { mergePages: true })).text;
    } finally {
      await pdf.cleanup();
    }
  } else {
    text = (await mammoth.extractRawText({ buffer: Buffer.from(bytes) })).value;
  }
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
