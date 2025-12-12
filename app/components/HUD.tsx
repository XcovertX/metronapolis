// app/components/HUD.tsx
"use client";

import { useLoopState } from "./LoopStateContext";
import MiniMap from "./MiniMap";

function formatTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const h = hours.toString().padStart(2, "0");
  const m = minutes.toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default function HUD() {
  const { timeMinutes, inventory } = useLoopState();
  const timeStr = formatTime(timeMinutes);

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 16,
        padding: "8px 10px 10px",
        borderRadius: 8,
        border: "1px solid rgba(0,255,255,0.3)",
        background:
          "radial-gradient(circle at top left, rgba(0,255,255,0.18), rgba(0,0,0,0.9))",
        fontFamily: "monospace",
        fontSize: 13,
        letterSpacing: 0.5,
        textShadow: "0 0 4px rgba(0,255,255,0.5)",
        maxWidth: 220,
      }}
    >
      <div
        style={{
          fontSize: 10,
          opacity: 0.7,
          textAlign: "right",
          marginBottom: 2,
        }}
      >
        RETINABAND
      </div>
      <div
        style={{
          fontSize: 18,
          marginBottom: 6,
          textAlign: "right",
        }}
      >
        {timeStr}
      </div>

      <div
        style={{
          fontSize: 10,
          opacity: 0.7,
          marginBottom: 2,
        }}
      >
        INV
      </div>

      {inventory.length === 0 ? (
        <div
          style={{
            fontSize: 11,
            opacity: 0.55,
          }}
        >
          (empty)
        </div>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            fontSize: 11,
            maxHeight: 80,
            overflow: "hidden",
          }}
        >
          {inventory.map((item) => (
            <li
              key={item.id}
              style={{
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
              title={item.description || item.name}
            >
              • {item.name}
            </li>
          ))}
        </ul>
      )}
       <MiniMap />
    </div>
  );
}
