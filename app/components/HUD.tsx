// app/components/HUD.tsx
"use client";

import { useLoopState } from "./LoopStateContext";

function formatTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const h = hours.toString().padStart(2, "0");
  const m = minutes.toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default function HUD() {
  const { timeMinutes } = useLoopState();
  const timeStr = formatTime(timeMinutes);

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 16,
        padding: "6px 10px",
        borderRadius: 6,
        border: "1px solid rgba(0,255,255,0.3)",
        background:
          "radial-gradient(circle at top left, rgba(0,255,255,0.15), rgba(0,0,0,0.85))",
        fontFamily: "monospace",
        fontSize: 14,
        letterSpacing: 1,
        textShadow: "0 0 4px rgba(0,255,255,0.5)",
      }}
    >
      <div style={{ fontSize: 10, opacity: 0.7, textAlign: "right" }}>
        RETINABAND
      </div>
      <div>{timeStr}</div>
    </div>
  );
}
