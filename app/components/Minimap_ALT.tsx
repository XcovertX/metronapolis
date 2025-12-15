// app/components/minimap_ALT.tsx
"use client";

import React, { useMemo } from "react";
import { sceneGraph, SceneId } from "@/app/game/sceneGraph";

type MinimapALTProps = {
  currentId: SceneId;
  /** which floor to draw (basement -1, ground 0, apartment 1, roof 2) */
  z?: number;
  /** square size in px */
  nodeSize?: number;
  /** padding around content */
  padding?: number;
  /** minimum distance a path must travel straight out of an exit before any turn */
  exitLeadPx?: number;
  className?: string;
};

type AnchorSide = "n" | "e" | "s" | "w";
type Axis = "x" | "y";

type ExitAnchor = {
  side: AnchorSide;
  /** optional pixel offset along the side (positive/negative) */
  offset?: number;
};

type SceneAnchors = Partial<Record<"n" | "e" | "s" | "w" | "up" | "down", ExitAnchor>>;

/**
 * Designers edit THIS to choose which edge an exit uses (and small offsets).
 * Missing entries fall back to automatic anchors.
 */
const EXIT_ANCHORS: Partial<Record<SceneId, SceneAnchors>> = {
  // Apartment (z=1)
  "apt-living": {
    w: { side: "w" },
    e: { side: "e" },
    n: { side: "n" },
    s: { side: "s" },
  },
  "apt-bedroom": { e: { side: "e" } },
  "apt-kitchen": { w: { side: "w" }, n: { side: "n" } },
  "apt-bathroom": { s: { side: "s" } },
  "utility-closet": { s: { side: "s" } },
  "apt-hallway": {
    n: { side: "n" },
    e: { side: "e" },
    w: { side: "w" },
    down: { side: "s" },
  },
  "neighbor-door": { e: { side: "e" } },
  "fire-escape-window": { w: { side: "w" }, e: { side: "e" } },
  "fire-escape-mid": { w: { side: "w" }, up: { side: "n" } },

  // Ground (z=0)
  lobby: {
    s: { side: "s" },
    e: { side: "e" },
    w: { side: "w" },
    up: { side: "n" },
    down: { side: "s" },
  },
  elevator: { w: { side: "w" }, n: { side: "n" } },
  "security-desk": { s: { side: "s" }, w: { side: "w" } },
  "maintenance-office": { e: { side: "e" }, n: { side: "n" } },
  "service-hall": { s: { side: "s" }, w: { side: "w" }, e: { side: "e" }, n: { side: "n" } },
  "street-front": { n: { side: "n" }, s: { side: "s" }, w: { side: "w" }, e: { side: "e" } },
  "sidewalk-north": { s: { side: "s" }, n: { side: "n" }, w: { side: "w" }, e: { side: "e" } },
  "sidewalk-south": { n: { side: "n" }, s: { side: "s" }, w: { side: "w" }, e: { side: "e" } },
};

/**
 * Designers edit THIS to choose how “wiggly” a long connection is.
 * - Key by source+dir: "apt-hallway:n" (recommended)
 * - Or by pair: "apt-hallway->apt-living"
 */
type RouteSpec = {
  turns: 1 | 2 | 3 | 4;
  startAxis?: Axis;
  detourPx?: number;
};
const ROUTE_SPECS: Partial<Record<string, RouteSpec>> = {
  "apt-hallway:n": { turns: 3, startAxis: "x", detourPx: 20 },
  "apt-hallway:e": { turns: 2, startAxis: "x", detourPx: 16 },
  "alley-entrance->alley-mid": { turns: 2, startAxis: "x", detourPx: 10 },
};

type Node = { id: SceneId; x: number; y: number };
type Edge = { a: SceneId; b: SceneId; kind: "same" | "vertical" };

type AnchorPoint = { x: number; y: number; side: AnchorSide };

function uniqEdgeKey(a: string, b: string) {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function autoAnchorSide(from: Node, to: Node): AnchorSide {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "e" : "w";
  return dy >= 0 ? "s" : "n";
}

function anchoredPoint(node: Node, size: number, anchor: ExitAnchor): AnchorPoint {
  const half = size / 2;
  const o = anchor.offset ?? 0;
  switch (anchor.side) {
    case "n":
      return { x: node.x + o, y: node.y - half, side: "n" };
    case "s":
      return { x: node.x + o, y: node.y + half, side: "s" };
    case "e":
      return { x: node.x + half, y: node.y + o, side: "e" };
    case "w":
      return { x: node.x - half, y: node.y + o, side: "w" };
  }
}

function findDir(from: SceneId, to: SceneId): "n" | "e" | "s" | "w" | undefined {
  const exits = sceneGraph[from].exits as any;
  if (exits.n === to) return "n";
  if (exits.e === to) return "e";
  if (exits.s === to) return "s";
  if (exits.w === to) return "w";
  return undefined;
}

function getExplicitOrAutoAnchor(from: Node, to: Node, dir: "n" | "e" | "s" | "w", size: number): AnchorPoint {
  const explicit = EXIT_ANCHORS[from.id]?.[dir];
  if (explicit) return anchoredPoint(from, size, explicit);
  return anchoredPoint(from, size, { side: autoAnchorSide(from, to) });
}

function routeKeyDir(a: SceneId, dir: "n" | "e" | "s" | "w") {
  return `${a}:${dir}`;
}
function routeKeyPair(a: SceneId, b: SceneId) {
  return `${a}->${b}`;
}
function getRouteSpec(a: SceneId, b: SceneId, dirAB?: "n" | "e" | "s" | "w"): RouteSpec | undefined {
  if (dirAB) {
    const byDir = ROUTE_SPECS[routeKeyDir(a, dirAB)];
    if (byDir) return byDir;
  }
  return ROUTE_SPECS[routeKeyPair(a, b)] ?? ROUTE_SPECS[routeKeyPair(b, a)];
}

function moveAlongSide(p: { x: number; y: number }, side: AnchorSide, dist: number) {
  switch (side) {
    case "n":
      return { x: p.x, y: p.y - dist };
    case "s":
      return { x: p.x, y: p.y + dist };
    case "e":
      return { x: p.x + dist, y: p.y };
    case "w":
      return { x: p.x - dist, y: p.y };
  }
}

/**
 * Build an orthogonal polyline with a designer-specified number of turns,
 * AND enforce "lead-out" / "lead-in" so lines don't immediately run along a square's edge.
 *
 * - Start at A (on perimeter), go straight OUT by leadPx in A.side before any turns.
 * - Route in the middle.
 * - End by coming straight IN toward B (approach point), then final straight segment onto B.
 */
function orthoPathWithTurnsAndLeads(A: AnchorPoint, B: AnchorPoint, spec: RouteSpec | undefined, leadPx: number) {
  const a0 = { x: A.x, y: A.y };
  const b0 = { x: B.x, y: B.y };

  // Points immediately outside/inside the node squares.
  const a1 = moveAlongSide(a0, A.side, leadPx);
  const b1 = moveAlongSide(b0, B.side, leadPx); // we will route to this "approach" point, then go straight to b0

  const ax = a1.x;
  const ay = a1.y;
  const bx = b1.x;
  const by = b1.y;

  const dx = bx - ax;
  const dy = by - ay;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  const isShort = adx < 60 || ady < 60;
  const turns: number = spec?.turns ?? (isShort ? 1 : 2);
  const startAxis: Axis = spec?.startAxis ?? (adx >= ady ? "x" : "y");
  const detour =
    spec?.detourPx ??
    (turns >= 2 && !isShort ? clamp(Math.min(adx, ady) * 0.12, 8, 22) : 0);

  const points: Array<{ x: number; y: number }> = [];

  // Always include the forced lead-out
  points.push(a0);
  points.push(a1);

  const segments = turns + 1;

  const xMoves = startAxis === "x" ? Math.ceil(segments / 2) : Math.floor(segments / 2);
  const yMoves = segments - xMoves;

  const xTargets: number[] = [];
  const yTargets: number[] = [];

  for (let i = 1; i < xMoves; i++) xTargets.push(ax + (dx * i) / xMoves);
  for (let i = 1; i < yMoves; i++) yTargets.push(ay + (dy * i) / yMoves);

  let curX = ax;
  let curY = ay;
  let xi = 0;
  let yi = 0;

  for (let s = 0; s < segments; s++) {
    const axis: Axis = (startAxis === "x" ? s % 2 === 0 : s % 2 === 1) ? "x" : "y";

    if (axis === "x") {
      const nextX = s === segments - 1 ? bx : xTargets[xi++] ?? bx;
      const nudgeY = detour && s > 0 && s < segments - 1 ? (s % 4 < 2 ? detour : -detour) : 0;
      curX = nextX;
      points.push({ x: curX, y: curY + nudgeY });
      curY = curY + nudgeY;
    } else {
      const nextY = s === segments - 1 ? by : yTargets[yi++] ?? by;
      const nudgeX = detour && s > 0 && s < segments - 1 ? (s % 4 < 2 ? -detour : detour) : 0;
      curY = nextY;
      points.push({ x: curX + nudgeX, y: curY });
      curX = curX + nudgeX;
    }
  }

  // Enforce lead-in then final straight onto B
  points.push(b1);
  points.push(b0);

  // Cleanup collinear/duplicate points (keeps SVG paths tidy)
  const cleaned: typeof points = [];
  for (const p of points) {
    const last = cleaned[cleaned.length - 1];
    if (last && last.x === p.x && last.y === p.y) continue;
    cleaned.push(p);
  }

  // remove middle point if it lies on straight line between neighbors (collinear)
  const simplified: typeof cleaned = [cleaned[0]];
  for (let i = 1; i < cleaned.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const cur = cleaned[i];
    const next = cleaned[i + 1];
    const collinear =
      (prev.x === cur.x && cur.x === next.x) || (prev.y === cur.y && cur.y === next.y);
    if (collinear) continue;
    simplified.push(cur);
  }
  simplified.push(cleaned[cleaned.length - 1]);

  return simplified.reduce((acc, p, idx) => {
    if (idx === 0) return `M ${p.x} ${p.y}`;
    return `${acc} L ${p.x} ${p.y}`;
  }, "");
}

/**
 * Freeform layout (pixel coords) per floor.
 * Tweak these for “real-ish” separation (clusters + stretched connectors).
 */
const LAYOUT: Partial<Record<number, Partial<Record<SceneId, { x: number; y: number }>>>> = {
  1: {
    "apt-living": { x: 140, y: 90 },
    "apt-bedroom": { x: 90, y: 90 },
    "apt-kitchen": { x: 190, y: 90 },
    "apt-bathroom": { x: 140, y: 40 },
    "utility-closet": { x: 190, y: 40 },
    "apt-hallway": { x: 280, y: 170 },
    "neighbor-door": { x: 190, y: 170 },
    "fire-escape-window": { x: 360, y: 170 },
    "fire-escape-mid": { x: 430, y: 140 },
  },
  0: {
    lobby: { x: 260, y: 210 },
    elevator: { x: 320, y: 195 },
    "security-desk": { x: 380, y: 175 },
    "maintenance-office": { x: 300, y: 150 },
    "service-hall": { x: 280, y: 110 },
    "building-laundry": { x: 220, y: 110 },
    "stairwell-mid": { x: 200, y: 190 },
    "courtyard-int": { x: 360, y: 110 },
    "street-front": { x: 260, y: 280 },
    "sidewalk-north": { x: 260, y: 335 },
    "sidewalk-south": { x: 260, y: 230 },
    "courtyard-ext": { x: 355, y: 230 },
    "service-door": { x: 330, y: 260 },
    "loading-zone": { x: 160, y: 240 },
    "alley-entrance": { x: 345, y: 300 },
    "alley-mid": { x: 420, y: 300 },
    dumpster: { x: 495, y: 300 },
    "dead-end": { x: 570, y: 300 },
    "bike-rack": { x: 170, y: 300 },
    "side-street-west": { x: 95, y: 300 },
    "store-front": { x: 260, y: 405 },
    "store-interior": { x: 260, y: 470 },
    "store-stock": { x: 260, y: 535 },
    "laundromat-front": { x: 170, y: 405 },
    "laundromat-interior": { x: 170, y: 470 },
    "streetlight": { x: 340, y: 335 },
    "cafe-front": { x: 340, y: 405 },
    "cafe-interior": { x: 340, y: 470 },
    "cafe-back": { x: 300, y: 470 },
    "clinic-front": { x: 430, y: 335 },
    "clinic-waiting": { x: 430, y: 405 },
    "phone-booth": { x: 520, y: 335 },
    "ticket-kiosk": { x: 90, y: 470 },
    "transit-platform": { x: 30, y: 470 },
    "side-street-east": { x: 430, y: 260 },
  },
  [-1]: {
    "basement-storage": { x: 220, y: 120 },
    "boiler-room": { x: 310, y: 120 },
  },
  2: {
    "fire-escape-top": { x: 430, y: 110 },
    "rooftop-door": { x: 360, y: 110 },
    rooftop: { x: 290, y: 110 },
    "rooftop-shack": { x: 230, y: 165 },
  },
};

export default function Minimap_ALT({
  currentId,
  z,
  nodeSize = 10,
  padding = 10,
  exitLeadPx,
  className,

  // NEW: “camera window” controls
  windowPx = 210,          // radius (in layout pixels) around current node
  windowPaddingPx = 26,    // extra padding so lines aren’t clipped
}: MinimapALTProps & {
  /** radius in layout pixels around current node to include nodes */
  windowPx?: number;
  /** extra slack around the window for path/lead lines */
  windowPaddingPx?: number;
}) {
  const currentScene = sceneGraph[currentId];
  const floor = typeof z === "number" ? z : currentScene.z;

  // Default lead distance: proportional to node size, but never tiny.
  const leadPx = exitLeadPx ?? Math.max(12, Math.round(nodeSize * 0.9));

  const { nodes, edges, view } = useMemo(() => {
    const entries = Object.entries(sceneGraph) as [
      SceneId,
      (typeof sceneGraph)[SceneId]
    ][];
    const floorScenes = entries.filter(([_, s]) => s.z === floor);

    const layout = LAYOUT[floor] ?? {};
    const fallbackSpacing = 55;

    // Build all nodes for the floor
    const allNodes: Node[] = floorScenes.map(([id, s]) => {
      const pos = layout[id];
      if (pos) return { id, x: pos.x, y: pos.y };
      return { id, x: s.x * fallbackSpacing, y: -s.y * fallbackSpacing };
    });

    const byIdAll = new Map<SceneId, Node>(allNodes.map((n) => [n.id, n]));
    const center = byIdAll.get(currentId);

    // Safety fallback: if no center node (shouldn't happen), show everything
    const cx = center?.x ?? 0;
    const cy = center?.y ?? 0;

    // Keep only nodes within windowPx (circle-ish) of current node
    const keep = new Set<SceneId>();
    for (const n of allNodes) {
      const dx = n.x - cx;
      const dy = n.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) - 40;
      if (dist <= windowPx) keep.add(n.id);
    }

    // Always keep current node (even if windowPx tiny)
    keep.add(currentId);

    const nodes: Node[] = allNodes.filter((n) => keep.has(n.id));
    const byId = new Map<SceneId, Node>(nodes.map((n) => [n.id, n]));

    // Build edges, but only if at least one endpoint is in window.
    // (This keeps connectors that cross the window boundary from disappearing abruptly.)
    const seen = new Set<string>();
    const edges: Edge[] = [];

    for (const [id, s] of floorScenes) {
      const exits = s.exits as any;

      // Cardinal edges (same floor)
      (["n", "e", "s", "w"] as const).forEach((dir) => {
        const to = exits[dir] as SceneId | undefined;
        if (!to) return;

        const toScene = sceneGraph[to];
        if (!toScene || toScene.z !== floor) return;

        // Only draw if either endpoint is visible
        if (!keep.has(id) && !keep.has(to)) return;

        const key = uniqEdgeKey(id, to);
        if (seen.has(key)) return;
        seen.add(key);

        // Only render path if we have node coords for both endpoints
        if (!byIdAll.has(id) || !byIdAll.has(to)) return;
        edges.push({ a: id, b: to, kind: "same" });
      });

      // Vertical edges (stub only from visible nodes)
      (["up", "down"] as const).forEach((dir) => {
        const to = exits[dir] as SceneId | undefined;
        if (!to) return;

        const toScene = sceneGraph[to];
        if (!toScene || toScene.z === floor) return;

        if (!keep.has(id)) return;

        const key = `${id}__${dir}`;
        if (seen.has(key)) return;
        seen.add(key);

        edges.push({ a: id, b: to, kind: "vertical" });
      });
    }

    // ViewBox becomes a “camera window” centered on current node.
    // Add padding to avoid clipping lead-outs/turns.
    const halfW = windowPx + windowPaddingPx;
    const halfH = windowPx + windowPaddingPx;

    const minX = cx - halfW;
    const minY = cy - halfH;
    const width = halfW * 2;
    const height = halfH * 2;

    return {
      nodes,
      edges,
      view: { minX, minY, width, height },
    };
  }, [currentId, floor, padding, nodeSize, leadPx, windowPx, windowPaddingPx]);

  const byId = useMemo(() => {
    const m = new Map<SceneId, Node>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  const stroke = "#ffffff";
  const dimStroke = "rgba(255,255,255,0.55)";

  return (
    <div className={className} style={{ width: "fit-content", background: "green", opacity: 0.5 }}>
      <svg
        width={Math.max(240, view.width)}
        height={Math.max(180, view.height)}
        viewBox={`${view.minX} ${view.minY} ${view.width} ${view.height}`}
        style={{ display: "block", background: "transparent" }}
      >
        {/* Edges */}
        {edges.map((e, i) => {
          const a = (LAYOUT[floor]?.[e.a] ? byId.get(e.a) : undefined) ?? byId.get(e.a);
          // we still need coordinates even if node is not in window (edge can touch boundary),
          // so pull from full layout via sceneGraph fallback when missing.
          const aNode =
            a ??
            (() => {
              const s = sceneGraph[e.a];
              const fallbackSpacing = 55;
              const pos = LAYOUT[floor]?.[e.a];
              return pos
                ? ({ id: e.a, x: pos.x, y: pos.y } as Node)
                : ({ id: e.a, x: s.x * fallbackSpacing, y: -s.y * fallbackSpacing } as Node);
            })();

          if (e.kind === "vertical") {
            const isUp = (sceneGraph[e.a].exits as any).up === e.b;
            const dirKey = isUp ? "up" : "down";

            const explicit = EXIT_ANCHORS[e.a]?.[dirKey];
            const base = explicit
              ? anchoredPoint(aNode, nodeSize, explicit)
              : anchoredPoint(aNode, nodeSize, { side: isUp ? "n" : "s" });

            const p0 = { x: base.x, y: base.y };
            const p1 = moveAlongSide(p0, base.side, leadPx);
            const p2 = moveAlongSide(p1, base.side, 24);

            return (
              <path
                key={`v-${i}`}
                d={`M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                fill="none"
                stroke={dimStroke}
                strokeWidth={2}
                strokeDasharray="5 5"
                strokeLinecap="round"
              />
            );
          }

          const b = byId.get(e.b) ??
            (() => {
              const s = sceneGraph[e.b];
              const fallbackSpacing = 55;
              const pos = LAYOUT[floor]?.[e.b];
              return pos
                ? ({ id: e.b, x: pos.x, y: pos.y } as Node)
                : ({ id: e.b, x: s.x * fallbackSpacing, y: -s.y * fallbackSpacing } as Node);
            })();

          const dirAB = findDir(e.a, e.b);
          const dirBA = findDir(e.b, e.a);
          if (!dirAB || !dirBA) return null;

          const A = getExplicitOrAutoAnchor(aNode, b, dirAB, nodeSize);
          const B = getExplicitOrAutoAnchor(b, aNode, dirBA, nodeSize);

          const spec = getRouteSpec(e.a, e.b, dirAB);
          const d = orthoPathWithTurnsAndLeads(A, B, spec, leadPx);

          return (
            <path
              key={`e-${i}`}
              d={d}
              fill="none"
              stroke={dimStroke}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((n) => {
          const isActive = n.id === currentId;
          const half = nodeSize / 2;

          return (
            <g key={n.id}>
              <rect
                x={n.x - half}
                y={n.y - half}
                width={nodeSize}
                height={nodeSize}
                rx={3}
                ry={3}
                fill={isActive ? "#ffffff" : "transparent"}
                stroke={stroke}
                strokeWidth={2}
                opacity={isActive ? 1 : 0.9}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

