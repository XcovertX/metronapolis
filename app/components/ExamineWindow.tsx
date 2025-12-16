// app/components/ExamineWindow.tsx
"use client";

import { useExamine } from "./ExamineContext";
import Image from "next/image";

export default function ExamineWindow() {
  const { active, closeExamine } = useExamine();

  if (!active) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
      }}
      onClick={closeExamine}
    >
      <div
        style={{
          minWidth: 260,
          maxWidth: 360,
          padding: "1rem 1.25rem",
          borderRadius: 8,
          border: "1px solid rgba(0,255,255,0.4)",
          background: "rgba(0,0,0,0.95)",
          color: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
          boxShadow: "0 0 12px rgba(0,0,0,0.9)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontSize: 12,
            opacity: 0.6,
            marginBottom: 4,
          }}
        >
          LOOK CLOSER
        </div>
        <Image
          src={active.image || "/placeholders/item-placeholder.png"}
          alt={active.title}
          priority

          width={256}
          height={256}
          style={{
            objectFit: "contain",
            backgroundColor: "black",
            imageRendering: "pixelated",
          }}
        />
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            marginBottom: 8,
          }}
        >
          {active.title}
        </h3>
        
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {active.body}
        </p>

        <button
          onClick={closeExamine}
          style={{
            marginTop: 12,
            fontSize: 11,
            borderRadius: 4,
            border: "1px solid rgba(0,255,255,0.4)",
            background: "rgba(0,0,0,0.8)",
            color: "#e5e5e5",
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
