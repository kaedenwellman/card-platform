"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// An <img> that swaps to `fallback` if it fails to load (e.g. a remote stock photo goes missing).
// Also catches errors that happened before hydration by checking the image once mounted.
export function SafeImg({
  src,
  alt,
  className,
  style,
  loading,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  loading?: "eager" | "lazy";
  fallback: ReactNode;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  if (failed) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} className={className} style={style} loading={loading} onError={() => setFailed(true)} />;
}
