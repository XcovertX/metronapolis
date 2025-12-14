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
  className?: string;
};

type AnchorSide = "n" | "e" | "s" | "w";

type ExitAnchor = {
  side: AnchorSide;
  /** optional pixel offset along the side (positive/negative) */
  offset?: number;
};

type SceneAnchors = Partial<Record<"n" | "e" | "s" | "w" | "up" | "down", ExitAnchor>>;

/**
 * USER-FRIENDLY ANCHOR PICKING:
 * - Edit this map to control exactly where each exit leaves a node square.
 * - side: which edge of the square the line connects to
 * - offset: shifts the anchor along that edge (px), helpful to reduce overlap
 *
 * Any missing exit anchor falls back to an automatic "best guess" based on
 * the relative position of the connected scene.
 */
const EXIT_ANCHORS: Partial<Record<SceneId, SceneAnchors>> = {
  // ───────── Apartment (z=1)
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

  // hallway feels isolated: force longer run + clean attachment points
  "apt-hallway": {
    n: { side: "n", offset: -6 }, // to living
    e: { side: "e" }, // to fire escape window
    s: { side: "s" }, // to neighbor door (in our layout)
    down: { side: "s", offset: 6 }, // vertical down to lobby
  },
  "neighbor-door": { n: { side: "n" } },

  // fire escape path
  "fire-escape-window": { w: { side: "w" }, e: { side: "e", offset: 6 } },
  "fire-escape-mid": { w: { side: "w" }, up: { side: "n" } },

  // ───────── Ground (z=0)
  lobby: {
    s: { side: "s" }, // to street-front
    e: { side: "e" }, // to elevator
    w: { side: "w" }, // to stairwell-mid
    up: { side: "n", offset: -6 }, // to apt-hallway
    down: { side: "s", offset: 6 }, // to basement-storage
  },
  elevator: { w: { side: "w" }, n: { side: "n" } },
  "security-desk": { s: { side: "s" }, w: { side: "w" } },
  "maintenance-office": { e: { side: "e" }, n: { side: "n" } },
  "service-hall": {
    s: { side: "s" },
    w: { side: "w" },
    e: { side: "e" },
    n: { side: "n", offset: -6 },
  },

  "street-front": { n: { side: "n" }, s: { side: "s" }, w: { side: "w" }, e: { side: "e" } },
  "sidewalk-north": { s: { side: "s" }, n: { side: "n" }, w: { side: "w" }, e: { side: "e" } },
  "sidewalk-south": { n: { side: "n" }, s: { side: "s" }, w: { side: "w" }, e: { side: "e" } },

  // ───────── Basement / Roof (optional examples)
  "basement-storage": { e: { side: "e" }, up: { side: "n" } },
  "boiler-room": { w: { side: "w" } },

  rooftop: { e: { side: "e" }, s: { side: "s" } },
  "rooftop-door": { w: { side: "w" }, e: { side: "e" } },
  "fire-escape-top": { w: { side: "w" }, down: { side: "s" } },
};

type Node = { id: SceneId; x: number; y: number };
type Edge = { a: SceneId; b: SceneId; kind: "same" | "vertical" };

function uniqEdgeKey(a: string, b: string) {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** Automatic fallback anchor side based on relative position (only used if no explicit anchor is set). */
function autoAnchorSide(from: Node, to: Node): AnchorSide {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "e" : "w";
  return dy >= 0 ? "s" : "n";
}

/** Convert an anchor declaration into an actual perimeter point on the node square. */
function anchoredPoint(node: Node, size: number, anchor: ExitAnchor): { x: number; y: number } {
  const half = size / 2;
  const o = anchor.offset ?? 0;
  switch (anchor.side) {
    case "n":
      return { x: node.x + o, y: node.y - half };
    case "s":
      return { x: node.x + o, y: node.y + half };
    case "e":
      return { x: node.x + half, y: node.y + o };
    case "w":
      return { x: node.x - half, y: node.y + o };
  }
}

/**
 * Orthogonal routing with optional dogleg for long runs.
 * Returns an SVG path string "d".
 */
function orthPath(ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;

  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  // Simple L for short connections
  if (adx < 60 || ady < 60) {
    const mx = ax + dx * 0.6;
    return `M ${ax} ${ay} L ${mx} ${ay} L ${mx} ${by} L ${bx} ${by}`;
  }

  // Longer run: add a second bend to feel more organic
  const signX = dx >= 0 ? 1 : -1;
  const signY = dy >= 0 ? 1 : -1;

  const dog = clamp(Math.min(adx, ady) * 0.25, 20, 70);

  const p1x = ax + signX * (adx * 0.45);
  const p1y = ay;

  const p2x = p1x;
  const p2y = ay + signY * dog;

  const p3x = bx - signX * (adx * 0.25);
  const p3y = p2y;

  const p4x = p3x;
  const p4y = by;

  return `M ${ax} ${ay} L ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y} L ${p4x} ${p4y} L ${bx} ${by}`;
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
    "neighbor-door": { x: 280, y: 235 },

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

function findDir(from: SceneId, to: SceneId): "n" | "e" | "s" | "w" | undefined {
  const exits = sceneGraph[from].exits as any;
  if (exits.n === to) return "n";
  if (exits.e === to) return "e";
  if (exits.s === to) return "s";
  if (exits.w === to) return "w";
  return undefined;
}

function getExplicitOrAutoAnchor(from: Node, to: Node, dir: "n" | "e" | "s" | "w", size: number) {
  const explicit = EXIT_ANCHORS[from.id]?.[dir];
  if (explicit) return anchoredPoint(from, size, explicit);

  // auto fallback if not specified
  return anchoredPoint(from, size, { side: autoAnchorSide(from, to) });
}

export default function Minimap_ALT({
  currentId,
  z,
  nodeSize = 18,
  padding = 18,
  className,
}: MinimapALTProps) {
  const currentScene = sceneGraph[currentId];
  const floor = typeof z === "number" ? z : currentScene.z;

  const { nodes, edges, view } = useMemo(() => {
    const entries = Object.entries(sceneGraph) as [SceneId, (typeof sceneGraph)[SceneId]][];
    const floorScenes = entries.filter(([_, s]) => s.z === floor);

    const layout = LAYOUT[floor] ?? {};
    const fallbackSpacing = 55;

    const nodes: Node[] = floorScenes.map(([id, s]) => {
      const pos = layout[id];
      if (pos) return { id, x: pos.x, y: pos.y };
      // fallback if you add scenes later
      return { id, x: s.x * fallbackSpacing, y: -s.y * fallbackSpacing };
    });

    const byId = new Map<SceneId, Node>(nodes.map((n) => [n.id, n]));

    const seen = new Set<string>();
    const edges: Edge[] = [];

    for (const [id, s] of floorScenes) {
      const exits = s.exits as any;

      (["n", "e", "s", "w"] as const).forEach((dir) => {
        const to = exits[dir] as SceneId | undefined;
        if (!to) return;
        const toScene = sceneGraph[to];
        if (!toScene || toScene.z !== floor) return;

        const key = uniqEdgeKey(id, to);
        if (seen.has(key)) return;
        seen.add(key);

        // only draw if both nodes exist on this floor (should)
        if (!byId.has(id) || !byId.has(to)) return;

        edges.push({ a: id, b: to, kind: "same" });
      });

      (["up", "down"] as const).forEach((dir) => {
        const to = exits[dir] as SceneId | undefined;
        if (!to) return;
        const toScene = sceneGraph[to];
        if (!toScene || toScene.z === floor) return;

        const key = `${id}__${dir}`;
        if (seen.has(key)) return;
        seen.add(key);

        edges.push({ a: id, b: to, kind: "vertical" });
      });
    }

    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);

    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;

    return {
      nodes,
      edges,
      view: { minX, minY, width: maxX - minX, height: maxY - minY },
    };
  }, [floor, padding]);

  const byId = useMemo(() => {
    const m = new Map<SceneId, Node>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  const stroke = "#ffffff";
  const dimStroke = "rgba(255,255,255,0.55)";

  return (
    <div className={className} style={{ width: "fit-content" }}>
      <svg
        width={Math.max(240, view.width)}
        height={Math.max(180, view.height)}
        viewBox={`${view.minX} ${view.minY} ${view.width} ${view.height}`}
        style={{ display: "block", background: "transparent" }}
      >
        {/* Edges */}
        {edges.map((e, i) => {
          const a = byId.get(e.a);
          if (!a) return null;

          // vertical: dashed stub (up/down)
          if (e.kind === "vertical") {
            const isUp = (sceneGraph[e.a].exits as any).up === e.b;
            const half = nodeSize / 2;

            const explicit = EXIT_ANCHORS[e.a]?.[isUp ? "up" : "down"];
            const base = explicit
              ? anchoredPoint(a, nodeSize, explicit)
              : { x: a.x, y: a.y + (isUp ? -half : half) };

            const len = 36;
            const end = { x: base.x, y: base.y + (isUp ? -len : len) };

            return (
              <path
                key={`v-${i}`}
                d={`M ${base.x} ${base.y} L ${end.x} ${end.y}`}
                fill="none"
                stroke={dimStroke}
                strokeWidth={2}
                strokeDasharray="5 5"
                strokeLinecap="round"
              />
            );
          }

          const b = byId.get(e.b);
          if (!b) return null;

          const dirAB = findDir(e.a, e.b);
          const dirBA = findDir(e.b, e.a);

          // fallback if data is weird
          if (!dirAB || !dirBA) {
            const d = orthPath(a.x, a.y, b.x, b.y);
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
          }

          const A = getExplicitOrAutoAnchor(a, b, dirAB, nodeSize);
          const B = getExplicitOrAutoAnchor(b, a, dirBA, nodeSize);

          const d = orthPath(A.x, A.y, B.x, B.y);

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
