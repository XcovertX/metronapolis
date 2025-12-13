// app/components/DialogWindow.tsx
"use client";

import { useDialog } from "./DialogContext";

export default function DialogWindow() {
  const { activeNode, chooseResponse, endDialog } = useDialog();

  if (!activeNode) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={endDialog}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 70,
        }}
      />

      {/* Dialog modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "92%",
          maxWidth: 560,
          background: "rgba(0,0,0,0.92)",
          border: "1px solid rgba(0,255,255,0.35)",
          borderRadius: 14,
          padding: "1.25rem 1.5rem 1.5rem",
          zIndex: 75,
          color: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
          boxShadow: "0 0 30px rgba(0,0,0,0.9)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Portraits */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 72,
              borderRadius: 10,
              border: "1px solid rgba(0,255,255,0.25)",
              background: "rgba(0,0,0,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              opacity: 0.9,
            }}
          >
            Casper
          </div>

          <div
            style={{
              flex: 1,
              height: 72,
              borderRadius: 10,
              border: "1px solid rgba(0,255,255,0.25)",
              background: "rgba(0,0,0,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              opacity: 0.9,
            }}
          >
            {activeNode.npc}
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: 0.6,
              opacity: 0.6,
            }}
          >
            DIALOG
          </span>
        </div>

        {/* Text */}
        <p
          style={{
            margin: "0 0 1rem",
            fontSize: 14,
            lineHeight: 1.55,
            opacity: 0.95,
          }}
        >
          {activeNode.text}
        </p>

        {/* Responses */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {activeNode.responses.map((response, idx) => (
            <button
              key={idx}
              onClick={() => chooseResponse(response)}
              style={{
                textAlign: "left",
                padding: "0.55rem 0.75rem",
                borderRadius: 8,
                border: "1px solid rgba(0,255,255,0.25)",
                background: "rgba(0,0,0,0.7)",
                color: "#f5f5f5",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {response.label}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 12, textAlign: "right" }}>
          <button
            onClick={endDialog}
            style={{
              fontSize: 11,
              opacity: 0.6,
              background: "transparent",
              border: "none",
              color: "#f5f5f5",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
