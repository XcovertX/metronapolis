// app/components/LightingEditor.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Pt = { x: number; y: number };

export type LightType = "point" | "spot" | "area";

export type Room = {
  id: string;
  name: string;
  // ✅ NATIVE px (top-left origin)
  x: number;
  y: number;
  w: number;
  h: number;
};

export type LightDef = {
  id: string;
  name: string;
  type: LightType;

  // ✅ NATIVE px (top-left origin)
  x: number;
  y: number;
  z: number;

  color: string;
  intensity: number;
  distance: number;
  decay: number;
  angleDeg?: number;
  penumbra?: number;
  target?: Pt; // ✅ NATIVE px
  roomId?: string;
  enabled: boolean;

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
  /** ✅ REQUIRED: the stage div that contains your Image (aspect-locked container) */
  containerRef: React.RefObject<HTMLElement | null>;

  /** ✅ REQUIRED: background native pixel size */
  bgNative: { w: number; h: number };

  initial?: LightingData;
  onChange?: (data: LightingData) => void;

  startHidden?: boolean;
  snapPx?: number;
  clampToStage?: boolean;

  /** ✅ read-only overlay for “current lights” (native px) */
  activeLighting?: LightingData;

  showActiveRooms?: boolean;
  showSpotTargets?: boolean;
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

type Box = { left: number; top: number; w: number; h: number };

/** ✅ For objectFit:"contain": compute the image rect inside the stage rect */
function computeContainRect(stage: Box, native: { w: number; h: number }): Box {
  const sw = stage.w;
  const sh = stage.h;
  const iw = native.w;
  const ih = native.h;

  if (sw <= 0 || sh <= 0 || iw <= 0 || ih <= 0) return stage;

  const stageAspect = sw / sh;
  const imgAspect = iw / ih;

  if (stageAspect > imgAspect) {
    // stage is wider → letterbox left/right, image fills height
    const h = sh;
    const w = h * imgAspect;
    const left = stage.left + (sw - w) / 2;
    const top = stage.top;
    return { left, top, w, h };
  } else {
    // stage is taller → letterbox top/bottom, image fills width
    const w = sw;
    const h = w / imgAspect;
    const left = stage.left;
    const top = stage.top + (sh - h) / 2;
    return { left, top, w, h };
  }
}

export default function LightingEditor({
  containerRef,
  bgNative,
  initial,
  onChange,
  startHidden = false,
  snapPx = 8,
  clampToStage = true,
  activeLighting,
  showActiveRooms = false,
  showSpotTargets = true,
}: Props) {
  const [data, setData] = useState<LightingData>(initial ?? DEFAULT);
  const [showOverlay, setShowOverlay] = useState(!startHidden);
  const [mode, setMode] = useState<Mode>("select");
  const [sel, setSel] = useState<Selection>({ kind: "none" });

  // draft room rect
  const [roomDraft, setRoomDraft] = useState<null | { start: Pt; end: Pt; name: string }>(null);

  // stage rect + derived image rect (contain)
  const [stageBox, setStageBox] = useState<Box | null>(null);
  const [imgBox, setImgBox] = useState<Box | null>(null);

  const overlayRef = useRef<HTMLDivElement | null>(null);

  const dragRef = useRef<
    | null
    | { kind: "light"; id: string; dx: number; dy: number }
    | { kind: "room"; id: string; dx: number; dy: number }
  >(null);

  useEffect(() => {
    if (initial) setData(initial);
  }, [initial]);

  useEffect(() => {
    onChange?.(data);
  }, [data, onChange]);

  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;

      const r = el.getBoundingClientRect();
      const s: Box = { left: r.left, top: r.top, w: r.width, h: r.height };
      setStageBox(s);

      const img = computeContainRect(s, bgNative);
      setImgBox(img);
    };

    update();

    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [containerRef, bgNative.w, bgNative.h]);

  const jsonText = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const inNativeBounds = (p: Pt) => p.x >= 0 && p.y >= 0 && p.x <= bgNative.w && p.y <= bgNative.h;

  /** ✅ pointer -> native px (relative to the CONTAINED IMAGE RECT) */
  const getNativeFromEvent = (e: React.PointerEvent): Pt => {
    if (!imgBox) return { x: 0, y: 0 };

    const xLocal = e.clientX - imgBox.left;
    const yLocal = e.clientY - imgBox.top;

    const xNative = (xLocal / Math.max(1, imgBox.w)) * bgNative.w;
    const yNative = (yLocal / Math.max(1, imgBox.h)) * bgNative.h;

    return { x: xNative, y: yNative };
  };

  const hitTest = (p: Pt): Selection => {
    for (let i = data.lights.length - 1; i >= 0; i--) {
      const L = data.lights[i];
      const rr = (L.bulbRadius ?? 10) + 8;
      const dx = p.x - L.x;
      const dy = p.y - L.y;
      if (dx * dx + dy * dy <= rr * rr) return { kind: "light", id: L.id };
    }
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
    if (!showOverlay || !imgBox) return;

    const raw = getNativeFromEvent(e);
    const p0 = snap(raw, snapPx);
    const p = clampToStage
      ? { x: clamp(p0.x, 0, bgNative.w), y: clamp(p0.y, 0, bgNative.h) }
      : p0;

    if (clampToStage && !inNativeBounds(p)) return;

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
        const x = Math.min(roomDraft.start.x, roomDraft.end.x);
        const y = Math.min(roomDraft.start.y, roomDraft.end.y);
        const w = Math.abs(roomDraft.end.x - roomDraft.start.x);
        const h = Math.abs(roomDraft.end.y - roomDraft.start.y);

        if (w >= 10 && h >= 10) {
          const id = uid("room");
          setData((d) => ({ ...d, rooms: [...d.rooms, { id, name: roomDraft.name, x, y, w, h }] }));
          setSel({ kind: "room", id });
        }
        setRoomDraft(null);
        setMode("select");
      }
      return;
    }

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
    if (!showOverlay || !imgBox) return;

    const raw = getNativeFromEvent(e);
    const p0 = snap(raw, snapPx);
    const p = clampToStage
      ? { x: clamp(p0.x, 0, bgNative.w), y: clamp(p0.y, 0, bgNative.h) }
      : p0;

    if (mode === "draw-room" && roomDraft) {
      setRoomDraft((d) => (d ? { ...d, end: p } : d));
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;

    if (drag.kind === "light") updateLight(drag.id, { x: p.x + drag.dx, y: p.y + drag.dy });
    else updateRoom(drag.id, { x: p.x + drag.dx, y: p.y + drag.dy });
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
      if ((e.key === "Backspace" || e.key === "Delete") && showOverlay) deleteSelection();
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
            className={`rounded-md px-2 py-1 text-xs ${
              mode === "select" ? "bg-white/25" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            Select/Edit
          </button>
          <button
            onClick={() => setMode("place-light")}
            className={`rounded-md px-2 py-1 text-xs ${
              mode === "place-light" ? "bg-white/25" : "bg-white/10 hover:bg-white/20"
            }`}
            title="Hotkey: L"
          >
            Place Light (L)
          </button>
          <button
            onClick={() => setMode("draw-room")}
            className={`rounded-md px-2 py-1 text-xs ${
              mode === "draw-room" ? "bg-white/25" : "bg-white/10 hover:bg-white/20"
            }`}
            title="Hotkey: R"
          >
            Draw Room (R)
          </button>
        </div>

        <div className="mt-3 rounded-lg bg-white/10 p-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold">Ambient</div>
            <label className="text-xs flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.ambient.enabled}
                onChange={(e) => setData((d) => ({ ...d, ambient: { ...d.ambient, enabled: e.target.checked } }))}
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
                onChange={(e) => setData((d) => ({ ...d, ambient: { ...d.ambient, color: e.target.value } }))}
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
            </div>
          )}
        </div>

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
          {stageBox && imgBox && (
            <div className="mt-1">
              stage {Math.round(stageBox.w)}×{Math.round(stageBox.h)} · img{" "}
              {Math.round(imgBox.w)}×{Math.round(imgBox.h)}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Overlay pinned to the *contained image rect* (matches Image objectFit:"contain") */}
      {imgBox && imgBox.w > 0 && imgBox.h > 0 && (
        <div
          ref={overlayRef}
          style={{
            position: "fixed",
            left: imgBox.left,
            top: imgBox.top,
            width: imgBox.w,
            height: imgBox.h,
            zIndex: 9997,
            pointerEvents: showOverlay ? "auto" : "none",
            touchAction: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <svg className="h-full w-full" viewBox={`0 0 ${bgNative.w} ${bgNative.h}`} preserveAspectRatio="none">
            {/* Active (read-only) */}
            {showOverlay && activeLighting && (
              <g opacity={0.75}>
                {showActiveRooms &&
                  activeLighting.rooms.map((r) => (
                    <g key={"active-room-" + r.id}>
                      <rect
                        x={r.x}
                        y={r.y}
                        width={r.w}
                        height={r.h}
                        fill="rgba(80,255,120,0.04)"
                        stroke="rgba(80,255,120,0.35)"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                      />
                      <text x={r.x + 8} y={r.y + 18} fill="rgba(200,255,220,0.8)" fontFamily="monospace" fontSize={12}>
                        {r.name}
                      </text>
                    </g>
                  ))}

                {activeLighting.lights.map((l) => {
                  const rr = l.bulbRadius ?? 10;
                  const stroke = l.enabled ? "rgba(80,255,120,0.9)" : "rgba(160,160,160,0.7)";
                  const fill = l.enabled ? "rgba(80,255,120,0.10)" : "rgba(160,160,160,0.08)";
                  return (
                    <g key={"active-light-" + l.id}>
                      {showSpotTargets && l.type === "spot" && l.target && (
                        <line
                          x1={l.x}
                          y1={l.y}
                          x2={l.target.x}
                          y2={l.target.y}
                          stroke="rgba(80,255,120,0.6)"
                          strokeWidth={2}
                          strokeDasharray="6 5"
                        />
                      )}
                      <circle cx={l.x} cy={l.y} r={rr} fill={fill} stroke={stroke} strokeWidth={2} strokeDasharray="6 4" />
                      <circle cx={l.x} cy={l.y} r={3} fill={l.color} opacity={0.9} />
                      <text x={l.x + rr + 10} y={l.y - rr - 6} fill="rgba(200,255,220,0.9)" fontFamily="monospace" fontSize={12}>
                        {l.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

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
                      <rect x={x} y={y} width={w} height={h} fill="rgba(120,200,255,0.05)" stroke="rgba(120,200,255,0.9)" strokeWidth={2} strokeDasharray="4 4" />
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
                const rr = l.bulbRadius ?? 10;
                const stroke = selected ? "rgba(255,240,200,0.95)" : "rgba(255,240,200,0.55)";
                const fill = l.enabled ? "rgba(255,210,140,0.25)" : "rgba(180,180,180,0.12)";
                return (
                  <g key={l.id}>
                    {showSpotTargets && l.type === "spot" && l.target && (
                      <line x1={l.x} y1={l.y} x2={l.target.x} y2={l.target.y} stroke="rgba(255,240,200,0.55)" strokeWidth={2} />
                    )}
                    <circle cx={l.x} cy={l.y} r={rr + 10} fill="transparent" stroke="transparent" />
                    <circle cx={l.x} cy={l.y} r={rr} fill={fill} stroke={stroke} strokeWidth={selected ? 3 : 2} />
                    <circle cx={l.x} cy={l.y} r={3} fill={l.color} opacity={0.9} />
                    <text x={l.x + rr + 10} y={l.y - rr - 6} fill="rgba(255,255,255,0.9)" fontFamily="monospace" fontSize={12}>
                      {l.name}
                    </text>
                    <text x={l.x + rr + 10} y={l.y - rr + 10} fill="rgba(255,255,255,0.65)" fontFamily="monospace" fontSize={11}>
                      {l.type} · I{l.intensity.toFixed(1)} · D{Math.round(l.distance)} · Z{Math.round(l.z)}
                    </text>
                  </g>
                );
              })}
          </svg>
        </div>
      )}
    </div>
  );
}
