"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Point = { x: number; y: number };

type CasperWalkerProps = {
  /** path to your sprite sheet */
  sheetSrc: string; // e.g. "/sprites/casper_walk.png"
  /** starting position in px (screen coordinates) */
  start?: Point;
  /** pixels per second */
  speedPxPerSec?: number;
  /** frames per second for walking animation */
  walkFps?: number;

  /** sprite sheet metadata */
  frameCount?: number; // default 8
  frameW?: number;     // default 256
  frameH?: number;     // default 256
  /** last frame index is standing */
  standingFrameIndex?: number; // default 7
};

export default function CasperWalker({
  sheetSrc,
  start = { x: 280, y: 420 },
  speedPxPerSec = 260,
  walkFps = 12,
  frameCount = 8,
  frameW = 256,
  frameH = 256,
  standingFrameIndex = 7,
}: CasperWalkerProps) {
  const [pos, setPos] = useState<Point>(start);
  const [target, setTarget] = useState<Point | null>(null);

  const [frame, setFrame] = useState<number>(standingFrameIndex);
  const [facing, setFacing] = useState<1 | -1>(1);

  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number>(0);

  // Separate timers so movement + anim are consistent
  const animAccRef = useRef<number>(0);

  const walking = !!target;

  // Click-to-move: attach to whole window, or replace with a specific container ref if you prefer.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // ignore right-click
      if (e.button !== 0) return;

      const next = { x: e.clientX, y: e.clientY };
      setTarget(next);
      setFrame(0); // start walking frames
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!walking) {
      // ensure standing frame when idle
      setFrame(standingFrameIndex);
      return;
    }

    const tick = (t: number) => {
      if (!lastTRef.current) lastTRef.current = t;
      const dt = Math.min(0.05, (t - lastTRef.current) / 1000); // clamp dt
      lastTRef.current = t;

      setPos((p) => {
        const dest = target!;
        const dx = dest.x - p.x;
        const dy = dest.y - p.y;

        // face left/right
        if (Math.abs(dx) > 2) setFacing(dx >= 0 ? 1 : -1);

        const dist = Math.hypot(dx, dy);
        const stopDist = 2; // pixels

        if (dist <= stopDist) {
          // arrived
          setTarget(null);
          setFrame(standingFrameIndex);
          return dest;
        }

        const step = speedPxPerSec * dt;
        const ratio = step / dist;

        const nx = p.x + dx * Math.min(1, ratio);
        const ny = p.y + dy * Math.min(1, ratio);
        return { x: nx, y: ny };
      });

      // walk frame cycling (0..standingFrameIndex-1)
      animAccRef.current += dt;
      const frameInterval = 1 / walkFps;

      if (animAccRef.current >= frameInterval) {
        animAccRef.current -= frameInterval;

        setFrame((f) => {
          // keep frame in walking range only while moving
          const walkMax = Math.max(0, standingFrameIndex - 1);
          const next = (f + 1) % (walkMax + 1);
          return next;
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTRef.current = 0;
      animAccRef.current = 0;
    };
  }, [walking, target, speedPxPerSec, walkFps, standingFrameIndex]);

  const bgX = useMemo(() => -(frame * frameW), [frame, frameW]);

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      <div
        aria-label="Casper"
        style={{
          position: "absolute",
          left: pos.x - frameW / 2,
          top: pos.y - frameH, // anchors “feet” roughly at click point
          width: frameW,
          height: frameH,

          backgroundImage: `url(${sheetSrc})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: `${bgX}px 0px`,
          backgroundSize: `${frameW * frameCount}px ${frameH}px`,

          imageRendering: "pixelated",

          transform: `scaleX(${facing})`,
          transformOrigin: "center center",

          // optional little glow for CRT vibe
          filter: "drop-shadow(0 0 10px rgba(0,255,210,0.15))",
        }}
      />
    </div>
  );
}
