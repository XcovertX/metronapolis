// app/components/DialogWindow.tsx
"use client";

import { useDialog, type DialogConditionContext } from "./DialogContext";
import { useLoopState } from "./LoopStateContext";

function checkCondition(
  condition: ((ctx: DialogConditionContext) => boolean) | undefined,
  ctx: DialogConditionContext
): boolean {
  if (!condition) return true;
  return condition(ctx);
}

export default function DialogWindow() {
  const { activeNode, chooseResponse, endDialog } = useDialog();
  const { flags, inventory, timeMinutes } = useLoopState();

  if (!activeNode) return null;

  const dialogCtx: DialogConditionContext = {
    flags,
    inventory,
    timeMinutes,
  };

  // If the node itself fails its condition, silently hide it
  if (!checkCondition(activeNode.condition, dialogCtx)) {
    return null;
  }

  const visibleResponses = activeNode.responses.filter((response) =>
    checkCondition(response.condition, dialogCtx)
  );

  return (
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
      }}
    >
      <div style={{ marginBottom: 8, display: "flex", alignItems: "baseline" }}>
        <h3
          style={{
            margin: 0,
            marginRight: 8,
            fontSize: 16,
            letterSpacing: 0.5,
          }}
        >
          {activeNode.npc}
        </h3>
        <span
          style={{
            fontSize: 11,
            opacity: 0.6,
          }}
        >
          DIALOG
        </span>
      </div>

      <p
        style={{
          margin: "0 0 1rem",
          fontSize: 14,
          lineHeight: 1.5,
          opacity: 0.9,
        }}
      >
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
              borderRadius: 4,
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
        }}
      >
        End conversation
      </button>
    </div>
  );
}
