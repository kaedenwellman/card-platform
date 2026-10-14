// Just the parts of fontkit we use to measure text for the card PDFs.
declare module "fontkit" {
  export interface Font {
    unitsPerEm: number;
    layout(text: string): { advanceWidth: number };
  }
  export function openSync(path: string): Font;
}
