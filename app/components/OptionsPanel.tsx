// app/components/OptionsWindow.tsx
"use client";

import React, { useMemo } from "react";
import { useOptions, type PlayerOption } from "./OptionsContext";
import { useDialog } from "./DialogContext";

type PanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

function CornerCut() {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 14,
        height: 14,
        clipPath: "polygon(0 0, 100% 0, 100% 100%)",
        background: "rgba(0,255,210,0.35)",
        boxShadow: "0 0 12px rgba(0,255,210,0.35)",
      }}
    />
  );
}

function HudPanel({ title, subtitle, children, style }: PanelProps) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 14,
        padding: "0.9rem 1rem",
        border: "1px solid rgba(0,255,210,0.30)",
        background:
          "linear-gradient(180deg, rgba(0,10,10,0.70), rgba(0,0,0,0.78))",
        boxShadow:
          "inset 0 0 0 1px rgba(0,255,210,0.08), 0 0 22px rgba(0,255,210,0.10)",
        backdropFilter: "blur(6px)",
        color: "rgba(210,255,245,0.92)",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        ...style,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 8,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }}
      />
      <CornerCut />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: 1.2, opacity: 0.7 }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 10, letterSpacing: 1, opacity: 0.45 }}>
            {subtitle}
          </div>
        ) : null}
      </div>

      {children}
    </div>
  );
}

function MoveButton({
  opt,
  label,
  disabled,
}: {
  opt?: PlayerOption;
  label: string;
  disabled: boolean;
}) {
  const isDisabled = disabled || !opt;

  return (
    <button
      onClick={() => opt?.onSelect()}
      disabled={isDisabled}
      title={opt?.label ?? ""}
      style={{
        width: 56,
        height: 56,
        borderRadius: 10,
        border: "1px solid rgba(0,255,210,0.25)",
        background: isDisabled ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.65)",
        color: "rgba(245,245,245,0.9)",
        fontSize: 14,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.25 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
    >
      {label}
    </button>
  );
}

function SmallMoveButton({
  opt,
  label,
  disabled,
}: {
  opt?: PlayerOption;
  label: string;
  disabled: boolean;
}) {
  const isDisabled = disabled || !opt;

  return (
    <button
      onClick={() => opt?.onSelect()}
      disabled={isDisabled}
      title={opt?.label ?? ""}
      style={{
        width: 56,
        height: 26,
        borderRadius: 8,
        border: "1px solid rgba(0,255,210,0.25)",
        background: isDisabled ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.65)",
        color: "rgba(245,245,245,0.9)",
        fontSize: 11,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.25 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        letterSpacing: 1,
      }}
    >
      {label}
    </button>
  );
}

export default function OptionsWindow() {
  const { options } = useOptions();
  const { activeNode } = useDialog();
  const movementLocked = !!activeNode;

  const { actions, moves } = useMemo(() => {
    const actions: PlayerOption[] = [];
    const moves: PlayerOption[] = [];
    for (const opt of options) {
      const kind = opt.kind ?? "action";
      if (kind === "move") moves.push(opt);
      else actions.push(opt);
    }
    return { actions, moves };
  }, [options]);

  // Don’t render if nothing to show
  if (!actions.length && !moves.length) return null;

  const byDir = (dir: string) => moves.find((m) => m.dir === dir);

  const n = byDir("n");
  const e = byDir("e");
  const s = byDir("s");
  const w = byDir("w");
  const up = byDir("up");
  const down = byDir("down");

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 14,
          left: 14,
          width: 380,
          pointerEvents: "auto", 
          zIndex: 60,
        }}
      >

      </div>

      {/* Movement D-pad (bottom-right) */}
      <div
        style={{
          position: "fixed",
          bottom: 14,
          right: 14,
          width: 260,
          pointerEvents: "auto", 
          zIndex: 60,
        }}
      >
        <div className="">
          <HudPanel title="ACTIONS" subtitle="INTERACT" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }} >
            {actions.length ? (
              actions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={opt.onSelect}
                  style={{
                    textAlign: "left",
                    padding: "0.55rem 0.75rem",
                    borderRadius: 10,
                    border: "1px solid rgba(0,255,210,0.22)",
                    background: "rgba(0,0,0,0.55)",
                    color: "rgba(245,245,245,0.92)",
                    fontSize: 12,
                    letterSpacing: 0.5,
                    cursor: "pointer",
                    boxShadow: "inset 0 0 0 1px rgba(0,255,210,0.06)",
                  }}
                >
                  {opt.label}
                </button>
              ))
            ) : (
              <div style={{ fontSize: 12, opacity: 0.6 }}>(none)</div>
            )}
          </div>
        </HudPanel>
        
        <HudPanel title="MOVE" subtitle={movementLocked ? "LOCKED" : "D-PAD"}>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 10 }}>
            <SmallMoveButton opt={up} label="UP" disabled={movementLocked} />
            <SmallMoveButton opt={down} label="DN" disabled={movementLocked} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "56px 56px 56px",
              gridTemplateRows: "56px 56px 56px",
              gap: 10,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div />
            <MoveButton opt={n} label="N" disabled={movementLocked} />
            <div />

            <MoveButton opt={w} label="W" disabled={movementLocked} />
            <MoveButton opt={undefined} label="●" disabled={true} />
            <MoveButton opt={e} label="E" disabled={movementLocked} />

            <div />
            <MoveButton opt={s} label="S" disabled={movementLocked} />
            <div />
          </div>

          <div style={{ marginTop: 10, fontSize: 10, opacity: 0.55, textAlign: "center" }}>
            {movementLocked ? "Movement disabled during dialog" : "Tap a direction to move"}
          </div>
        </HudPanel>
        </div>
      </div>
    </>
  );
}
