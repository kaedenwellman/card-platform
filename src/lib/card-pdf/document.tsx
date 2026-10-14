import "server-only";
import { Document, Image, Line, Page, Path, Svg, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { fontFamily } from "./fonts";
import { BLEED, H, W, type El, type Face } from "./layout";
import { QUIET_ZONE, type QrMatrix } from "./qr";

export type CardFile = "trim" | "bleed" | "sheet";

// One SVG path for all dark modules, merged into horizontal runs, in module units.
function qrPath(m: QrMatrix) {
  let d = "";
  for (let y = 0; y < m.size; y++) {
    for (let x = 0; x < m.size; x++) {
      if (!m.dark(x, y)) continue;
      let run = 1;
      while (x + run < m.size && m.dark(x + run, y)) run++;
      d += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h${run}v1h${-run}z`;
      x += run - 1;
    }
  }
  return d;
}

function Element({ el }: { el: El }) {
  switch (el.kind) {
    case "rect":
      return (
        <View
          style={{ position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h, backgroundColor: el.color, borderRadius: el.radius ?? 0 }}
        />
      );
    case "image":
      return (
        <View style={{ position: "absolute", left: el.x, top: el.y, width: el.d, height: el.d, borderRadius: el.d / 2, overflow: "hidden" }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img */}
          <Image src={{ data: el.data, format: "png" }} style={{ width: el.d, height: el.d }} />
        </View>
      );
    case "qr": {
      const n = el.matrix.size + QUIET_ZONE * 2;
      return (
        <Svg viewBox={`0 0 ${n} ${n}`} style={{ position: "absolute", left: el.x, top: el.y, width: el.size, height: el.size }}>
          <Path d={qrPath(el.matrix)} fill="#000000" />
        </Svg>
      );
    }
    case "text":
      return (
        <>
          {el.t.lines.map((line, i) => (
            <Text
              key={i}
              style={{
                position: "absolute",
                left: el.x,
                top: el.y + i * el.t.size * el.lineHeight,
                // A little wider than measured so react-pdf never wraps a line we already fitted.
                width: el.w + 8,
                fontFamily: fontFamily(el.t.font),
                fontSize: el.t.size,
                letterSpacing: el.t.tracking * el.t.size,
                lineHeight: el.lineHeight,
                color: el.color,
              }}
            >
              {line}
            </Text>
          ))}
        </>
      );
  }
}

// Draws a face with its trim corner at (ox, oy), clipped to the given box on the page.
function FaceAt({ face, ox, oy, clip }: { face: Face; ox: number; oy: number; clip: { x: number; y: number; w: number; h: number } }) {
  return (
    <View style={{ position: "absolute", left: clip.x, top: clip.y, width: clip.w, height: clip.h, overflow: "hidden" }}>
      <View style={{ position: "absolute", left: ox - clip.x - BLEED, top: oy - clip.y - BLEED, width: W + 2 * BLEED, height: H + 2 * BLEED, backgroundColor: face.bg }} />
      <View style={{ position: "absolute", left: ox - clip.x, top: oy - clip.y, width: W, height: H }}>
        {face.els.map((el, i) => (
          <Element key={i} el={el} />
        ))}
      </View>
    </View>
  );
}

// US Letter, 2 columns × 5 rows of cards touching each other, centered.
const LETTER = { w: 612, h: 792 };
const COLS = 2;
const ROWS = 5;
const GX = (LETTER.w - COLS * W) / 2;
const GY = (LETTER.h - ROWS * H) / 2;

function CropMarks() {
  const marks: ReactNode[] = [];
  const off = BLEED + 3; // start just outside the bleed
  const len = 14;
  const line = (x1: number, y1: number, x2: number, y2: number) => (
    <Line key={marks.length} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000000" strokeWidth={0.5} />
  );
  for (let c = 0; c <= COLS; c++) {
    const x = GX + c * W;
    marks.push(line(x, GY - off - len, x, GY - off));
    marks.push(line(x, GY + ROWS * H + off, x, GY + ROWS * H + off + len));
  }
  for (let r = 0; r <= ROWS; r++) {
    const y = GY + r * H;
    marks.push(line(GX - off - len, y, GX - off, y));
    marks.push(line(GX + COLS * W + off, y, GX + COLS * W + off + len, y));
  }
  return (
    <Svg style={{ position: "absolute", left: 0, top: 0, width: LETTER.w, height: LETTER.h }} viewBox={`0 0 ${LETTER.w} ${LETTER.h}`}>
      {marks}
    </Svg>
  );
}

function SheetPage({ face, mirrored }: { face: Face; mirrored: boolean }) {
  const cells: ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Backs are mirrored left-to-right so they line up with the fronts when printed double-sided.
      const col = mirrored ? COLS - 1 - c : c;
      const ox = GX + col * W;
      const oy = GY + r * H;
      // Bleed only on the sheet's outer edges, so cards don't paint over their neighbors.
      const left = col === 0 ? BLEED : 0;
      const right = col === COLS - 1 ? BLEED : 0;
      const top = r === 0 ? BLEED : 0;
      const bottom = r === ROWS - 1 ? BLEED : 0;
      cells.push(
        <FaceAt key={`${r}-${c}`} face={face} ox={ox} oy={oy} clip={{ x: ox - left, y: oy - top, w: W + left + right, h: H + top + bottom }} />,
      );
    }
  }
  return (
    <Page size="LETTER" style={{ backgroundColor: "#FFFFFF" }}>
      {cells}
      <CropMarks />
    </Page>
  );
}

export function CardDocument({ file, front, back, title }: { file: CardFile; front: Face; back: Face; title: string }) {
  const meta = { title, creator: "Business card", producer: "Business card" };
  if (file === "sheet") {
    return (
      <Document {...meta}>
        <SheetPage face={front} mirrored={false} />
        <SheetPage face={back} mirrored />
      </Document>
    );
  }
  const b = file === "bleed" ? BLEED : 0;
  const size = { width: W + 2 * b, height: H + 2 * b };
  const clip = { x: 0, y: 0, w: size.width, h: size.height };
  return (
    <Document {...meta}>
      {[front, back].map((face, i) => (
        <Page key={i} size={size}>
          <FaceAt face={face} ox={b} oy={b} clip={clip} />
        </Page>
      ))}
    </Document>
  );
}
