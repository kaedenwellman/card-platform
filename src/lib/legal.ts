// Facts the Terms and Privacy pages depend on. Fill these in before launch; anything still null
// shows as a visible placeholder on the pages, and DRAFT keeps the "draft" notice at the top.
export const LEGAL = {
  DRAFT: true,
  effectiveDate: "October 14, 2026",
  serviceName: "BRAND", // the product name customers see
  businessName: null as string | null, // the legal entity that runs it, e.g. "Example LLC"
  contactEmail: null as string | null, // where people send questions, deletion requests and reports
  governingState: "Colorado",
  minimumAge: 13,
};

export const placeholder = (value: string | null, what: string) => value ?? `[${what}]`;
