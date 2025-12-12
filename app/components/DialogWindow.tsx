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

  // If node condition fails, hide silently
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
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 55,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={endDialog} // click on backdrop closes dialog
    >
      <div
        style={{
          minWidth: 320,
          maxWidth: 460,
          padding: "1.25rem 1.5rem",
          borderRadius: 8,
          border: "1px solid rgba(0,255,255,0.4)",
          background: "rgba(0,0,0,0.95)",
          color: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
          boxShadow: "0 0 12px rgba(0,0,0,0.9)",
        }}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* Portrait Row */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {/* NPC portrait */}
          <div
            style={{
              flex: 1,
              borderRadius: 6,
              border: "1px solid rgba(0,255,255,0.4)",
              background:
                "radial-gradient(circle at top, rgba(0,255,255,0.1), rgba(0,0,0,0.9))",
              padding: "6px 8px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 64,
            }}
          >
            <div
              style={{
                fontSize: 10,
                opacity: 0.7,
                marginBottom: 2,
              }}
            >
              NPC
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {activeNode.npc}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 10,
                opacity: 0.7,
              }}
            >
              [portrait slot]
            </div>
          </div>

          {/* Casper portrait */}
          <div
            style={{
              flex: 1,
              borderRadius: 6,
              border: "1px solid rgba(0,255,255,0.4)",
              background:
                "radial-gradient(circle at top, rgba(0,255,255,0.05), rgba(0,0,0,0.9))",
              padding: "6px 8px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 64,
            }}
          >
            <div
              style={{
                fontSize: 10,
                opacity: 0.7,
                marginBottom: 2,
                textAlign: "right",
              }}
            >
              PLAYER
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                textAlign: "right",
              }}
            >
              Casper
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 10,
                opacity: 0.7,
                textAlign: "right",
              }}
            >
              [portrait slot]
            </div>
          </div>
        </div>

        {/* Header row */}
        <div
          style={{
            marginBottom: 8,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                opacity: 0.7,
              }}
            >
              DIALOG
            </span>
          </div>
        </div>

        {/* NPC line */}
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

        {/* Response options */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 8,
          }}
        >
          {visibleResponses.map((response, idx) => (
            <button
              key={idx}
              onClick={() => chooseResponse(response)}
              style={{
                textAlign: "left",
                padding: "0.45rem 0.65rem",
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
            marginTop: 16,
            fontSize: 11,
            opacity: 0.6,
            background: "transparent",
            border: "1px solid rgba(0,255,255,0.3)",
            borderRadius: 4,
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
