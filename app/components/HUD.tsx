// app/components/Hud.tsx
"use client";

import React, { useMemo } from "react";
import { useLoopState } from "./LoopStateContext";
import { getExit, getScene, type Direction } from "../game/sceneGraph";
import OptionsWindow from "./OptionsPanel";

const DIRS: Direction[] = ["n", "e", "s", "w", "up", "down"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(mins: number) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function CornerCut() {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 14,
        height: 14,
        clipPath: "polygon(0 0, 100% 0, 100% 100%)",
        background: "rgba(0,255,210,0.35)",
        boxShadow: "0 0 12px rgba(0,255,210,0.35)",
      }}
    />
  );
}

function MiniMap({ scene }: { scene: string }) {
  const data = useMemo(() => {
    type Node = { id: string; x: number; y: number };

    const start = String(scene);

    const dirDelta: Record<Direction, { dx: number; dy: number }> = {
      n: { dx: 0, dy: -1 },
      e: { dx: 1, dy: 0 },
      s: { dx: 0, dy: 1 },
      w: { dx: -1, dy: 0 },
      up: { dx: 0, dy: 0 },   // handled separately
      down: { dx: 0, dy: 0 }, // handled separately
    };

    // 5x5 grid centered at (0,0) => range -2..2
    const MIN = -2;
    const MAX = 2;

    const visited = new Map<string, { x: number; y: number }>();
    const occupied = new Map<string, string>(); // "x,y" -> sceneId
    const q: Node[] = [{ id: start, x: 0, y: 0 }];

    visited.set(start, { x: 0, y: 0 });
    occupied.set(`0,0`, start);

    // BFS limited to the local bounds
    while (q.length) {
      const cur = q.shift()!;
      for (const d of ["n", "e", "s", "w"] as Direction[]) {
        const next = getExit(cur.id as any, d);
        if (!next) continue;

        const { dx, dy } = dirDelta[d];
        const nx = cur.x + dx;
        const ny = cur.y + dy;

        if (nx < MIN || nx > MAX || ny < MIN || ny > MAX) continue;

        const nextId = String(next);

        // If already placed, don't move it.
        if (visited.has(nextId)) continue;

        // If the cell is already occupied by a different scene, skip placing
        // (prevents collisions in loopy graphs)
        const key = `${nx},${ny}`;
        if (occupied.has(key)) continue;

        visited.set(nextId, { x: nx, y: ny });
        occupied.set(key, nextId);
        q.push({ id: nextId, x: nx, y: ny });
      }
    }

    // Vertical chips
    const up = getExit(start as any, "up");
    const down = getExit(start as any, "down");

    // Build cells for render
    const cells: {
      id: string;
      title: string;
      x: number;
      y: number;
      isCenter: boolean;
    }[] = [];

    for (const [id, pos] of visited.entries()) {
      const def = getScene(id as any);
      cells.push({
        id,
        title: def?.title ?? id,
        x: pos.x,
        y: pos.y,
        isCenter: id === start,
      });
    }

    return { cells, up: up ? String(up) : null, down: down ? String(down) : null, centerId: start };
  }, [scene]);

  const cellAt = (x: number, y: number) =>
    data.cells.find((c) => c.x === x && c.y === y) ?? null;

  const truncate = (t: string, max = 10) =>
    t.length > max ? t.slice(0, max - 1) + "…" : t;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
      <div
        style={{
          position: "relative",
          width: 400,
          height: 400,
          borderRadius: 12,
          border: "1px solid rgba(0,255,210,0.28)",
          background:
            "linear-gradient(180deg, rgba(0,20,18,0.85), rgba(0,0,0,0.85))",
          boxShadow:
            "inset 0 0 0 1px rgba(0,255,210,0.08), 0 0 18px rgba(0,255,210,0.10)",
          overflow: "hidden",
        }}
      >
        {/* faint grid */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,255,210,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,210,0.06) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
            opacity: 0.55,
            mixBlendMode: "screen",
          }}
        />

        {/* 5x5 tiles */}
        <div
          style={{
            position: "absolute",
            inset: 12,
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gridTemplateRows: "repeat(5, 1fr)",
            gap: 8,
          }}
        >
          {[-2, -1, 0, 1, 2].map((y) =>
            [-2, -1, 0, 1, 2].map((x) => {
              const c = cellAt(x, y);
              return (
                <MapTile
                  key={`${x},${y}`}
                  data={c ? { id: c.id, title: c.title } : null}
                  isCenter={!!c?.isCenter}
                  label={c?.isCenter ? "YOU" : c ? truncate(c.title) : ""}
                />
              );
            })
          )}
        </div>

        {/* up/down chips */}
        <div
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            display: "flex",
            gap: 6,
            opacity: 0.95,
          }}
        >
          <Chip active={!!data.up} text="UP" />
          <Chip active={!!data.down} text="DN" />
        </div>

        {/* vignette */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: "inset 0 0 42px rgba(0,0,0,0.75)",
            pointerEvents: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 10, opacity: 0.65, letterSpacing: 1.1 }}>
          LOCAL GRID 5×5
        </div>
        <div style={{ fontSize: 10, opacity: 0.55, letterSpacing: 1.1 }}>
          {truncate(getScene(data.centerId as any)?.title ?? data.centerId, 18)}
        </div>
      </div>
    </div>
  );
}

function MapTile({
  data,
  isCenter,
  label,
}: {
  data: { id: string; title: string } | null;
  isCenter?: boolean;
  label: string;
}) {
  const title = data?.title ?? "";

  return (
    <div
      title={title}
      style={{
        borderRadius: 10,
        border: "1px solid rgba(0,255,210,0.22)",
        background: isCenter
          ? "rgba(255,200,90,0.10)"
          : data
          ? "rgba(0,0,0,0.55)"
          : "rgba(0,0,0,0.22)",
        boxShadow: isCenter
          ? "0 0 14px rgba(255,200,90,0.18), inset 0 0 0 1px rgba(255,200,90,0.10)"
          : data
          ? "inset 0 0 0 1px rgba(0,255,210,0.06)"
          : "none",
        color: isCenter
          ? "rgba(255,200,90,0.95)"
          : "rgba(210,255,245,0.88)",
        fontSize: 10,
        letterSpacing: 0.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "4px 6px",
        opacity: data || isCenter ? 1 : 0.25,
        userSelect: "none",
      }}
    >
      {label}
    </div>
  );
}


function SecondRingPip({
  show,
  x,
  y,
}: {
  show: boolean;
  x: string;
  y: string;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        width: 8,
        height: 8,
        borderRadius: 3,
        border: "1px solid rgba(0,255,210,0.30)",
        background: show ? "rgba(0,255,210,0.28)" : "rgba(255,255,255,0.06)",
        boxShadow: show ? "0 0 10px rgba(0,255,210,0.18)" : "none",
        opacity: show ? 0.95 : 0.25,
      }}
    />
  );
}


function MapPip({
  show,
  x,
  y,
  label,
}: {
  show: boolean;
  x: string;
  y: string;
  label: string;
}) {
  const opacity = show ? 1 : 0.15;
  return (
    <div
      title={show ? `Exit ${label}` : `No exit ${label}`}
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        width: 18,
        height: 18,
        borderRadius: 6,
        border: "1px solid rgba(0,255,210,0.35)",
        background: "rgba(0,0,0,0.55)",
        boxShadow: show ? "0 0 12px rgba(0,255,210,0.25)" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        letterSpacing: 1,
        opacity,
      }}
    >
      {label}
    </div>
  );
}

function Chip({ active, text }: { active: boolean; text: string }) {
  return (
    <span
      style={{
        padding: "2px 7px",
        borderRadius: 999,
        border: "1px solid rgba(0,255,210,0.30)",
        background: active ? "rgba(0,255,210,0.10)" : "rgba(0,0,0,0.35)",
        boxShadow: active ? "0 0 12px rgba(0,255,210,0.18)" : "none",
        fontSize: 10,
        letterSpacing: 1,
        opacity: active ? 1 : 0.55,
      }}
    >
      {text}
    </span>
  );
}

export default function Hud() {
  const { scene, sceneDef, timeMinutes, loopCount, inventory, credits } = useLoopState();

  const inv = inventory ?? [];

  // Small “signal jitter” for the CRT feel (pure CSS, no re-render needed)
  const jitter = useMemo(() => clamp(((timeMinutes * 37) % 10) / 100, 0, 0.09), [timeMinutes]);

  return (
    <>
      {/* HUD container */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 50,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          color: "rgba(210,255,245,0.92)",
        }}
      >
        {/* CRT scanlines + bloom */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "1px 3px",
            opacity: 0.22,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(0,255,210,0.10), transparent 55%), radial-gradient(ellipse at 20% 10%, rgba(255,200,90,0.06), transparent 40%)",
            opacity: 0.9,
            pointerEvents: "none",
          }}
        />

        {/* Top bar */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            right: 14,
            display: "flex",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <HudPanel style={{ flex: 1, minHeight: 56 }}>
            <CornerCut />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 1.2, opacity: 0.65 }}>
                  LOCATION
                </div>
                <div
                  style={{
                    fontSize: 14,
                    letterSpacing: 0.6,
                    textShadow: "0 0 10px rgba(0,255,210,0.20)",
                  }}
                >
                  {sceneDef?.title ?? scene}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, letterSpacing: 1.2, opacity: 0.65 }}>
                  RETINABAND TIME
                </div>
                <div
                  style={{
                    fontSize: 18,
                    letterSpacing: 1.6,
                    color: "rgba(255,200,90,0.95)",
                    textShadow: `0 0 18px rgba(255,200,90,0.35)`,
                    transform: `translateX(${jitter}px)`,
                  }}
                >
                  {formatTime(timeMinutes)}
                </div>
              </div>
            </div>

            {/* thin divider line */}
            <div
              aria-hidden
              style={{
                marginTop: 10,
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(0,255,210,0.35), transparent)",
                opacity: 0.8,
              }}
            />
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                letterSpacing: 1,
                opacity: 0.7,
              }}
            >
              <span>LOOP {loopCount}</span>
              <span>SCENE ID: {scene}</span>
            </div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                letterSpacing: 1,
                opacity: 0.75,
              }}
            >
              <span>CREDITS: {credits}</span>
              <span>INV: {inventory.length}</span>
            </div>
          </HudPanel>

          <HudPanel style={{ width: 440 }}>
            <CornerCut />
            <div style={{ fontSize: 10, letterSpacing: 1.2, opacity: 0.65, marginBottom: 10 }}>
              MINIMAP
            </div>
            <MiniMap scene={scene} />
          </HudPanel>
        </div>

        {/* Inventory panel */}
        <div
          style={{
            position: "absolute",
            bottom: 300,
            left: 14,
            width: 380,
          }}
        >
          <HudPanel>
            <CornerCut />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 10, letterSpacing: 1.2, opacity: 0.65 }}>
                INVENTORY
              </div>
              <div style={{ fontSize: 10, letterSpacing: 1, opacity: 0.55 }}>
                {inv.length} ITEMS
              </div>
            </div>

            <div
              style={{
                marginTop: 10,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {inv.length === 0 ? (
                <span style={{ fontSize: 12, opacity: 0.65 }}>
                  (empty)
                </span>
              ) : (
                inv.map((item) => (
                  <span
                    key={item.id}
                    title={item.description}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 8px",
                      borderRadius: 10,
                      border: "1px solid rgba(0,255,210,0.25)",
                      background: "rgba(0,0,0,0.45)",
                      boxShadow: "inset 0 0 0 1px rgba(0,255,210,0.08)",
                      fontSize: 12,
                      letterSpacing: 0.3,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 2,
                        background: "rgba(0,255,210,0.75)",
                        boxShadow: "0 0 10px rgba(0,255,210,0.25)",
                      }}
                    />
                    {item.name}
                  </span>
                ))
              )}
            </div>
          </HudPanel>
          
        </div>

        {/* Right-side status strip */}
        <div
          style={{
            position: "absolute",
            bottom: 330,
            right: 14,
            width: 260,
          }}
        >
          <HudPanel>
            <CornerCut />
            <div style={{ fontSize: 10, letterSpacing: 1.2, opacity: 0.65 }}>
              SYSTEM
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              <StatusRow k="SIGNAL" v="STABLE" accent="good" />
              <StatusRow k="TRACE" v="ACTIVE" accent="warn" />
              <StatusRow k="OVERSIGHT" v="UNKNOWN" accent="dim" />
            </div>

            <div
              aria-hidden
              style={{
                marginTop: 12,
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(0,255,210,0.28), transparent)",
              }}
            />
            <div style={{ marginTop: 10, fontSize: 10, opacity: 0.7, letterSpacing: 1 }}>
              HUD v0.1 • CRT MODE
            </div>
          </HudPanel>
          <OptionsWindow />
        </div>
      </div>

      {/* local styles */}
      <style jsx global>{`
        /* Subtle CRT shimmer */
        @keyframes hudFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.98; }
        }
      `}</style>
      
    </>
  );
}

function HudPanel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        pointerEvents: "none",
        borderRadius: 14,
        padding: "0.9rem 1rem",
        border: "1px solid rgba(0,255,210,0.30)",
        background:
          "linear-gradient(180deg, rgba(0,10,10,0.70), rgba(0,0,0,0.78))",
        boxShadow:
          "inset 0 0 0 1px rgba(0,255,210,0.08), 0 0 22px rgba(0,255,210,0.10)",
        backdropFilter: "blur(6px)",
        animation: "hudFlicker 2.8s infinite",
        ...style,
      }}
    >
      {/* inner bezel */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 8,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}

function StatusRow({
  k,
  v,
  accent,
}: {
  k: string;
  v: string;
  accent: "good" | "warn" | "dim";
}) {
  const color =
    accent === "good"
      ? "rgba(0,255,210,0.95)"
      : accent === "warn"
      ? "rgba(255,200,90,0.95)"
      : "rgba(210,255,245,0.55)";

  const glow =
    accent === "dim"
      ? "none"
      : `0 0 12px ${accent === "good" ? "rgba(0,255,210,0.25)" : "rgba(255,200,90,0.22)"}`;

  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
      <span style={{ fontSize: 10, opacity: 0.65, letterSpacing: 1.2 }}>{k}</span>
      <span style={{ fontSize: 11, letterSpacing: 1.4, color, textShadow: glow }}>{v}</span>
    </div>
  );
}
