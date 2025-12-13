// app/components/OptionsPanel.tsx
"use client";

import { useMemo } from "react";
import { useOptions, type PlayerOption } from "./OptionsContext";

function ActionPanel({ options }: { options: PlayerOption[] }) {
  if (!options.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        zIndex: 40,
        maxWidth: 340,
        minWidth: 240,
        borderRadius: 10,
        border: "1px solid rgba(0,255,255,0.35)",
        background: "rgba(0,0,0,0.9)",
        padding: "0.55rem 0.65rem 0.65rem",
        fontFamily: "system-ui, sans-serif",
        color: "#f5f5f5",
        boxShadow: "0 0 10px rgba(0,0,0,0.8)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          opacity: 0.65,
          marginBottom: 6,
          letterSpacing: 0.6,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>ACTIONS</span>
        <span style={{ opacity: 0.4 }}>INTERACT</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={opt.onSelect}
            style={{
              textAlign: "left",
              padding: "0.42rem 0.55rem",
              borderRadius: 6,
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

function MoveButton({
  opt,
  label,
}: {
  opt?: PlayerOption;
  label: string;
}) {
  const disabled = !opt;

  return (
    <button
      onClick={() => opt?.onSelect()}
      disabled={disabled}
      title={opt?.label ?? ""}
      style={{
        width: 56,
        height: 56,
        borderRadius: 10,
        border: "1px solid rgba(0,255,255,0.25)",
        background: disabled ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.75)",
        color: "rgba(245,245,245,0.9)",
        fontSize: 14,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1,
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
}: {
  opt?: PlayerOption;
  label: string;
}) {
  const disabled = !opt;

  return (
    <button
      onClick={() => opt?.onSelect()}
      disabled={disabled}
      title={opt?.label ?? ""}
      style={{
        width: 56,
        height: 26,
        borderRadius: 8,
        border: "1px solid rgba(0,255,255,0.25)",
        background: disabled ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.75)",
        color: "rgba(245,245,245,0.9)",
        fontSize: 11,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1,
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

function DPadPanel({ moves }: { moves: PlayerOption[] }) {
  if (!moves.length) return null;

  const byDir = (dir: string) => moves.find((m) => m.dir === dir);

  const n = byDir("n");
  const e = byDir("e");
  const s = byDir("s");
  const w = byDir("w");
  const up = byDir("up");
  const down = byDir("down");

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 40,
        borderRadius: 12,
        border: "1px solid rgba(0,255,255,0.35)",
        background: "rgba(0,0,0,0.9)",
        padding: "0.55rem 0.65rem 0.65rem",
        fontFamily: "system-ui, sans-serif",
        color: "#f5f5f5",
        boxShadow: "0 0 10px rgba(0,0,0,0.8)",
        width: 220,
      }}
    >
      <div
        style={{
          fontSize: 10,
          opacity: 0.65,
          marginBottom: 8,
          letterSpacing: 0.6,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>MOVE</span>
        <span style={{ opacity: 0.4 }}>D-PAD</span>
      </div>

      {/* Up/Down (vertical) */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 8 }}>
        <SmallMoveButton opt={up} label="UP" />
        <SmallMoveButton opt={down} label="DN" />
      </div>

      {/* D-pad grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "56px 56px 56px",
          gridTemplateRows: "56px 56px 56px",
          gap: 8,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div /> {/* empty */}
        <MoveButton opt={n} label="N" />
        <div /> {/* empty */}

        <MoveButton opt={w} label="W" />
        <MoveButton opt={undefined} label="●" />
        <MoveButton opt={e} label="E" />

        <div /> {/* empty */}
        <MoveButton opt={s} label="S" />
        <div /> {/* empty */}
      </div>

      {/* Optional hint (destination preview) */}
      <div style={{ marginTop: 8, fontSize: 10, opacity: 0.55, textAlign: "center" }}>
        Tap a direction to move
      </div>
    </div>
  );
}

export default function OptionsPanel() {
  const { options } = useOptions();

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

  if (!actions.length && !moves.length) return null;

  return (
    <>
      <ActionPanel options={actions} />
      <DPadPanel moves={moves} />
    </>
  );
}
