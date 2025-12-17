// app/components/NavMeshEditor.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Pt = { x: number; y: number };

type Polygon = {
  id: string;
  name: string;
  points: Pt[];
};

type CollisionPoint = {
  id: string;
  name: string;
  p: Pt;
};

export type WalkCollisionData = {
  version: 1;
  walkables: Polygon[];
  colliders: Polygon[];
  collisionPoints: CollisionPoint[];
};

type Mode = "select" | "walkable" | "collider" | "point";

type Props = {
  /** optional initial data (e.g. from a json file) */
  initial?: WalkCollisionData;

  /** called whenever data changes */
  onChange?: (data: WalkCollisionData) => void;

  /** if true, overlay starts hidden (lines off) */
  startHidden?: boolean;

  /** snap grid (px). set to 0 to disable */
  snapPx?: number;

  /**
   * ✅ REQUIRED for correct mapping when the viewport letterboxes/contains.
   * Must match the same authored size you use in CasperWalker (containerDimensions).
   * Example: { width: 1920, height: 1080 }
   */
  designSize?: { width: number; height: number };

  /**
   * ✅ If true, clicks/drags outside the contained design rect are ignored.
   * Recommended.
   */
  clampToDesign?: boolean;
};

const DEFAULT: WalkCollisionData = {
  version: 1,
  walkables: [],
  colliders: [],
  collisionPoints: [],
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function dist2(a: Pt, b: Pt) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function snap(p: Pt, snapPx: number) {
  if (!snapPx || snapPx <= 0) return p;
  return {
    x: Math.round(p.x / snapPx) * snapPx,
    y: Math.round(p.y / snapPx) * snapPx,
  };
}

function pointInPoly(pt: Pt, poly: Pt[]) {
  // ray cast
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;

    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

/** ✅ Contain-rect helpers (match OrthoDesignCamera "contain" behavior) */
function getContainRect(containerW: number, containerH: number, designW: number, designH: number) {
  const scale = Math.min(containerW / designW, containerH / designH);
  const drawW = designW * scale;
  const drawH = designH * scale;
  const offX = (containerW - drawW) / 2;
  const offY = (containerH - drawH) / 2;
  return { offX, offY, scale, drawW, drawH };
}

function screenToDesign(
  sx: number,
  sy: number,
  rect: { offX: number; offY: number; scale: number }
): Pt {
  return { x: (sx - rect.offX) / rect.scale, y: (sy - rect.offY) / rect.scale };
}

type Selection =
  | { kind: "none" }
  | { kind: "walkable"; polyId: string; vertexIndex?: number }
  | { kind: "collider"; polyId: string; vertexIndex?: number }
  | { kind: "point"; pointId: string };

export default function NavMeshEditor({
  initial,
  onChange,
  startHidden = false,
  snapPx = 8,
  designSize = { width: 1920, height: 1080 },
  clampToDesign = true,
}: Props) {
  const DESIGN_W = designSize.width;
  const DESIGN_H = designSize.height;

  const [data, setData] = useState<WalkCollisionData>(initial ?? DEFAULT);

  const [showOverlay, setShowOverlay] = useState(!startHidden);
  const [mode, setMode] = useState<Mode>("walkable");

  // In-progress polygon being drawn
  const [draft, setDraft] = useState<Pt[]>([]);
  const [draftName, setDraftName] = useState<string>("");

  // Selection + dragging
  const [sel, setSel] = useState<Selection>({ kind: "none" });
  const draggingRef = useRef<
    | null
    | {
        kind: "walkable" | "collider";
        polyId: string;
        vertexIndex: number;
      }
    | {
        kind: "point";
        pointId: string;
        offset: Pt;
      }
  >(null);

  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Track viewport size for contain-rect
  const [vp, setVp] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const rect = useMemo(
    () => getContainRect(vp.w, vp.h, DESIGN_W, DESIGN_H),
    [vp.w, vp.h, DESIGN_W, DESIGN_H]
  );

  // Notify external
  useEffect(() => {
    onChange?.(data);
  }, [data, onChange]);

  // Helpers to update data immutably
  const updatePolyVertex = (kind: "walkables" | "colliders", polyId: string, vi: number, p: Pt) => {
    setData((d) => {
      const arr = d[kind].map((poly) => {
        if (poly.id !== polyId) return poly;
        const pts = poly.points.map((q, i) => (i === vi ? p : q));
        return { ...poly, points: pts };
      });
      return { ...d, [kind]: arr };
    });
  };

  const updatePoint = (pointId: string, p: Pt) => {
    setData((d) => ({
      ...d,
      collisionPoints: d.collisionPoints.map((cp) => (cp.id === pointId ? { ...cp, p } : cp)),
    }));
  };

  const deleteSelection = () => {
    setData((d) => {
      if (sel.kind === "walkable") {
        return { ...d, walkables: d.walkables.filter((p) => p.id !== sel.polyId) };
      }
      if (sel.kind === "collider") {
        return { ...d, colliders: d.colliders.filter((p) => p.id !== sel.polyId) };
      }
      if (sel.kind === "point") {
        return { ...d, collisionPoints: d.collisionPoints.filter((p) => p.id !== sel.pointId) };
      }
      return d;
    });
    setSel({ kind: "none" });
  };

  /** ✅ Screen -> overlay local -> design px */
  const getLocalDesign = (e: React.PointerEvent): Pt => {
    const el = overlayRef.current;
    if (!el) return { x: 0, y: 0 };

    const r = el.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;

    return screenToDesign(sx, sy, rect);
  };

  const inDesignBounds = (p: Pt) =>
    p.x >= 0 && p.y >= 0 && p.x <= DESIGN_W && p.y <= DESIGN_H;

  // Hit testing (vertex first, then polygon, then point) — all in DESIGN space
  const hitTest = (p: Pt): Selection => {
    const VERT_R2 = 10 * 10;

    // walkable vertices
    for (const poly of data.walkables) {
      for (let i = 0; i < poly.points.length; i++) {
        if (dist2(p, poly.points[i]) <= VERT_R2) {
          return { kind: "walkable", polyId: poly.id, vertexIndex: i };
        }
      }
    }
    // collider vertices
    for (const poly of data.colliders) {
      for (let i = 0; i < poly.points.length; i++) {
        if (dist2(p, poly.points[i]) <= VERT_R2) {
          return { kind: "collider", polyId: poly.id, vertexIndex: i };
        }
      }
    }

    // points
    for (const cp of data.collisionPoints) {
      if (dist2(p, cp.p) <= VERT_R2) return { kind: "point", pointId: cp.id };
    }

    // polygon body
    for (const poly of data.walkables) {
      if (poly.points.length >= 3 && pointInPoly(p, poly.points)) {
        return { kind: "walkable", polyId: poly.id };
      }
    }
    for (const poly of data.colliders) {
      if (poly.points.length >= 3 && pointInPoly(p, poly.points)) {
        return { kind: "collider", polyId: poly.id };
      }
    }

    return { kind: "none" };
  };

  // Add point to current draft OR create collision point
  const onPointerDown = (e: React.PointerEvent) => {
    if (!showOverlay) return;

    const raw = getLocalDesign(e);
    const p = snap(raw, snapPx);

    if (clampToDesign && !inDesignBounds(p)) return;

    // drag existing when in select mode (or if you click a vertex/point)
    const hit = hitTest(p);

    // If clicking existing geometry while not in select mode, ignore (avoid accidental edits)
    if (hit.kind !== "none" && mode !== "select") {
      setSel(hit);
      return;
    }

    if (mode === "select") {
      setSel(hit);

      if (hit.kind === "walkable" && hit.vertexIndex != null) {
        draggingRef.current = {
          kind: "walkable",
          polyId: hit.polyId,
          vertexIndex: hit.vertexIndex,
        };
      } else if (hit.kind === "collider" && hit.vertexIndex != null) {
        draggingRef.current = {
          kind: "collider",
          polyId: hit.polyId,
          vertexIndex: hit.vertexIndex,
        };
      } else if (hit.kind === "point") {
        const cp = data.collisionPoints.find((x) => x.id === hit.pointId);
        if (cp) {
          draggingRef.current = {
            kind: "point",
            pointId: cp.id,
            offset: { x: cp.p.x - p.x, y: cp.p.y - p.y },
          };
        }
      } else {
        draggingRef.current = null;
      }
      return;
    }

    if (mode === "point") {
      const id = uid("pt");
      setData((d) => ({
        ...d,
        collisionPoints: [
          ...d.collisionPoints,
          { id, name: `Point ${d.collisionPoints.length + 1}`, p },
        ],
      }));
      setSel({ kind: "point", pointId: id });
      return;
    }

    // polygon drafting
    setDraft((pts) => [...pts, p]);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!showOverlay) return;
    if (!draggingRef.current) return;

    const raw = getLocalDesign(e);
    const p0 = snap(raw, snapPx);

    // optionally clamp dragging too
    const p = clampToDesign
      ? { x: Math.max(0, Math.min(DESIGN_W, p0.x)), y: Math.max(0, Math.min(DESIGN_H, p0.y)) }
      : p0;

    const drag = draggingRef.current;

    if (drag.kind === "walkable") {
      updatePolyVertex("walkables", drag.polyId, drag.vertexIndex, p);
    } else if (drag.kind === "collider") {
      updatePolyVertex("colliders", drag.polyId, drag.vertexIndex, p);
    } else if (drag.kind === "point") {
      updatePoint(drag.pointId, { x: p.x + drag.offset.x, y: p.y + drag.offset.y });
    }
  };

  const onPointerUp = () => {
    draggingRef.current = null;
  };

  const finishDraft = () => {
    if (draft.length < 3) return;

    const id = uid(mode === "walkable" ? "walk" : "col");
    const name =
      draftName.trim() ||
      `${mode === "walkable" ? "Walkable" : "Collider"} ${
        mode === "walkable" ? data.walkables.length + 1 : data.colliders.length + 1
      }`;

    const poly: Polygon = { id, name, points: draft };

    setData((d) =>
      mode === "walkable"
        ? { ...d, walkables: [...d.walkables, poly] }
        : { ...d, colliders: [...d.colliders, poly] }
    );

    setDraft([]);
    setDraftName("");
    setSel(mode === "walkable" ? { kind: "walkable", polyId: id } : { kind: "collider", polyId: id });
  };

  const undoDraft = () => {
    setDraft((pts) => pts.slice(0, -1));
  };

  // Double click to finish polygon
  const onDoubleClick = (e: React.MouseEvent) => {
    if (!showOverlay) return;
    if (mode === "walkable" || mode === "collider") {
      e.preventDefault();
      finishDraft();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDraft([]);
        setDraftName("");
        draggingRef.current = null;
        setSel({ kind: "none" });
      }
      if ((e.key === "Enter" || e.key === "Return") && (mode === "walkable" || mode === "collider")) {
        finishDraft();
      }
      if ((e.key === "Backspace" || e.key === "Delete") && showOverlay) {
        if (draft.length > 0) undoDraft();
        else deleteSelection();
      }
      if (e.key.toLowerCase() === "v") setShowOverlay((s) => !s);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft.length, mode, showOverlay, sel]);

  const jsonText = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const importJson = (text: string) => {
    try {
      const parsed = JSON.parse(text) as WalkCollisionData;
      if (!parsed || parsed.version !== 1) throw new Error("Bad/unsupported format");
      setData(parsed);
      setDraft([]);
      setSel({ kind: "none" });
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* HUD panel */}
      <div className="pointer-events-auto absolute left-3 top-[400px] w-[420px] rounded-xl bg-black/70 text-white shadow-lg backdrop-blur p-3 font-mono">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold">NavMesh / Collision Editor</div>
          <button
            onClick={() => setShowOverlay((s) => !s)}
            className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
            title="Toggle overlay (V)"
          >
            {showOverlay ? "Hide Lines (V)" : "Show Lines (V)"}
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {(["walkable", "collider", "point", "select"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setDraft([]);
                draggingRef.current = null;
              }}
              className={[
                "rounded-md px-2 py-1 text-xs",
                mode === m ? "bg-white/25" : "bg-white/10 hover:bg-white/20",
              ].join(" ")}
            >
              {m === "walkable"
                ? "Draw Walkable"
                : m === "collider"
                ? "Draw Collider"
                : m === "point"
                ? "Place Point"
                : "Select/Edit"}
            </button>
          ))}
        </div>

        {(mode === "walkable" || mode === "collider") && showOverlay && (
          <div className="mt-2 rounded-lg bg-white/10 p-2">
            <div className="text-xs opacity-80">
              Click to add vertices. Double-click or Enter to finish. Backspace to undo.
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="optional name"
                className="w-full rounded-md bg-black/40 px-2 py-1 text-xs outline-none"
              />
              <button
                onClick={finishDraft}
                disabled={draft.length < 3}
                className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/20 disabled:opacity-40"
              >
                Finish
              </button>
              <button
                onClick={undoDraft}
                disabled={draft.length === 0}
                className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/20 disabled:opacity-40"
              >
                Undo
              </button>
              <button
                onClick={() => setDraft([])}
                disabled={draft.length === 0}
                className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/20 disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between text-xs opacity-80">
          <div>Snap: {snapPx}px</div>
          <div>
            Walkables: {data.walkables.length} · Colliders: {data.colliders.length} · Points:{" "}
            {data.collisionPoints.length}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
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

        {sel.kind !== "none" && (
          <div className="mt-2 rounded-lg bg-white/10 p-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="opacity-90">
                Selected:{" "}
                {sel.kind === "walkable"
                  ? `Walkable ${sel.polyId.slice(0, 6)}`
                  : sel.kind === "collider"
                  ? `Collider ${sel.polyId.slice(0, 6)}`
                  : `Point ${sel.pointId.slice(0, 6)}`}
                {"vertexIndex" in sel && sel.vertexIndex != null ? ` (v${sel.vertexIndex})` : ""}
              </div>
              <button
                onClick={deleteSelection}
                className="rounded-md bg-red-500/20 px-2 py-1 hover:bg-red-500/30"
              >
                Delete
              </button>
            </div>
            <div className="mt-1 opacity-70">
              Tip: switch to <b>Select/Edit</b> to drag vertices/points.
            </div>
          </div>
        )}

        <div className="mt-2 rounded-lg bg-white/10 p-2 text-[11px] opacity-80">
          <div>
            Design: {DESIGN_W}×{DESIGN_H}
          </div>
          <div>
            Contain: off({Math.round(rect.offX)},{Math.round(rect.offY)}) · scale {rect.scale.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Drawing surface */}
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{
          pointerEvents: showOverlay ? "auto" : "none",
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <svg className="absolute inset-0 w-full h-full">
          {/* ✅ Apply contain transform so DESIGN-space data renders correctly under letterboxing */}
          <g transform={`translate(${rect.offX} ${rect.offY}) scale(${rect.scale})`}>
            {/* walkables */}
            {showOverlay &&
              data.walkables.map((poly) => (
                <PolySvg
                  key={poly.id}
                  poly={poly}
                  kind="walkable"
                  selected={sel.kind === "walkable" && sel.polyId === poly.id}
                />
              ))}

            {/* colliders */}
            {showOverlay &&
              data.colliders.map((poly) => (
                <PolySvg
                  key={poly.id}
                  poly={poly}
                  kind="collider"
                  selected={sel.kind === "collider" && sel.polyId === poly.id}
                />
              ))}

            {/* collision points */}
            {showOverlay &&
              data.collisionPoints.map((cp) => (
                <g key={cp.id}>
                  <circle
                    cx={cp.p.x}
                    cy={cp.p.y}
                    r={6}
                    fill={
                      sel.kind === "point" && sel.pointId === cp.id
                        ? "rgba(255,80,80,0.9)"
                        : "rgba(255,80,80,0.6)"
                    }
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={1}
                  />
                  <text
                    x={cp.p.x + 10}
                    y={cp.p.y - 10}
                    fill="rgba(255,255,255,0.85)"
                    fontSize={12}
                    fontFamily="monospace"
                  >
                    {cp.name}
                  </text>
                </g>
              ))}

            {/* draft poly */}
            {showOverlay && (mode === "walkable" || mode === "collider") && draft.length > 0 && (
              <DraftSvg points={draft} kind={mode} />
            )}
          </g>

          {/* ✅ Optional: show the contained design rect outline (debug) */}
          {showOverlay && (
            <rect
              x={rect.offX}
              y={rect.offY}
              width={rect.drawW}
              height={rect.drawH}
              fill="none"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth={2}
              strokeDasharray="8 8"
            />
          )}
        </svg>
      </div>
    </div>
  );
}

function PolySvg({
  poly,
  kind,
  selected,
}: {
  poly: Polygon;
  kind: "walkable" | "collider";
  selected: boolean;
}) {
  const stroke = kind === "walkable" ? "rgba(80,200,255,0.95)" : "rgba(255,180,60,0.95)";
  const fill = kind === "walkable" ? "rgba(80,200,255,0.15)" : "rgba(255,180,60,0.12)";

  const d =
    poly.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <g>
      <path d={d} fill={fill} stroke={stroke} strokeWidth={selected ? 3 : 2} />
      {poly.points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={6}
          fill={selected ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.65)"}
          stroke={stroke}
          strokeWidth={2}
        />
      ))}
      <text
        x={poly.points[0]?.x ?? 0}
        y={(poly.points[0]?.y ?? 0) - 12}
        fill="rgba(255,255,255,0.9)"
        fontSize={12}
        fontFamily="monospace"
      >
        {poly.name}
      </text>
    </g>
  );
}

function DraftSvg({ points, kind }: { points: Pt[]; kind: "walkable" | "collider" }) {
  const stroke = kind === "walkable" ? "rgba(80,200,255,0.9)" : "rgba(255,180,60,0.9)";
  const fill = kind === "walkable" ? "rgba(80,200,255,0.08)" : "rgba(255,180,60,0.06)";
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <g>
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeDasharray="6 6" />
      <path d={path + (points.length >= 3 ? " Z" : "")} fill={fill} stroke="none" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={5}
          fill="rgba(255,255,255,0.85)"
          stroke={stroke}
          strokeWidth={2}
        />
      ))}
    </g>
  );
}
