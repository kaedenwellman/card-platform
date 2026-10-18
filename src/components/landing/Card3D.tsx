"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A business card floating in 3D, tipped onto its corner, that slowly spins on its own and can be
// spun by dragging (mouse or touch) or with the arrow keys. Front and back are passed in as
// already-rendered card faces. Pure CSS 3D transforms driven by one requestAnimationFrame loop
// that only runs while the card is on screen; reduced-motion visitors get a still card they can
// still turn.
export function Card3D({ front, back, label }: { front: ReactNode; back: ReactNode; label: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = card.current;
    const st = stage.current;
    if (!el || !st) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let yaw = -24; // spin around the card's (diagonal) long axis, degrees
    let pitch = 0; // extra tilt from vertical drags
    let velocity = 0; // degrees per second after a fling
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let lastMove = 0;
    let visible = false;
    let raf = 0;
    let prev = performance.now();
    const AUTO = still ? 0 : 14; // idle spin speed, degrees per second

    const draw = (t: number) => {
      const bob = still ? 0 : Math.sin(t / 900) * 8;
      el.style.transform = `translateY(${bob}px) rotateX(${pitch}deg) rotateY(${yaw}deg)`;
    };

    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - prev) / 1000);
      prev = t;
      if (!dragging) {
        yaw += (velocity + AUTO) * dt;
        velocity *= Math.pow(0.08, dt); // fling coasts to a stop in about a second
        pitch *= Math.pow(0.2, dt); // tilt eases back to level
      }
      draw(t);
      raf = visible ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!raf) {
        prev = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    io.observe(st);

    const down = (e: PointerEvent) => {
      dragging = true;
      velocity = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMove = performance.now();
      st.setPointerCapture(e.pointerId);
      st.dataset.dragging = "true";
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      yaw += dx * 0.45;
      pitch = Math.max(-35, Math.min(35, pitch - dy * 0.3));
      velocity = ((dx * 0.45) / Math.max(1, now - lastMove)) * 1000;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMove = now;
      if (still) draw(now);
    };
    const up = () => {
      dragging = false;
      delete st.dataset.dragging;
      if (performance.now() - lastMove > 120) velocity = 0; // held still before letting go
      velocity = Math.max(-900, Math.min(900, velocity));
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      yaw += e.key === "ArrowLeft" ? -30 : 30;
      draw(performance.now());
      start();
    };

    st.addEventListener("pointerdown", down);
    st.addEventListener("pointermove", move);
    st.addEventListener("pointerup", up);
    st.addEventListener("pointercancel", up);
    st.addEventListener("keydown", key);
    draw(performance.now());
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      st.removeEventListener("pointerdown", down);
      st.removeEventListener("pointermove", move);
      st.removeEventListener("pointerup", up);
      st.removeEventListener("pointercancel", up);
      st.removeEventListener("keydown", key);
    };
  }, []);

  return (
    <div
      ref={stage}
      className="card3d-stage"
      tabIndex={0}
      role="img"
      aria-label={`${label}. Drag or use the arrow keys to turn it over.`}
    >
      <div className="card3d-tilt">
        <div ref={card} className="card3d" style={{ transform: "rotateY(-24deg)" }}>
          <div className="card3d-face">{front}</div>
          <div className="card3d-face card3d-back">{back}</div>
        </div>
      </div>
      <div className="card3d-shadow" aria-hidden="true" />
    </div>
  );
}
