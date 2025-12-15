// app/components/Hud.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useLoopState } from "./LoopStateContext";
import { type Direction } from "../game/sceneGraph";
import OptionsWindow from "./OptionsPanel";
import Minimap_ALT from "./Minimap_ALT";
import InventoryPopup from "./InventoryPopup";

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
      className="absolute right-0 top-0 h-[14px] w-[14px] [clip-path:polygon(0_0,100%_0,100%_100%)] bg-[rgba(0,255,210,0.35)] shadow-[0_0_12px_rgba(0,255,210,0.35)]"
    />
  );
}

export default function Hud() {
  const { scene, sceneDef, timeMinutes, loopCount, inventory, credits, flags } =
    useLoopState();

  const [invOpen, setInvOpen] = useState(false);

  // Small “signal jitter” for the CRT feel (pure CSS, no re-render needed)
  const jitter = useMemo(
    () => clamp(((timeMinutes * 37) % 10) / 100, 0, 0.09),
    [timeMinutes]
  );

  return (
    <>
      {/* HUD container */}
      <div className="fixed inset-0 z-50 pointer-events-none font-mono text-[rgba(210,255,245,0.92)]">
        {/* CRT scanlines + bloom */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.22] mix-blend-overlay [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:1px_3px]"
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.9] [background:radial-gradient(ellipse_at_center,rgba(0,255,210,0.10),transparent_55%),radial-gradient(ellipse_at_20%_10%,rgba(255,200,90,0.06),transparent_40%)]"
        />

        {/* Top bar */}
        <div className="absolute left-[14px] right-[14px] top-[14px] flex w-[270px] flex-col items-stretch gap-3">
          <HudPanel>
            <CornerCut />
            <div className="mb-[10px] text-[10px] tracking-[1.2px] opacity-65">
              MINIMAP
            </div>
            <Minimap_ALT
              currentId={scene}
              windowPx={50}
              isVisibleScene={(id) => {
                // hide neighbor apartment until unlocked
                if (
                  id === "neighbor-foyer" ||
                  id === "neighbor-living" ||
                  id === "neighbor-bedroom" ||
                  id === "neighbor-kitchen" ||
                  id === "neighbor-bath"
                ) {
                  return !!flags.neighborDoorUnlocked;
                }
                return true;
              }}
            />
          </HudPanel>

          <HudPanel className="flex-1 min-h-[300px]">
            <CornerCut />

            <div className="flex justify-between gap-3">
              <div>
                <div className="text-[10px] tracking-[1.2px] opacity-65">
                  LOCATION
                </div>
                <div className="text-[8px] tracking-[0.6px] [text-shadow:0_0_10px_rgba(0,255,210,0.20)]">
                  {sceneDef?.title ?? scene}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] tracking-[1.2px] opacity-65">
                  TIME
                </div>
                <div
                  className="text-[10px] tracking-[1.6px] text-[rgba(255,200,90,0.95)] [text-shadow:0_0_18px_rgba(255,200,90,0.35)]"
                  style={{ transform: `translateX(${jitter}px)` }}
                >
                  {formatTime(timeMinutes)}
                </div>
              </div>
            </div>

            {/* thin divider line */}
            <div
              aria-hidden
              className="mt-[10px] h-px opacity-80 [background:linear-gradient(90deg,transparent,rgba(0,255,210,0.35),transparent)]"
            />

            <div className="mt-2 flex justify-between text-[10px] tracking-[1px] opacity-70">
              <span>LOOP {loopCount}</span>
              <span>SCENE ID: {scene}</span>
            </div>

            <div className="mt-[6px] flex justify-between text-[10px] tracking-[1px] opacity-75">
              <span>CREDITS: {credits}</span>
              <span>INV: {inventory.length}</span>
            </div>

            <div className="mt-5 flex flex-col gap-[30px]">
              <button
                onClick={() => setInvOpen(true)}
                className="pointer-events-auto cursor-pointer rounded-[10px] border border-[rgba(0,255,210,0.25)] bg-[rgba(0,0,0,0.55)] px-[10px] py-2 text-[11px] tracking-[1px] uppercase text-[rgba(210,255,245,0.95)]"
              >
                Inventory
              </button>
            </div>
            <div className="mt-5 flex flex-col gap-[30px]">
              <button
                onClick={() => setInvOpen(true)}
                className="pointer-events-auto cursor-pointer rounded-[10px] border border-[rgba(0,255,210,0.25)] bg-[rgba(0,0,0,0.55)] px-[10px] py-15 text-[11px] tracking-[1px] uppercase text-[rgba(210,255,245,0.95)]"
              >
                WEAPON
              </button>
            </div>
          </HudPanel>

          <HudPanel>
            <CornerCut />
            <div className="text-[10px] tracking-[1.2px] opacity-65">
              SYSTEM
            </div>

            <div className="mt-[10px] grid gap-2">
              <StatusRow k="SIGNAL" v="STABLE" accent="good" />
              <StatusRow k="TRACE" v="ACTIVE" accent="warn" />
              <StatusRow k="OVERSIGHT" v="UNKNOWN" accent="dim" />
            </div>

            <div
              aria-hidden
              className="mt-3 h-px [background:linear-gradient(90deg,transparent,rgba(0,255,210,0.28),transparent)]"
            />

            <div className="mt-[10px] text-[10px] tracking-[1px] opacity-70">
              HUD v0.1 • CRT MODE
            </div>
          </HudPanel>
        </div>

        {/* Right-side status strip */}
        <div className="absolute bottom-[330px] left-[14px] w-[260px]">
          <OptionsWindow />
        </div>
      </div>

      {/* local styles */}
      <style jsx global>{`
        /* Subtle CRT shimmer */
        @keyframes hudFlicker {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.98;
          }
        }
      `}</style>

      <InventoryPopup open={invOpen} onClose={() => setInvOpen(false)} />
    </>
  );
}

function HudPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative pointer-events-none rounded-[14px] border border-[rgba(0,255,210,0.30)]",
        "bg-[linear-gradient(180deg,rgba(0,10,10,0.70),rgba(0,0,0,0.78))]",
        "shadow-[inset_0_0_0_1px_rgba(0,255,210,0.08),0_0_22px_rgba(0,255,210,0.10)]",
        "backdrop-blur-[6px]",
        "animate-[hudFlicker_2.8s_infinite]",
        "px-4 py-[0.9rem]",
        className,
      ].join(" ")}
    >
      {/* inner bezel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-2 rounded-[10px] border border-[rgba(255,255,255,0.05)]"
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
  const vClass =
    accent === "good"
      ? "text-[rgba(0,255,210,0.95)] [text-shadow:0_0_12px_rgba(0,255,210,0.25)]"
      : accent === "warn"
      ? "text-[rgba(255,200,90,0.95)] [text-shadow:0_0_12px_rgba(255,200,90,0.22)]"
      : "text-[rgba(210,255,245,0.55)]";

  return (
    <div className="flex justify-between gap-[10px]">
      <span className="text-[10px] tracking-[1.2px] opacity-65">{k}</span>
      <span className={["text-[11px] tracking-[1.4px]", vClass].join(" ")}>
        {v}
      </span>
    </div>
  );
}
