// app/components/DialogWindow.tsx
"use client";

import { useDialog } from "./DialogContext";

export default function DialogWindow() {
  const { activeNode, chooseResponse, endDialog } = useDialog();

  if (!activeNode) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(0,0,0,0.85)",
        borderTop: "1px solid rgba(0,255,255,0.2)",
        padding: "1.5rem",
        animation: "slideUp 0.2s ease",
      }}
    >
      <h3>{activeNode.npc}</h3>
      <p style={{ margin: "0.5rem 0 1rem", opacity: 0.85 }}>{activeNode.text}</p>

      {activeNode.responses.map((r, i) => (
        <button
          key={i}
          onClick={() => chooseResponse(r)}
          style={{
            display: "block",
            width: "100%",
            marginBottom: 8,
            textAlign: "left",
          }}
        >
          {r.label}
        </button>
      ))}

      <button
        onClick={endDialog}
        style={{
          marginTop: 12,
          opacity: 0.6,
          fontSize: 12,
        }}
      >
        End conversation
      </button>
    </div>
  );
}
