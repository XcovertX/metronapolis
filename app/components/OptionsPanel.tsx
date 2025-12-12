// app/components/OptionsPanel.tsx
"use client";

import { useOptions } from "./OptionsContext";

export default function OptionsPanel() {
  const { options } = useOptions();

  if (!options.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        zIndex: 40,
        maxWidth: 260,
        borderRadius: 8,
        border: "1px solid rgba(0,255,255,0.35)",
        background: "rgba(0,0,0,0.9)",
        padding: "0.5rem 0.6rem 0.6rem",
        fontFamily: "system-ui, sans-serif",
        color: "#f5f5f5",
        boxShadow: "0 0 10px rgba(0,0,0,0.8)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          opacity: 0.65,
          marginBottom: 4,
          letterSpacing: 0.5,
        }}
      >
        OPTIONS
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={opt.onSelect}
            style={{
              textAlign: "left",
              padding: "0.35rem 0.5rem",
              borderRadius: 4,
              border: "1px solid rgba(0,255,255,0.25)",
              background: "rgba(0,0,0,0.7)",
              color: "#f5f5f5",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
