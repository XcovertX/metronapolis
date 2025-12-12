// app/components/DebugOverlay.tsx
"use client";

import { useState } from "react";
import { useLoopState } from "./LoopStateContext";
import { useDialog } from "./DialogContext";

export default function DebugOverlay() {
  const [open, setOpen] = useState(false);
  const { scene, timeMinutes, flags, inventory } = useLoopState();
  const { activeNode } = useDialog();

  const timeStr = (() => {
    const h = Math.floor(timeMinutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (timeMinutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  })();

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 12,
          right: 12,
          zIndex: 50,
          fontSize: 10,
          padding: "4px 6px",
          borderRadius: 4,
          border: "1px solid rgba(0,255,255,0.4)",
          background: "rgba(0,0,0,0.7)",
          color: "#e5e5e5",
          fontFamily: "monospace",
          cursor: "pointer",
          opacity: 0.7,
        }}
      >
        {open ? "DBG–ON" : "DBG"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            top: 36,
            left: 12,
            zIndex: 49,
            width: 260,
            maxHeight: 220,
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid rgba(0,255,255,0.3)",
            background: "rgba(0,0,0,0.9)",
            color: "#f5f5f5",
            fontFamily: "monospace",
            fontSize: 11,
            overflow: "auto",
          }}
        >
          <div
            style={{
              fontSize: 10,
              opacity: 0.7,
              marginBottom: 4,
            }}
          >
            DEBUG OVERLAY
          </div>

          <div style={{ marginBottom: 4 }}>
            <strong>scene:</strong> {scene}
          </div>
          <div style={{ marginBottom: 4 }}>
            <strong>time:</strong> {timeStr} ({timeMinutes}m)
          </div>

          <div style={{ marginBottom: 4 }}>
            <strong>flags:</strong>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
{JSON.stringify(flags, null, 2)}
            </pre>
          </div>

          <div style={{ marginBottom: 4 }}>
            <strong>inventory:</strong>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
{JSON.stringify(inventory, null, 2)}
            </pre>
          </div>

          <div>
            <strong>dialog:</strong>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
{activeNode ? activeNode.id : "null"}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
