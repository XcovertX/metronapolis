// app/components/Minimap.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { sceneGraph, SceneId } from "@/app/game/sceneGraph";

type MinimapProps = {
  /** current scene to center + highlight */
  currentId?: SceneId;
  /** which floor to draw (basement -1, ground 0, apartment 1, roof 2) */
  z?: number;
  /** scale factor for tiles (32px tile * scale). default 1 */
  scale?: number;
  /** extra padding in tiles around bounds */
  padTiles?: number;
  className?: string;
};

const TILESET_SRC = "/assets/minimap.png"; // 96x128
const TILE_PX = 32; // each tile 32x32
const TILESET_COLS = 3; // 96 / 32
const ROOM_TILES = 3; // we draw each scene as a 3x3 "room"
const GAP = 1; // 1 tile gap between rooms (keeps walls readable)

// Tile locations (col,row) in the tileset
// User mapping had a duplicate "11"; we assume the second one is "12" for TOP horizontal.
const T = {
  OUT_TL: { c: 0, r: 0 }, // 00 - top left outer corner wall
  OUT_TR: { c: 1, r: 0 }, // 01 - top right outer corner wall
  OUT_BR: { c: 2, r: 0 }, // 02 - bottom right outer corner wall
  OUT_BL: { c: 0, r: 1 }, // 10 - bottom left outer corner wall

  H_BOT: { c: 1, r: 1 }, // 11 - bottom horizontal wall
  H_TOP: { c: 2, r: 1 }, // 12 - top horizontal wall (assumed)

  V_R: { c: 0, r: 2 }, // 20 - right vertical wall
  V_L: { c: 1, r: 2 }, // 21 - left vertical wall

  IN_TL: { c: 2, r: 2 }, // 22 - top left inner corner wall
  IN_TR: { c: 0, r: 3 }, // 30 - top right inner corner wall
  IN_BR: { c: 1, r: 3 }, // 31 - bottom right inner corner wall
  IN_BL: { c: 2, r: 3 }, // 32 - bottom left inner corner wall
} as const;

type Tile = { c: number; r: number } | null;

function drawTile(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  tile: Exclude<Tile, null>,
  dx: number,
  dy: number,
  scale: number
) {
  const sx = tile.c * TILE_PX;
  const sy = tile.r * TILE_PX;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    sx,
    sy,
    TILE_PX,
    TILE_PX,
    dx,
    dy,
    TILE_PX * scale,
    TILE_PX * scale
  );
}

/**
 * Build a 3x3 tile "room":
 * [ corner, top wall, corner ]
 * [ left wall, empty, right wall ]
 * [ corner, bottom wall, corner ]
 *
 * Openings remove the wall tile (set it to null).
 * Inner corners are used when TWO adjacent sides are "open" (concave corner).
 */
function getRoomTiles(id: SceneId): Tile[][] {
  const exits = sceneGraph[id].exits;

  const openN = exits && "n" in exits;
  const openS = exits && "s" in exits;
  const openW = exits && "w" in exits;
  const openE = exits && "e" in exits;

  // corners: use inner corners for concave shapes when adjacent sides are open
  const tl: Tile = openN && openW ? T.IN_TL : T.OUT_TL;
  const tr: Tile = openN && openE ? T.IN_TR : T.OUT_TR;
  const br: Tile = openS && openE ? T.IN_BR : T.OUT_BR;
  const bl: Tile = openS && openW ? T.IN_BL : T.OUT_BL;

  // walls: null means "no wall drawn" (transparent opening)
  const top: Tile = openN ? null : T.H_TOP;
  const bot: Tile = openS ? null : T.H_BOT;
  const left: Tile = openW ? null : T.V_L;
  const right: Tile = openE ? null : T.V_R;

  return [
    [tl, top, tr],
    [left, null, right],
    [bl, bot, br],
  ];
}

export default function Minimap({
  currentId,
  z = 0,
  scale = 1,
  padTiles = 2,
  className,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  const scenesOnZ = useMemo(() => {
    const entries = Object.entries(sceneGraph) as [SceneId, (typeof sceneGraph)[SceneId]][];
    return entries.filter(([_, s]) => s.z === z);
  }, [z]);

  const bounds = useMemo(() => {
    if (scenesOnZ.length === 0) return null;
    const xs = scenesOnZ.map(([_, s]) => s.x);
    const ys = scenesOnZ.map(([_, s]) => s.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }, [scenesOnZ]);

  useEffect(() => {
    const i = new Image();
    i.src = TILESET_SRC;
    i.onload = () => setImg(i);
  }, []);

  useEffect(() => {
    if (!img || !bounds) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gridW = bounds.maxX - bounds.minX + 1;
    const gridH = bounds.maxY - bounds.minY + 1;

    const totalTilesW = gridW * (ROOM_TILES + GAP) - GAP + padTiles * 2;
    const totalTilesH = gridH * (ROOM_TILES + GAP) - GAP + padTiles * 2;

    canvas.width = totalTilesW * TILE_PX * scale;
    canvas.height = totalTilesH * TILE_PX * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Map scene coords -> tile origin in canvas space
    const toTileOrigin = (x: number, y: number) => {
      const gx = x - bounds.minX;
      const gy = bounds.maxY - y; // invert Y so larger y is "north" visually
      const ox = padTiles + gx * (ROOM_TILES + GAP);
      const oy = padTiles + gy * (ROOM_TILES + GAP);
      return { ox, oy };
    };

    for (const [id, s] of scenesOnZ) {
      const { ox, oy } = toTileOrigin(s.x, s.y);
      const room = getRoomTiles(id);

      // draw 3x3
      for (let ry = 0; ry < ROOM_TILES; ry++) {
        for (let rx = 0; rx < ROOM_TILES; rx++) {
          const tile = room[ry][rx];
          if (!tile) continue;

          drawTile(
            ctx,
            img,
            tile,
            (ox + rx) * TILE_PX * scale,
            (oy + ry) * TILE_PX * scale,
            scale
          );
        }
      }

      // highlight current room (simple overlay)
      if (currentId && id === currentId) {
        const px = ox * TILE_PX * scale;
        const py = oy * TILE_PX * scale;
        const w = ROOM_TILES * TILE_PX * scale;
        const h = ROOM_TILES * TILE_PX * scale;

        ctx.save();
        // ctx.globalAlpha = 0.25;
        ctx.fillStyle = "#6ee663ff";
        ctx.fillRect(px+10, py+10, w-20, h-20);
        ctx.restore();
      }
    }
  }, [img, bounds, scenesOnZ, currentId, z, scale, padTiles]);

  return (
    <div className={className} style={{ width: "fit-content" }}>
      <canvas
        ref={canvasRef}
        style={{
          imageRendering: "pixelated",
          display: "block",
        }}
      />
    </div>
  );
}
