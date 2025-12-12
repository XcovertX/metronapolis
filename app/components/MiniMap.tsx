// app/components/MiniMap.tsx
"use client";

import { mapNodes } from "../map/mapConfig";
import { useLoopState } from "./LoopStateContext";

export default function MiniMap() {
  const { scene, flags } = useLoopState();
  const currentNode = mapNodes[scene];

  // If the scene isn't on the map yet, show a little warning box instead of nothing
  if (!currentNode) {
    return (
      <div
        style={{
          padding: "6px 8px",
          marginBottom: "0.5rem",
          border: "1px solid rgba(255,0,0,0.4)",
          borderRadius: 8,
          background: "rgba(0,0,0,0.7)",
          color: "#f5f5f5",
          fontFamily: "monospace",
          fontSize: 10,
          display: "inline-block",
        }}
      >
        <div style={{ fontSize: 9, opacity: 0.7, marginBottom: 2 }}>
          LOCAL MAP
        </div>
        <div style={{ fontSize: 9, opacity: 0.8 }}>
          No map data for scene: <code>{scene}</code>
        </div>
      </div>
    );
  }

  const neighbors = currentNode.neighbors
    .map((id) => mapNodes[id])
    .filter(Boolean)
    .slice(0, 4);

  const north = neighbors[0];
  const east = neighbors[1];
  const south = neighbors[2];
  const west = neighbors[3];

  const isLocked = (node: (typeof mapNodes)[string] | undefined) => {
    if (!node) return false;
    if (typeof node.unlocked === "function") {
      return !node.unlocked(flags);
    }
    return false;
  };

  const renderCell = (
    node: (typeof mapNodes)[string] | undefined,
    isCenter = false
  ) => {
    if (!node) {
      return (
        <div
          style={{
            width: 40,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.2,
            fontSize: 9,
          }}
        >
          ·
        </div>
      );
    }

    const locked = isLocked(node);
    const isCurrent = isCenter;

    return (
      <div
        style={{
          width: 60,
          height: 28,
          borderRadius: 4,
          border: isCurrent
            ? "1px solid rgba(0,255,255,0.8)"
            : "1px solid rgba(0,255,255,0.25)",
          background: isCurrent
            ? "rgba(0,255,255,0.1)"
            : "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          textAlign: "center",
          padding: "0 4px",
          opacity: locked ? 0.25 : 1,
          color: isCurrent ? "#00ffff" : "#e5e5e5",
          boxShadow: isCurrent ? "0 0 4px rgba(0,255,255,0.7)" : "none",
        }}
      >
        {node.label}
      </div>
    );
  };

  return (
    <div
      style={{
        padding: "6px 8px 8px",
        marginBottom: "0.5rem",
        border: "1px solid rgba(0,255,255,0.3)",
        borderRadius: 8,
        background: "rgba(0,0,0,0.55)",
        color: "#e5e5e5",
        fontFamily: "monospace",
        fontSize: 10,
        display: "inline-block",
      }}
    >
      <div
        style={{
          fontSize: 9,
          opacity: 0.65,
          marginBottom: 4,
        }}
      >
        LOCAL MAP
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto auto",
          gridTemplateRows: "auto auto auto",
          gap: 2,
        }}
      >
        <div />
        {renderCell(north)}
        <div />

        {renderCell(west)}
        {renderCell(currentNode, true)}
        {renderCell(east)}

        <div />
        {renderCell(south)}
        <div />
      </div>
    </div>
  );
}
