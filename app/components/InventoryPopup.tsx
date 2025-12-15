// app/components/InventoryPopup.tsx
"use client";

import React, { useMemo } from "react";
import { useLoopState } from "./LoopStateContext";
import { useExamine } from "./ExamineContext";
import { useExamineMode } from "./ExamineModeContext";

const GRID_COLS = 4;
const GRID_ROWS = 3; // 12 slots

export default function InventoryPopup({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { inventory } = useLoopState(); // InventoryItem[]
  const { openExamine } = useExamine();
  const { examineMode } = useExamineMode();

  const slots = useMemo(() => {
    const max = GRID_COLS * GRID_ROWS;
    const arr = Array.from({ length: max }, (_, i) => inventory[i] ?? null);
    return arr;
  }, [inventory]);

  if (!open) return null;

  const onSlotClick = (item: any | null) => {
    if (!item) return;

    // Only open examine when in examine mode
    if (!examineMode) return;

    openExamine({
      id: `inv-${item.id}`,
      title: item.name ?? "Item",
      body:
        item.description ??
        "A thing you’re carrying. It feels heavier than it should.",
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // click outside closes
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(520px, 94vw)",
          borderRadius: 14,
          border: "1px solid rgba(0,255,210,0.30)",
          background:
            "radial-gradient(120% 140% at 50% 10%, rgba(0,35,30,0.88), rgba(0,0,0,0.92) 60%)",
          boxShadow:
            "inset 0 0 0 1px rgba(0,255,210,0.08), 0 0 22px rgba(0,255,210,0.10)",
          overflow: "hidden",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* header */}
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid rgba(0,255,210,0.18)",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
            <div style={{ fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase" }}>
              Inventory
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 1 }}>
              {examineMode ? "EXAMINE MODE: ON" : "Tip: Turn on EXAMINE to inspect items"}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "1px solid rgba(0,255,210,0.25)",
              background: "rgba(0,0,0,0.55)",
              color: "rgba(210,255,245,0.95)",
              borderRadius: 10,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Close
          </button>
        </div>

        {/* scanlines */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,255,210,0.07) 1px, transparent 1px)",
            backgroundSize: "100% 3px",
            opacity: 0.18,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />

        {/* grid */}
        <div style={{ padding: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gap: 10,
            }}
          >
            {slots.map((item, idx) => {
              const filled = !!item;
              return (
                <button
                  key={idx}
                  onClick={() => onSlotClick(item)}
                  title={
                    item
                      ? examineMode
                        ? `Examine: ${item.name}`
                        : item.name
                      : "Empty"
                  }
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 12,
                    border: filled
                      ? "1px solid rgba(0,255,210,0.35)"
                      : "1px solid rgba(0,255,210,0.18)",
                    background: filled
                      ? "rgba(0,0,0,0.55)"
                      : "rgba(0,0,0,0.30)",
                    boxShadow: filled
                      ? "inset 0 0 0 1px rgba(0,255,210,0.08), 0 0 14px rgba(0,255,210,0.06)"
                      : "inset 0 0 0 1px rgba(0,255,210,0.05)",
                    color: "rgba(210,255,245,0.90)",
                    cursor: filled ? (examineMode ? "zoom-in" : "pointer") : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 8,
                  }}
                >
                  {/* Placeholder for future 64x64 sprite */}
                  {filled ? (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, letterSpacing: 0.6 }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.65 }}>
                        [64×64]
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, opacity: 0.35, letterSpacing: 1 }}>
                      EMPTY
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 12, fontSize: 11, opacity: 0.75 }}>
            {examineMode
              ? "Click an item to examine it."
              : "Toggle EXAMINE, then click an item to inspect it."}
          </div>
        </div>
      </div>
    </div>
  );
}
