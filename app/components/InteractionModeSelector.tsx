// app/components/InteractionModeSelector.tsx
"use client";

import React from "react";
import { useInteractionMode, type InteractionMode } from "./InteractionModeContext";

type ModeConfig = {
  id: Exclude<InteractionMode, null>;
  label: string;
  icon: string;
  description: string;
  color: string;
  glowColor: string;
};

const MODES: ModeConfig[] = [
  {
    id: "walk",
    label: "WALK",
    icon: "→",
    description: "Move to locations",
    color: "rgba(0,255,210,0.95)",
    glowColor: "rgba(0,255,210,0.35)",
  },
  {
    id: "examine",
    label: "EXAMINE",
    icon: "◉",
    description: "Inspect objects",
    color: "rgba(255,200,90,0.95)",
    glowColor: "rgba(255,200,90,0.35)",
  },
  {
    id: "talk",
    label: "TALK",
    icon: "◈",
    description: "Speak with NPCs",
    color: "rgba(150,200,255,0.95)",
    glowColor: "rgba(150,200,255,0.35)",
  },
  {
    id: "take",
    label: "TAKE",
    icon: "⊕",
    description: "Collect items",
    color: "rgba(255,150,200,0.95)",
    glowColor: "rgba(255,150,200,0.35)",
  },
];

export default function InteractionModeSelector() {
  const { mode, toggle } = useInteractionMode();

  return (
    <div className="pointer-events-auto">
      {/* Panel container */}
      <div
        className="relative rounded-[14px] border border-[rgba(0,255,210,0.30)]
          bg-[linear-gradient(180deg,rgba(0,10,10,0.70),rgba(0,0,0,0.78))]
          shadow-[inset_0_0_0_1px_rgba(0,255,210,0.08),0_0_22px_rgba(0,255,210,0.10)]
          backdrop-blur-[6px]
          px-4 py-[0.9rem]"
      >
        {/* Corner cut decoration */}
        <span
          aria-hidden
          className="absolute right-0 top-0 h-[14px] w-[14px] [clip-path:polygon(0_0,100%_0,100%_100%)] bg-[rgba(0,255,210,0.35)] shadow-[0_0_12px_rgba(0,255,210,0.35)]"
        />

        {/* Inner bezel */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 rounded-[10px] border border-[rgba(255,255,255,0.05)]"
        />

        {/* Header */}
        <div className="mb-[12px] text-[10px] tracking-[1.2px] opacity-65 font-mono text-[rgba(210,255,245,0.92)]">
          INTERACTION MODE
        </div>

        {/* Mode buttons */}
        <div className="flex flex-col gap-2">
          {MODES.map((modeConfig) => {
            const isActive = mode === modeConfig.id;
            return (
              <button
                key={modeConfig.id}
                onClick={() => toggle(modeConfig.id)}
                className={`
                  relative flex items-center gap-3 rounded-[8px] border px-3 py-2
                  font-mono text-[11px] tracking-[1px] uppercase
                  transition-all duration-200
                  ${
                    isActive
                      ? "border-current bg-[rgba(0,0,0,0.65)]"
                      : "border-[rgba(255,255,255,0.15)] bg-[rgba(0,0,0,0.35)] hover:bg-[rgba(0,0,0,0.50)]"
                  }
                `}
                style={{
                  color: isActive ? modeConfig.color : "rgba(210,255,245,0.75)",
                  textShadow: isActive ? `0 0 12px ${modeConfig.glowColor}` : "none",
                  boxShadow: isActive
                    ? `inset 0 0 20px ${modeConfig.glowColor}, 0 0 15px ${modeConfig.glowColor}`
                    : "none",
                }}
              >
                {/* Icon */}
                <span
                  className="text-[16px] leading-none"
                  style={{
                    textShadow: isActive ? `0 0 18px ${modeConfig.glowColor}` : "none",
                  }}
                >
                  {modeConfig.icon}
                </span>

                {/* Label and description */}
                <div className="flex flex-col items-start gap-[2px]">
                  <span className="font-bold">{modeConfig.label}</span>
                  <span
                    className="text-[8px] tracking-[0.6px] opacity-70"
                    style={{ color: "rgba(210,255,245,0.65)" }}
                  >
                    {modeConfig.description}
                  </span>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full animate-pulse"
                    style={{
                      backgroundColor: modeConfig.color,
                      boxShadow: `0 0 10px ${modeConfig.glowColor}`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Current mode display */}
        <div
          className="mt-3 pt-3 border-t border-[rgba(0,255,210,0.20)]
            text-[9px] tracking-[1px] opacity-60 font-mono text-[rgba(210,255,245,0.92)]"
        >
          {mode ? (
            <>
              ACTIVE: <span className="opacity-100">{mode.toUpperCase()}</span>
            </>
          ) : (
            "NO MODE SELECTED"
          )}
        </div>
      </div>
    </div>
  );
}
