"use client";

import { useEffect, useRef, useState } from "react";

// Shows a page at a real viewport size (e.g. 1280×800 or 390×844), scaled down to fit its box.
export function ScaledFrame({
  src,
  width,
  height,
  title,
  className,
}: {
  src: string;
  width: number;
  height: number;
  title: string;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div
      ref={box}
      className={`relative w-full overflow-hidden bg-black ${className ?? ""}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {scale > 0 && (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
          style={{ width, height, transform: `scale(${scale})` }}
        />
      )}
    </div>
  );
}
