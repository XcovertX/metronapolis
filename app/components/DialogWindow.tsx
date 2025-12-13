// app/components/DialogWindow.tsx
"use client";

import { useDialog } from "./DialogContext";

export default function DialogWindow() {
  const { activeNode, chooseResponse, endDialog } = useDialog();

  // ✅ No hooks below this point, so early return is safe
  if (!activeNode) return null;

  const visibleResponses = activeNode.responses; // conditions enforced in DialogContext.chooseResponse

  return (
    <>
      {/* Portrait row */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 190,
          display: "flex",
          justifyContent: "center",
          gap: 12,
          zIndex: 60,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 140,
            height: 80,
            borderRadius: 10,
            border: "1px solid rgba(0,255,255,0.25)",
            background: "rgba(0,0,0,0.75)",
            color: "#f5f5f5",
            fontFamily: "system-ui, sans-serif",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
          }}
        >
          Casper
        </div>

        <div
          style={{
            width: 140,
            height: 80,
            borderRadius: 10,
            border: "1px solid rgba(0,255,255,0.25)",
            background: "rgba(0,0,0,0.75)",
            color: "#f5f5f5",
            fontFamily: "system-ui, sans-serif",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
          }}
        >
          {activeNode.npc}
        </div>
      </div>

      {/* Dialog box */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(0,0,0,0.9)",
          borderTop: "1px solid rgba(0,255,255,0.3)",
          padding: "1.5rem 1.5rem 1.25rem",
          backdropFilter: "blur(6px)",
          fontFamily: "system-ui, sans-serif",
          zIndex: 55,
          color: "#f5f5f5",
        }}
      >
        <div style={{ marginBottom: 8, display: "flex", alignItems: "baseline" }}>
          <h3 style={{ margin: 0, marginRight: 8, fontSize: 16, letterSpacing: 0.5 }}>
            {activeNode.npc}
          </h3>
          <span style={{ fontSize: 11, opacity: 0.6 }}>DIALOG</span>
        </div>

        <p style={{ margin: "0 0 1rem", fontSize: 14, lineHeight: 1.5, opacity: 0.9 }}>
          {activeNode.text}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {visibleResponses.map((response, idx) => (
            <button
              key={idx}
              onClick={() => chooseResponse(response)}
              style={{
                textAlign: "left",
                padding: "0.4rem 0.6rem",
                borderRadius: 6,
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

        <button
          onClick={endDialog}
          style={{
            marginTop: 10,
            fontSize: 11,
            opacity: 0.6,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "#f5f5f5",
          }}
        >
          End conversation
        </button>
      </div>
    </>
  );
}
