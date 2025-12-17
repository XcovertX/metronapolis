"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Pt = { x: number; y: number };

export type LightType = "point" | "spot" | "area";

export type Room = {
  id: string;
  name: string;
  // screen px (top-left origin)
  x: number;
  y: number;
  w: number;
  h: number;
};

export type LightDef = {
  id: string;
  name: string;
  type: LightType;

  // screen px (top-left origin) so it matches your editor mental model
  x: number;
  y: number;
  z: number; // height into screen

  color: string; // "#ffd28a"
  intensity: number;
  distance: number; // for point/spot falloff range
  decay: number; // 0..2 commonly
  angleDeg?: number; // spot only
  penumbra?: number; // spot only 0..1
  target?: Pt; // spot only (screen px)
  roomId?: string; // optional grouping
  enabled: boolean;

  // optional: little emissive “bulb” marker
  showBulb?: boolean;
  bulbRadius?: number;
};

export type LightingData = {
  version: 1;
  ambient: { color: string; intensity: number; enabled: boolean };
  rooms: Room[];
  lights: LightDef[];
};

type Mode = "select" | "place-light" | "draw-room";

type Props = {
  initial?: LightingData;
  onChange?: (data: LightingData) => void;
  startHidden?: boolean;
  snapPx?: number;
};

const DEFAULT: LightingData = {
  version: 1,
  ambient: { color: "#ffffff", intensity: 0.12, enabled: true },
  rooms: [],
  lights: [],
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function snap(p: Pt, snapPx: number) {
  if (!snapPx || snapPx <= 0) return p;
  return { x: Math.round(p.x / snapPx) * snapPx, y: Math.round(p.y / snapPx) * snapPx };
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

type Selection =
  | { kind: "none" }
  | { kind: "light"; id: string }
  | { kind: "room"; id: string };

export default function LightingEditor({
  initial,
  onChange,
  startHidden = false,
  snapPx = 8,
}: Props) {
  const [data, setData] = useState<LightingData>(initial ?? DEFAULT);
  const [showOverlay, setShowOverlay] = useState(!startHidden);
  const [mode, setMode] = useState<Mode>("select");
  const [sel, setSel] = useState<Selection>({ kind: "none" });

  // draft room rect
  const [roomDraft, setRoomDraft] = useState<null | { start: Pt; end: Pt; name: string }>(null);

  const overlayRef = useRef<HTMLDivElement | null>(null);

  // dragging
  const dragRef = useRef<
    null | { kind: "light"; id: string; dx: number; dy: number } | { kind: "room"; id: string; dx: number; dy: number }
  >(null);

  useEffect(() => {
    onChange?.(data);
  }, [data, onChange]);

  const jsonText = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const getLocal = (e: React.PointerEvent) => {
    const el = overlayRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const hitTest = (p: Pt): Selection => {
    // lights (circle hit)
    for (let i = data.lights.length - 1; i >= 0; i--) {
      const L = data.lights[i];
      const rr = (L.bulbRadius ?? 10) + 8;
      const dx = p.x - L.x;
      const dy = p.y - L.y;
      if (dx * dx + dy * dy <= rr * rr) return { kind: "light", id: L.id };
    }
    // rooms (rect hit)
    for (let i = data.rooms.length - 1; i >= 0; i--) {
      const R = data.rooms[i];
      if (p.x >= R.x && p.x <= R.x + R.w && p.y >= R.y && p.y <= R.y + R.h) return { kind: "room", id: R.id };
    }
    return { kind: "none" };
  };

  const selectedLight = useMemo(() => {
    if (sel.kind !== "light") return null;
    return data.lights.find((l) => l.id === sel.id) ?? null;
  }, [sel, data.lights]);

  const selectedRoom = useMemo(() => {
    if (sel.kind !== "room") return null;
    return data.rooms.find((r) => r.id === sel.id) ?? null;
  }, [sel, data.rooms]);

  const updateLight = (id: string, patch: Partial<LightDef>) => {
    setData((d) => ({
      ...d,
      lights: d.lights.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  };

  const updateRoom = (id: string, patch: Partial<Room>) => {
    setData((d) => ({
      ...d,
      rooms: d.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  };

  const deleteSelection = () => {
    setData((d) => {
      if (sel.kind === "light") return { ...d, lights: d.lights.filter((l) => l.id !== sel.id) };
      if (sel.kind === "room") {
        // keep lights, but clear roomId references
        return {
          ...d,
          rooms: d.rooms.filter((r) => r.id !== sel.id),
          lights: d.lights.map((l) => (l.roomId === sel.id ? { ...l, roomId: undefined } : l)),
        };
      }
      return d;
    });
    setSel({ kind: "none" });
  };

  const importJson = (text: string) => {
    try {
      const parsed = JSON.parse(text) as LightingData;
      if (!parsed || parsed.version !== 1) throw new Error("Unsupported format");
      setData(parsed);
      setSel({ kind: "none" });
      setRoomDraft(null);
    } catch (e) {
      alert(`Import failed: ${(e as Error).message}`);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!showOverlay) return;

    const raw = getLocal(e);
    const p = snap(raw, snapPx);

    if (mode === "place-light") {
      const id = uid("light");
      const newLight: LightDef = {
        id,
        name: `Light ${data.lights.length + 1}`,
        type: "point",
        x: p.x,
        y: p.y,
        z: 260,
        color: "#ffd28a",
        intensity: 6,
        distance: 900,
        decay: 2,
        enabled: true,
        showBulb: true,
        bulbRadius: 10,
      };
      setData((d) => ({ ...d, lights: [...d.lights, newLight] }));
      setSel({ kind: "light", id });
      setMode("select");
      return;
    }

    if (mode === "draw-room") {
      if (!roomDraft) {
        setRoomDraft({ start: p, end: p, name: `Room ${data.rooms.length + 1}` });
      } else {
        // finalize
        const x = Math.min(roomDraft.start.x, roomDraft.end.x);
        const y = Math.min(roomDraft.start.y, roomDraft.end.y);
        const w = Math.abs(roomDraft.end.x - roomDraft.start.x);
        const h = Math.abs(roomDraft.end.y - roomDraft.start.y);

        if (w >= 10 && h >= 10) {
          const id = uid("room");
          setData((d) => ({
            ...d,
            rooms: [...d.rooms, { id, name: roomDraft.name, x, y, w, h }],
          }));
          setSel({ kind: "room", id });
        }
        setRoomDraft(null);
        setMode("select");
      }
      return;
    }

    // select & drag
    const hit = hitTest(p);
    setSel(hit);

    if (hit.kind === "light") {
      const L = data.lights.find((l) => l.id === hit.id);
      if (L) dragRef.current = { kind: "light", id: L.id, dx: L.x - p.x, dy: L.y - p.y };
    } else if (hit.kind === "room") {
      const R = data.rooms.find((r) => r.id === hit.id);
      if (R) dragRef.current = { kind: "room", id: R.id, dx: R.x - p.x, dy: R.y - p.y };
    } else {
      dragRef.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!showOverlay) return;

    const raw = getLocal(e);
    const p = snap(raw, snapPx);

    if (mode === "draw-room" && roomDraft) {
      setRoomDraft((d) => (d ? { ...d, end: p } : d));
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;

    if (drag.kind === "light") {
      updateLight(drag.id, { x: p.x + drag.dx, y: p.y + drag.dy });
    } else if (drag.kind === "room") {
      updateRoom(drag.id, { x: p.x + drag.dx, y: p.y + drag.dy });
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRoomDraft(null);
        dragRef.current = null;
        setSel({ kind: "none" });
        setMode("select");
      }
      if ((e.key === "Backspace" || e.key === "Delete") && showOverlay) {
        deleteSelection();
      }
      if (e.key.toLowerCase() === "v") setShowOverlay((s) => !s);
      if (e.key.toLowerCase() === "l") setMode("place-light");
      if (e.key.toLowerCase() === "r") setMode("draw-room");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOverlay, sel, roomDraft]);

  const assignSelectedLightToRoom = (roomId?: string) => {
    if (sel.kind !== "light") return;
    updateLight(sel.id, { roomId: roomId || undefined });
  };

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* HUD */}
      <div className="pointer-events-auto absolute left-3 top-3 w-[460px] rounded-xl bg-black/70 text-white shadow-lg backdrop-blur p-3 font-mono">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold">Lighting Editor</div>
          <button
            onClick={() => setShowOverlay((s) => !s)}
            className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
            title="Toggle overlay (V)"
          >
            {showOverlay ? "Hide (V)" : "Show (V)"}
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => setMode("select")}
            className={`rounded-md px-2 py-1 text-xs ${mode === "select" ? "bg-white/25" : "bg-white/10 hover:bg-white/20"}`}
          >
            Select/Edit
          </button>
          <button
            onClick={() => setMode("place-light")}
            className={`rounded-md px-2 py-1 text-xs ${mode === "place-light" ? "bg-white/25" : "bg-white/10 hover:bg-white/20"}`}
            title="Hotkey: L"
          >
            Place Light (L)
          </button>
          <button
            onClick={() => setMode("draw-room")}
            className={`rounded-md px-2 py-1 text-xs ${mode === "draw-room" ? "bg-white/25" : "bg-white/10 hover:bg-white/20"}`}
            title="Hotkey: R"
          >
            Draw Room (R)
          </button>
        </div>

        {/* Ambient */}
        <div className="mt-3 rounded-lg bg-white/10 p-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold">Ambient</div>
            <label className="text-xs flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.ambient.enabled}
                onChange={(e) =>
                  setData((d) => ({ ...d, ambient: { ...d.ambient, enabled: e.target.checked } }))
                }
              />
              enabled
            </label>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <label className="flex flex-col gap-1">
              <span className="opacity-80">Color</span>
              <input
                type="color"
                value={data.ambient.color}
                onChange={(e) =>
                  setData((d) => ({ ...d, ambient: { ...d.ambient, color: e.target.value } }))
                }
                className="h-8 w-full rounded-md bg-black/40"
              />
            </label>

            <label className="flex flex-col gap-1 col-span-2">
              <span className="opacity-80">Intensity: {data.ambient.intensity.toFixed(2)}</span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={data.ambient.intensity}
                onChange={(e) =>
                  setData((d) => ({ ...d, ambient: { ...d.ambient, intensity: Number(e.target.value) } }))
                }
              />
            </label>
          </div>
        </div>

        {/* Selection editor */}
        <div className="mt-3 rounded-lg bg-white/10 p-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Selection</div>
            <button
              onClick={deleteSelection}
              className="rounded-md bg-red-500/20 px-2 py-1 hover:bg-red-500/30"
              disabled={sel.kind === "none"}
            >
              Delete
            </button>
          </div>

          {sel.kind === "none" && <div className="mt-2 opacity-70">Click a light or room to edit.</div>}

          {selectedRoom && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 col-span-2">
                <span className="opacity-80">Room name</span>
                <input
                  value={selectedRoom.name}
                  onChange={(e) => updateRoom(selectedRoom.id, { name: e.target.value })}
                  className="rounded-md bg-black/40 px-2 py-1 outline-none"
                />
              </label>

              <div className="col-span-2 opacity-70">
                Drag room to reposition. (Room is just an organizer, not a collider.)
              </div>
            </div>
          )}

          {selectedLight && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 col-span-2">
                <span className="opacity-80">Name</span>
                <input
                  value={selectedLight.name}
                  onChange={(e) => updateLight(selectedLight.id, { name: e.target.value })}
                  className="rounded-md bg-black/40 px-2 py-1 outline-none"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="opacity-80">Enabled</span>
                <input
                  type="checkbox"
                  checked={selectedLight.enabled}
                  onChange={(e) => updateLight(selectedLight.id, { enabled: e.target.checked })}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="opacity-80">Type</span>
                <select
                  value={selectedLight.type}
                  onChange={(e) => updateLight(selectedLight.id, { type: e.target.value as LightType })}
                  className="rounded-md bg-black/40 px-2 py-1 outline-none"
                >
                  <option value="point">point</option>
                  <option value="spot">spot</option>
                  <option value="area" disabled>
                    area (later)
                  </option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="opacity-80">Color</span>
                <input
                  type="color"
                  value={selectedLight.color}
                  onChange={(e) => updateLight(selectedLight.id, { color: e.target.value })}
                  className="h-8 w-full rounded-md bg-black/40"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="opacity-80">Z: {Math.round(selectedLight.z)}</span>
                <input
                  type="range"
                  min={0}
                  max={1200}
                  step={1}
                  value={selectedLight.z}
                  onChange={(e) => updateLight(selectedLight.id, { z: Number(e.target.value) })}
                />
              </label>

              <label className="flex flex-col gap-1 col-span-2">
                <span className="opacity-80">Intensity: {selectedLight.intensity.toFixed(2)}</span>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={0.05}
                  value={selectedLight.intensity}
                  onChange={(e) => updateLight(selectedLight.id, { intensity: Number(e.target.value) })}
                />
              </label>

              <label className="flex flex-col gap-1 col-span-2">
                <span className="opacity-80">Distance: {Math.round(selectedLight.distance)}</span>
                <input
                  type="range"
                  min={50}
                  max={4000}
                  step={10}
                  value={selectedLight.distance}
                  onChange={(e) => updateLight(selectedLight.id, { distance: Number(e.target.value) })}
                />
              </label>

              <label className="flex flex-col gap-1 col-span-2">
                <span className="opacity-80">Decay: {selectedLight.decay.toFixed(2)}</span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.01}
                  value={selectedLight.decay}
                  onChange={(e) => updateLight(selectedLight.id, { decay: Number(e.target.value) })}
                />
              </label>

              {selectedLight.type === "spot" && (
                <>
                  <label className="flex flex-col gap-1 col-span-2">
                    <span className="opacity-80">Angle (deg): {Math.round(selectedLight.angleDeg ?? 35)}</span>
                    <input
                      type="range"
                      min={5}
                      max={90}
                      step={1}
                      value={selectedLight.angleDeg ?? 35}
                      onChange={(e) => updateLight(selectedLight.id, { angleDeg: Number(e.target.value) })}
                    />
                  </label>

                  <label className="flex flex-col gap-1 col-span-2">
                    <span className="opacity-80">Penumbra: {(selectedLight.penumbra ?? 0.25).toFixed(2)}</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={selectedLight.penumbra ?? 0.25}
                      onChange={(e) => updateLight(selectedLight.id, { penumbra: Number(e.target.value) })}
                    />
                  </label>
                </>
              )}

              <label className="flex flex-col gap-1 col-span-2">
                <span className="opacity-80">Room assignment</span>
                <select
                  value={selectedLight.roomId ?? ""}
                  onChange={(e) => assignSelectedLightToRoom(e.target.value || undefined)}
                  className="rounded-md bg-black/40 px-2 py-1 outline-none"
                >
                  <option value="">(none)</option>
                  {data.rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 col-span-2">
                <input
                  type="checkbox"
                  checked={selectedLight.showBulb ?? true}
                  onChange={(e) => updateLight(selectedLight.id, { showBulb: e.target.checked })}
                />
                <span className="opacity-80">Show bulb marker</span>
              </label>
            </div>
          )}
        </div>

        {/* Import/export */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(jsonText)}
            className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
          >
            Copy JSON
          </button>
          <button
            onClick={() => {
              const text = prompt("Paste JSON to import:", jsonText);
              if (text != null) importJson(text);
            }}
            className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
          >
            Import JSON
          </button>
        </div>

        <div className="mt-2 text-[11px] opacity-70">
          Hotkeys: <b>V</b>=toggle overlay, <b>L</b>=place light, <b>R</b>=draw room, <b>Del</b>=delete
        </div>
      </div>

      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{ pointerEvents: showOverlay ? "auto" : "none", touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <svg className="absolute inset-0 h-full w-full">
          {/* Rooms */}
          {showOverlay &&
            data.rooms.map((r) => (
              <g key={r.id}>
                <rect
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  fill={sel.kind === "room" && sel.id === r.id ? "rgba(120,200,255,0.10)" : "rgba(120,200,255,0.06)"}
                  stroke={sel.kind === "room" && sel.id === r.id ? "rgba(120,200,255,0.95)" : "rgba(120,200,255,0.55)"}
                  strokeWidth={sel.kind === "room" && sel.id === r.id ? 3 : 2}
                  strokeDasharray="6 6"
                />
                <text x={r.x + 8} y={r.y + 18} fill="rgba(255,255,255,0.9)" fontFamily="monospace" fontSize={12}>
                  {r.name}
                </text>
              </g>
            ))}

          {/* Draft room */}
          {showOverlay && roomDraft && (
            <g>
              {(() => {
                const x = Math.min(roomDraft.start.x, roomDraft.end.x);
                const y = Math.min(roomDraft.start.y, roomDraft.end.y);
                const w = Math.abs(roomDraft.end.x - roomDraft.start.x);
                const h = Math.abs(roomDraft.end.y - roomDraft.start.y);
                return (
                  <>
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      fill="rgba(120,200,255,0.05)"
                      stroke="rgba(120,200,255,0.9)"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                    <text x={x + 8} y={y + 18} fill="rgba(255,255,255,0.9)" fontFamily="monospace" fontSize={12}>
                      {roomDraft.name}
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* Lights */}
          {showOverlay &&
            data.lights.map((l) => {
              const selected = sel.kind === "light" && sel.id === l.id;
              const r = l.bulbRadius ?? 10;
              const stroke = selected ? "rgba(255,240,200,0.95)" : "rgba(255,240,200,0.55)";
              const fill = l.enabled ? "rgba(255,210,140,0.25)" : "rgba(180,180,180,0.12)";
              return (
                <g key={l.id}>
                  <circle cx={l.x} cy={l.y} r={r + 10} fill="transparent" stroke="transparent" />
                  <circle cx={l.x} cy={l.y} r={r} fill={fill} stroke={stroke} strokeWidth={selected ? 3 : 2} />
                  <circle cx={l.x} cy={l.y} r={3} fill={l.color} opacity={0.9} />
                  <text x={l.x + r + 10} y={l.y - r - 6} fill="rgba(255,255,255,0.9)" fontFamily="monospace" fontSize={12}>
                    {l.name}
                  </text>
                  <text x={l.x + r + 10} y={l.y - r + 10} fill="rgba(255,255,255,0.65)" fontFamily="monospace" fontSize={11}>
                    {l.type} · I{l.intensity.toFixed(1)} · D{Math.round(l.distance)} · Z{Math.round(l.z)}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>
    </div>
  );
}
