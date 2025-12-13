// app/components/MiniMap.tsx
"use client";

import React, { useMemo } from "react";
import { useLoopState } from "./LoopStateContext";
import { sceneGraph, getExits, type SceneId } from "../game/sceneGraph";

type Cell = {
  id: SceneId;
  title: string;
  dx: number;
  dy: number;
};

export default function MiniMap() {
  const { scene, sceneDef } = useLoopState();

  // how many tiles out from center to show
  const R = 2; // 5x5 grid

  const cells = useMemo(() => {
    const { x: cx, y: cy, z: cz } = sceneDef;

    const out: Cell[] = [];
    (Object.keys(sceneGraph) as SceneId[]).forEach((id) => {
      const s = sceneGraph[id];
      if (s.z !== cz) return;

      const dx = s.x - cx;
      const dy = s.y - cy;

      if (Math.abs(dx) <= R && Math.abs(dy) <= R) {
        out.push({ id, title: s.title, dx, dy });
      }
    });

    return out;
  }, [sceneDef]);

  const exits = useMemo(() => getExits(scene), [scene]);

  const size = 120; // map box size
  const grid = 2 * R + 1; // 5
  const cellPx = Math.floor(size / grid);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        border: "1px solid rgba(0,255,255,0.35)",
        background: "rgba(0,0,0,0.85)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), " +
            "linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: `${cellPx}px ${cellPx}px`,
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />

      {/* cells */}
      {cells.map((c) => {
        const gx = c.dx + R; // 0..4
        const gy = R - c.dy; // invert so +y is north/up on screen

        const left = gx * cellPx;
        const top = gy * cellPx;

        const isYou = c.id === scene;

        return (
          <div
            key={c.id}
            title={c.title}
            style={{
              position: "absolute",
              left,
              top,
              width: cellPx,
              height: cellPx,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              border: isYou
                ? "1px solid rgba(0,255,255,0.9)"
                : "1px solid rgba(0,255,255,0.18)",
              background: isYou
                ? "rgba(0,255,255,0.18)"
                : "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.85)",
              fontSize: 10,
              userSelect: "none",
            }}
          >
            {isYou ? "●" : "·"}
          </div>
        );
      })}

      {/* center crosshair */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 2,
          height: 2,
          background: "rgba(0,255,255,0.75)",
          transform: "translate(-50%, -50%)",
          borderRadius: 2,
          pointerEvents: "none",
        }}
      />

      {/* Floor indicator + vertical exits */}
      <div
        style={{
          position: "absolute",
          left: 6,
          top: 6,
          fontSize: 10,
          opacity: 0.75,
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        <span>z:{sceneDef.z}</span>
        {exits.up && <span title="Up available">↑</span>}
        {exits.down && <span title="Down available">↓</span>}
      </div>
    </div>
  );
}
