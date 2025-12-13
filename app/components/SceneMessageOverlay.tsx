// app/components/SceneMessageOverlay.tsx
"use client";

import { useEffect } from "react";
import { useLoopState } from "./LoopStateContext";

export default function SceneMessageOverlay() {
  const { sceneMessages, clearSceneMessages } = useLoopState();

  useEffect(() => {
    if (!sceneMessages.length) return;
    const t = setTimeout(() => clearSceneMessages(), 3500);
    return () => clearTimeout(t);
  }, [sceneMessages, clearSceneMessages]);

  if (!sceneMessages.length) return null;

  const last = sceneMessages[sceneMessages.length - 1];

  return (
    <div
      style={{
        position: "fixed",
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 80,
        width: "92%",
        maxWidth: 520,
        background: "rgba(0,0,0,0.75)",
        border: "1px solid rgba(0,255,255,0.25)",
        borderRadius: 12,
        padding: "0.7rem 0.9rem",
        color: "#f5f5f5",
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        backdropFilter: "blur(6px)",
        boxShadow: "0 0 18px rgba(0,0,0,0.85)",
        pointerEvents: "none",
      }}
    >
      {last}
    </div>
  );
}
