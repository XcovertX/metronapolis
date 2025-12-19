"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { WalkCollisionData, Polygon, SceneChangeZone, Pt } from "@/app/game/navMeshs/types";
import { SceneId } from "../game/sceneGraph";

type Mode = "select" | "walkable" | "collider" | "point" | "scene";

type Props = {
  /** ✅ REQUIRED: the same stage div that contains your background Image */
  containerRef: React.RefObject<HTMLElement | null>;

  /** ✅ REQUIRED: background native pixel size (original image resolution) */
  bgNative: { w: number; h: number };

  /** optional initial data (native px) */
  initial?: WalkCollisionData;

  /** called whenever data changes */
  onChange?: (data: WalkCollisionData) => void;

  /** if true, overlay starts hidden (lines off) */
  startHidden?: boolean;

  /** snap grid (in NATIVE px). set to 0 to disable */
  snapPx?: number;

  /** if true, clicks/drags outside the *drawn image rect* are ignored */
  clampToStage?: boolean;

  /** optional overlay of existing mesh (native px) */
  activeNavmesh?: WalkCollisionData;
};

const DEFAULT: WalkCollisionData = {
  version: 1,
  walkables: [],
  colliders: [],
  collisionPoints: [],
  sceneChangeZones: [],
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function dist2(a: Pt, b: Pt) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function snap(p: Pt, snapPx: number) {
  if (!snapPx || snapPx <= 0) return p;
  return {
    x: Math.round(p.x / snapPx) * snapPx,
    y: Math.round(p.y / snapPx) * snapPx,
  };
}

function pointInPoly(pt: Pt, poly: Pt[]) {
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

/** ✅ contain-rect (matches objectFit:"contain") */
function getContainRect(stageW: number, stageH: number, imgW: number, imgH: number) {
  const scale = Math.min(stageW / imgW, stageH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const offX = (stageW - drawW) / 2;
  const offY = (stageH - drawH) / 2;
  return { offX, offY, scale, drawW, drawH };
}

type Selection =
  | { kind: "none" }
  | { kind: "walkable"; polyId: string; vertexIndex?: number }
  | { kind: "collider"; polyId: string; vertexIndex?: number }
  | { kind: "scene"; zoneId: string; vertexIndex?: number }
  | { kind: "point"; pointId: string };

export default function NavMeshEditor({
  containerRef,
  bgNative,
  initial,
  onChange,
  startHidden = false,
  snapPx = 8,
  clampToStage = true,
  activeNavmesh,
}: Props) {
  // ✅ Back-compat: if initial lacks sceneChangeZones, add it.
  const [data, setData] = useState<WalkCollisionData>(() => {
    const src = initial ?? DEFAULT;
    return {
      ...src,
      sceneChangeZones: (src as any).sceneChangeZones ?? [],
    };
  });

  const [showOverlay, setShowOverlay] = useState(!startHidden);
  const [mode, setMode] = useState<Mode>("walkable");

  const [draft, setDraft] = useState<Pt[]>([]);
  const [draftName, setDraftName] = useState<string>("");

  const [sel, setSel] = useState<Selection>({ kind: "none" });

  const draggingRef = useRef<
    | null
    | { kind: "walkable" | "collider"; polyId: string; vertexIndex: number }
    | { kind: "scene"; zoneId: string; vertexIndex: number }
    | { kind: "point"; pointId: string; offset: Pt }
  >(null);

  const [stageRect, setStageRect] = useState<{
    left: number;
    top: number;
    w: number;
    h: number;
  }>({ left: 0, top: 0, w: 0, h: 0 });

  useEffect(() => {
    const tick = () => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setStageRect({ left: r.left, top: r.top, w: r.width, h: r.height });
    };

    tick();

    const ro = new ResizeObserver(() => tick());
    if (containerRef.current) ro.observe(containerRef.current);

    window.addEventListener("resize", tick);
    return () => {
      window.removeEventListener("resize", tick);
      ro.disconnect();
    };
  }, [containerRef]);

  const contain = useMemo(
    () => getContainRect(stageRect.w || 1, stageRect.h || 1, bgNative.w, bgNative.h),
    [stageRect.w, stageRect.h, bgNative.w, bgNative.h]
  );

  useEffect(() => {
    onChange?.(data);
  }, [data, onChange]);

  const inNativeBounds = (p: Pt) => p.x >= 0 && p.y >= 0 && p.x <= bgNative.w && p.y <= bgNative.h;

  /** ✅ Pointer -> native px (accounts for contain letterbox inside stage) */
  const getNativeFromEvent = (e: React.PointerEvent): Pt | null => {
    const el = containerRef.current;
    if (!el) return null;

    // client -> stage local
    const xStage = e.clientX - stageRect.left;
    const yStage = e.clientY - stageRect.top;

    // stage local -> image local (remove contain offsets)
    const xImg = (xStage - contain.offX) / contain.scale;
    const yImg = (yStage - contain.offY) / contain.scale;

    // if clamping, reject clicks in the bars
    if (clampToStage) {
      if (xImg < 0 || yImg < 0 || xImg > bgNative.w || yImg > bgNative.h) return null;
    }

    return {
      x: clamp(xImg, 0, bgNative.w),
      y: clamp(yImg, 0, bgNative.h),
    };
  };

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

  const updateZoneVertex = (zoneId: string, vi: number, p: Pt) => {
    setData((d) => ({
      ...d,
      sceneChangeZones: d.sceneChangeZones.map((z) => {
        if (z.id !== zoneId) return z;
        const pts = z.points.map((q, i) => (i === vi ? p : q));
        return { ...z, points: pts };
      }),
    }));
  };

  const updatePoint = (pointId: string, p: Pt) => {
    setData((d) => ({
      ...d,
      collisionPoints: d.collisionPoints.map((cp) => (cp.id === pointId ? { ...cp, p } : cp)),
    }));
  };

  const updateSelectedName = (name: string) => {
    setData((d) => {
      if (sel.kind === "walkable") {
        return { ...d, walkables: d.walkables.map((p) => (p.id === sel.polyId ? { ...p, name } : p)) };
      }
      if (sel.kind === "collider") {
        return { ...d, colliders: d.colliders.map((p) => (p.id === sel.polyId ? { ...p, name } : p)) };
      }
      if (sel.kind === "scene") {
        return {
          ...d,
          sceneChangeZones: d.sceneChangeZones.map((z) => (z.id === sel.zoneId ? { ...z, name } : z)),
        };
      }
      if (sel.kind === "point") {
        return {
          ...d,
          collisionPoints: d.collisionPoints.map((cp) => (cp.id === sel.pointId ? { ...cp, name } : cp)),
        };
      }
      return d;
    });
  };

  const updateSelectedTargetSceneId = (targetSceneId: SceneId) => {
    if (sel.kind !== "scene") return;
    setData((d) => ({
      ...d,
      sceneChangeZones: d.sceneChangeZones.map((z) => (z.id === sel.zoneId ? { ...z, targetSceneId } : z)),
    }));
  };

  const deleteSelection = () => {
    setData((d) => {
      if (sel.kind === "walkable") return { ...d, walkables: d.walkables.filter((p) => p.id !== sel.polyId) };
      if (sel.kind === "collider") return { ...d, colliders: d.colliders.filter((p) => p.id !== sel.polyId) };
      if (sel.kind === "scene") return { ...d, sceneChangeZones: d.sceneChangeZones.filter((z) => z.id !== sel.zoneId) };
      if (sel.kind === "point") return { ...d, collisionPoints: d.collisionPoints.filter((p) => p.id !== sel.pointId) };
      return d;
    });
    setSel({ kind: "none" });
  };

  const hitTest = (p: Pt): Selection => {
    const VERT_R2 = 10 * 10;

    for (const poly of data.walkables) {
      for (let i = 0; i < poly.points.length; i++) {
        if (dist2(p, poly.points[i]) <= VERT_R2) return { kind: "walkable", polyId: poly.id, vertexIndex: i };
      }
    }
    for (const poly of data.colliders) {
      for (let i = 0; i < poly.points.length; i++) {
        if (dist2(p, poly.points[i]) <= VERT_R2) return { kind: "collider", polyId: poly.id, vertexIndex: i };
      }
    }
    for (const z of data.sceneChangeZones) {
      for (let i = 0; i < z.points.length; i++) {
        if (dist2(p, z.points[i]) <= VERT_R2) return { kind: "scene", zoneId: z.id, vertexIndex: i };
      }
    }
    for (const cp of data.collisionPoints) {
      if (dist2(p, cp.p) <= VERT_R2) return { kind: "point", pointId: cp.id };
    }

    for (const poly of data.walkables) {
      if (poly.points.length >= 3 && pointInPoly(p, poly.points)) return { kind: "walkable", polyId: poly.id };
    }
    for (const poly of data.colliders) {
      if (poly.points.length >= 3 && pointInPoly(p, poly.points)) return { kind: "collider", polyId: poly.id };
    }
    for (const z of data.sceneChangeZones) {
      if (z.points.length >= 3 && pointInPoly(p, z.points)) return { kind: "scene", zoneId: z.id };
    }

    return { kind: "none" };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!showOverlay) return;

    const raw = getNativeFromEvent(e);
    if (!raw) return;
    const p = snap(raw, snapPx);

    if (clampToStage && !inNativeBounds(p)) return;

    const hit = hitTest(p);

    if (hit.kind !== "none" && mode !== "select") {
      setSel(hit);
      return;
    }

    if (mode === "select") {
      setSel(hit);

      if (hit.kind === "walkable" && hit.vertexIndex != null) {
        draggingRef.current = { kind: "walkable", polyId: hit.polyId, vertexIndex: hit.vertexIndex };
      } else if (hit.kind === "collider" && hit.vertexIndex != null) {
        draggingRef.current = { kind: "collider", polyId: hit.polyId, vertexIndex: hit.vertexIndex };
      } else if (hit.kind === "scene" && hit.vertexIndex != null) {
        draggingRef.current = { kind: "scene", zoneId: hit.zoneId, vertexIndex: hit.vertexIndex };
      } else if (hit.kind === "point") {
        const cp = data.collisionPoints.find((x) => x.id === hit.pointId);
        if (cp)
          draggingRef.current = { kind: "point", pointId: cp.id, offset: { x: cp.p.x - p.x, y: cp.p.y - p.y } };
      } else {
        draggingRef.current = null;
      }
      return;
    }

    if (mode === "point") {
      const id = uid("pt");
      setData((d) => ({
        ...d,
        collisionPoints: [...d.collisionPoints, { id, name: `Point ${d.collisionPoints.length + 1}`, p }],
      }));
      setSel({ kind: "point", pointId: id });
      return;
    }

    // walkable/collider/scene draft
    setDraft((pts) => [...pts, p]);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!showOverlay) return;
    if (!draggingRef.current) return;

    const raw = getNativeFromEvent(e);
    if (!raw) return;
    const p0 = snap(raw, snapPx);

    const p = clampToStage ? { x: clamp(p0.x, 0, bgNative.w), y: clamp(p0.y, 0, bgNative.h) } : p0;

    const drag = draggingRef.current;
    if (drag.kind === "walkable") {
      updatePolyVertex("walkables", drag.polyId, drag.vertexIndex, p);
    } else if (drag.kind === "collider") {
      updatePolyVertex("colliders", drag.polyId, drag.vertexIndex, p);
    } else if (drag.kind === "scene") {
      updateZoneVertex(drag.zoneId, drag.vertexIndex, p);
    } else if (drag.kind === "point") {
      updatePoint(drag.pointId, { x: p.x + drag.offset.x, y: p.y + drag.offset.y });
    }
  };

  const onPointerUp = () => {
    draggingRef.current = null;
  };

  const finishDraft = () => {
    if (draft.length < 3) return;

    if (mode === "walkable" || mode === "collider") {
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
      return;
    }

    if (mode === "scene") {
      const id = uid("scene");
      const name = draftName.trim() || `Scene Zone ${data.sceneChangeZones.length + 1}`;
      const zone: SceneChangeZone = {
        id,
        name,
        points: draft,
        targetSceneId: "scene:unknown",
      };

      setData((d) => ({ ...d, sceneChangeZones: [...d.sceneChangeZones, zone] }));

      setDraft([]);
      setDraftName("");
      setSel({ kind: "scene", zoneId: id });
      return;
    }
  };

  const undoDraft = () => setDraft((pts) => pts.slice(0, -1));

  const onDoubleClick = (e: React.MouseEvent) => {
    if (!showOverlay) return;
    if (mode === "walkable" || mode === "collider" || mode === "scene") {
      e.preventDefault();
      finishDraft();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDraft([]);
        setDraftName("");
        draggingRef.current = null;
        setSel({ kind: "none" });
      }
      if ((e.key === "Enter" || e.key === "Return") && (mode === "walkable" || mode === "collider" || mode === "scene")) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.length, mode, showOverlay, sel]);

  const jsonText = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const importJson = (text: string) => {
    try {
      const parsed = JSON.parse(text) as WalkCollisionData;
      if (!parsed || parsed.version !== 1) throw new Error("Bad/unsupported format");
      setData({
        ...parsed,
        sceneChangeZones: (parsed as any).sceneChangeZones ?? [],
      });
      setDraft([]);
      setSel({ kind: "none" });
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`);
    }
  };

  // ✅ Render transform: native -> stage contained image rect
  const svgTransform = useMemo(
    () => `translate(${contain.offX} ${contain.offY}) scale(${contain.scale})`,
    [contain.offX, contain.offY, contain.scale]
  );

  const selectedName = useMemo(() => {
    if (sel.kind === "walkable") return data.walkables.find((p) => p.id === sel.polyId)?.name ?? "";
    if (sel.kind === "collider") return data.colliders.find((p) => p.id === sel.polyId)?.name ?? "";
    if (sel.kind === "scene") return data.sceneChangeZones.find((z) => z.id === sel.zoneId)?.name ?? "";
    if (sel.kind === "point") return data.collisionPoints.find((p) => p.id === sel.pointId)?.name ?? "";
    return "";
  }, [sel, data]);

  const selectedTargetSceneId = useMemo(() => {
    if (sel.kind !== "scene") return "";
    return data.sceneChangeZones.find((z) => z.id === sel.zoneId)?.targetSceneId ?? "";
  }, [sel, data]);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* HUD panel */}
      <div className="pointer-events-auto absolute left-3 top-[400px] w-[460px] rounded-xl bg-black/70 text-white shadow-lg backdrop-blur p-3 font-mono">
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
          {(["walkable", "collider", "scene", "point", "select"] as Mode[]).map((m) => (
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
                : m === "scene"
                ? "Draw Scene Change Zone"
                : m === "point"
                ? "Place Point"
                : "Select/Edit"}
            </button>
          ))}
        </div>

        {(mode === "walkable" || mode === "collider" || mode === "scene") && showOverlay && (
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
          <div>Snap: {snapPx}px (native)</div>
          <div>
            Walkables: {data.walkables.length} · Colliders: {data.colliders.length} ·
            Zones: {data.sceneChangeZones.length} · Points: {data.collisionPoints.length}
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
            <div className="flex items-center justify-between gap-2">
              <div className="opacity-90">
                Selected:{" "}
                {sel.kind === "walkable"
                  ? `Walkable ${sel.polyId.slice(0, 6)}`
                  : sel.kind === "collider"
                  ? `Collider ${sel.polyId.slice(0, 6)}`
                  : sel.kind === "scene"
                  ? `Scene Zone ${sel.zoneId.slice(0, 6)}`
                  : `Point ${sel.pointId.slice(0, 6)}`}
                {"vertexIndex" in sel && (sel as any).vertexIndex != null ? ` (v${(sel as any).vertexIndex})` : ""}
              </div>
              <button onClick={deleteSelection} className="rounded-md bg-red-500/20 px-2 py-1 hover:bg-red-500/30">
                Delete
              </button>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2">
              <label className="text-[11px] opacity-80">Name</label>
              <input
                value={selectedName}
                onChange={(e) => updateSelectedName(e.target.value)}
                className="w-full rounded-md bg-black/40 px-2 py-1 text-xs outline-none"
              />

              {sel.kind === "scene" && (
                <>
                  <label className="text-[11px] opacity-80">Target Scene ID</label>
                  <input
                    value={selectedTargetSceneId}
                    onChange={(e) => updateSelectedTargetSceneId(e.target.value as SceneId)}
                    placeholder='e.g. "apartment:lobby"'
                    className="w-full rounded-md bg-black/40 px-2 py-1 text-xs outline-none"
                  />
                  <div className="text-[11px] opacity-70">
                    Runtime: if Casper is inside this polygon → trigger scene change to <b>{selectedTargetSceneId || "(unset)"}</b>.
                  </div>
                </>
              )}

              <div className="opacity-70">
                Tip: switch to <b>Select/Edit</b> to drag vertices/points.
              </div>
            </div>
          </div>
        )}

        <div className="mt-2 rounded-lg bg-white/10 p-2 text-[11px] opacity-80">
          <div>
            Native: {bgNative.w}×{bgNative.h}
          </div>
          <div>
            Stage: {Math.round(stageRect.w)}×{Math.round(stageRect.h)}
          </div>
          <div>
            Contain: off({Math.round(contain.offX)},{Math.round(contain.offY)}) · scale {contain.scale.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Drawing surface */}
      <div
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
          {/* ✅ draw exactly over the contained image rect */}
          <g transform={svgTransform}>
            {activeNavmesh && (
              <g>
                {activeNavmesh.walkables.map((poly) => (
                  <PolySvg key={"active-walk-" + poly.id} poly={poly} kind="walkable" selected={false} overlayStyle="active" />
                ))}
                {activeNavmesh.colliders.map((poly) => (
                  <PolySvg key={"active-col-" + poly.id} poly={poly} kind="collider" selected={false} overlayStyle="active" />
                ))}
                {(activeNavmesh as any).sceneChangeZones?.map((z: SceneChangeZone) => (
                  <SceneZoneSvg key={"active-scene-" + z.id} zone={z} selected={false} overlayStyle="active" />
                ))}
                {activeNavmesh.collisionPoints.map((cp) => (
                  <circle
                    key={"active-pt-" + cp.id}
                    cx={cp.p.x}
                    cy={cp.p.y}
                    r={6}
                    fill="rgba(80,255,80,0.25)"
                    stroke="rgba(80,255,80,0.5)"
                    strokeWidth={1}
                  />
                ))}
              </g>
            )}

            {showOverlay &&
              data.walkables.map((poly) => (
                <PolySvg key={poly.id} poly={poly} kind="walkable" selected={sel.kind === "walkable" && sel.polyId === poly.id} />
              ))}

            {showOverlay &&
              data.colliders.map((poly) => (
                <PolySvg key={poly.id} poly={poly} kind="collider" selected={sel.kind === "collider" && sel.polyId === poly.id} />
              ))}

            {showOverlay &&
              data.sceneChangeZones.map((z) => (
                <SceneZoneSvg key={z.id} zone={z} selected={sel.kind === "scene" && sel.zoneId === z.id} />
              ))}

            {showOverlay &&
              data.collisionPoints.map((cp) => (
                <g key={cp.id}>
                  <circle
                    cx={cp.p.x}
                    cy={cp.p.y}
                    r={6}
                    fill={sel.kind === "point" && sel.pointId === cp.id ? "rgba(255,80,80,0.9)" : "rgba(255,80,80,0.6)"}
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={1}
                  />
                  <text x={cp.p.x + 10} y={cp.p.y - 10} fill="rgba(255,255,255,0.85)" fontSize={12} fontFamily="monospace">
                    {cp.name}
                  </text>
                </g>
              ))}

            {showOverlay && (mode === "walkable" || mode === "collider" || mode === "scene") && draft.length > 0 && (
              <DraftSvg points={draft} kind={mode} />
            )}

            {showOverlay && (
              <rect
                x={0}
                y={0}
                width={bgNative.w}
                height={bgNative.h}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={2}
                strokeDasharray="10 10"
              />
            )}
          </g>

          {/* optional: outline the contained rect in STAGE coords */}
          {showOverlay && (
            <rect
              x={contain.offX}
              y={contain.offY}
              width={contain.drawW}
              height={contain.drawH}
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
  overlayStyle,
}: {
  poly: Polygon;
  kind: "walkable" | "collider";
  selected: boolean;
  overlayStyle?: "active";
}) {
  let stroke = kind === "walkable" ? "rgba(80,200,255,0.95)" : "rgba(255,180,60,0.95)";
  let fill = kind === "walkable" ? "rgba(80,200,255,0.15)" : "rgba(255,180,60,0.12)";
  let strokeDasharray: string | undefined = undefined;
  let opacity = 1;

  if (overlayStyle === "active") {
    stroke = kind === "walkable" ? "rgba(80,255,80,0.7)" : "rgba(255,80,80,0.7)";
    fill = kind === "walkable" ? "rgba(80,255,80,0.10)" : "rgba(255,80,80,0.10)";
    strokeDasharray = "6 4";
    opacity = 0.7;
  }

  const d = poly.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <g opacity={opacity}>
      <path d={d} fill={fill} stroke={stroke} strokeWidth={selected ? 3 : 2} strokeDasharray={strokeDasharray} />
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
      <text x={poly.points[0]?.x ?? 0} y={(poly.points[0]?.y ?? 0) - 12} fill="rgba(255,255,255,0.9)" fontSize={12} fontFamily="monospace">
        {poly.name}
      </text>
    </g>
  );
}

function SceneZoneSvg({
  zone,
  selected,
  overlayStyle,
}: {
  zone: SceneChangeZone;
  selected: boolean;
  overlayStyle?: "active";
}) {
  let stroke = "rgba(190,120,255,0.95)";
  let fill = "rgba(190,120,255,0.14)";
  let strokeDasharray: string | undefined = undefined;
  let opacity = 1;

  if (overlayStyle === "active") {
    stroke = "rgba(160,255,160,0.65)";
    fill = "rgba(160,255,160,0.10)";
    strokeDasharray = "6 4";
    opacity = 0.7;
  }

  const d = zone.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <g opacity={opacity}>
      <path d={d} fill={fill} stroke={stroke} strokeWidth={selected ? 3 : 2} strokeDasharray={strokeDasharray} />
      {zone.points.map((p, i) => (
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
        x={zone.points[0]?.x ?? 0}
        y={(zone.points[0]?.y ?? 0) - 12}
        fill="rgba(255,255,255,0.92)"
        fontSize={12}
        fontFamily="monospace"
      >
        {zone.name} → {zone.targetSceneId || "(unset)"}
      </text>
    </g>
  );
}

function DraftSvg({ points, kind }: { points: Pt[]; kind: "walkable" | "collider" | "scene" }) {
  const stroke =
    kind === "walkable"
      ? "rgba(80,200,255,0.9)"
      : kind === "collider"
      ? "rgba(255,180,60,0.9)"
      : "rgba(190,120,255,0.95)";

  const fill =
    kind === "walkable"
      ? "rgba(80,200,255,0.08)"
      : kind === "collider"
      ? "rgba(255,180,60,0.06)"
      : "rgba(190,120,255,0.08)";

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <g>
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeDasharray="6 6" />
      <path d={path + (points.length >= 3 ? " Z" : "")} fill={fill} stroke="none" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={5} fill="rgba(255,255,255,0.85)" stroke={stroke} strokeWidth={2} />
      ))}
    </g>
  );
}
