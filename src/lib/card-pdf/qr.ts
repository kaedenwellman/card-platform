import "server-only";
import jsQR from "jsqr";
import QRCode from "qrcode";

export const QUIET_ZONE = 4; // modules of white around the code, per the QR spec

export type QrMatrix = { size: number; dark: (x: number, y: number) => boolean };

// The same encoding as the on-screen QR (src/lib/card.ts): error correction level Q.
export function qrMatrix(url: string): QrMatrix {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: "Q" });
  return { size: modules.size, dark: (x, y) => Boolean(modules.get(y, x)) };
}

export class QrVerifyError extends Error {}

// Rasterizes exactly the modules the PDF draws and decodes them. Throws unless the code reads back
// as the expected URL, so a card that wouldn't scan is never handed out.
export function verifyQr(matrix: QrMatrix, expected: string) {
  const scale = 8;
  const side = (matrix.size + QUIET_ZONE * 2) * scale;
  const pixels = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.dark(x, y)) continue;
      for (let py = 0; py < scale; py++) {
        const row = ((y + QUIET_ZONE) * scale + py) * side;
        for (let px = 0; px < scale; px++) {
          const i = (row + (x + QUIET_ZONE) * scale + px) * 4;
          pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
        }
      }
    }
  }
  const decoded = jsQR(pixels, side, side);
  if (decoded?.data !== expected) {
    throw new QrVerifyError(`QR check failed: expected ${expected}, read ${decoded ? decoded.data : "nothing"}`);
  }
}
