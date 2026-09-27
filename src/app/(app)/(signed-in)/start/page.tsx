export const metadata = { title: "Upload your resume" };

// M2: resume upload, text extraction, and AI parsing.
export default function StartPage() {
  return (
    <section className="max-w-xl">
      <h1 className="text-3xl font-extrabold [font-stretch:112%]">Upload your resume</h1>
      <p className="mt-3 text-muted">PDF or DOCX, up to 5 MB. Coming in the next milestone.</p>
    </section>
  );
}
