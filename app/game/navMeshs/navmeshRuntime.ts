// app/game/navmeshRuntime.ts
export type Pt = { x: number; y: number };

export type Polygon = {
  id: string;
  name: string;
  points: Pt[];
};

export type WalkCollisionData = {
  version: 1;
  walkables: Polygon[];
  colliders: Polygon[];
  collisionPoints: { id: string; name: string; p: Pt }[];
};

export function pointInPoly(pt: Pt, poly: Pt[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;

    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

export function isInsideAny(pt: Pt, polys: Polygon[]) {
  for (const p of polys) {
    if (p.points.length >= 3 && pointInPoly(pt, p.points)) return true;
  }
  return false;
}

/**
 * "Walkable" definition:
 * - inside at least one walkable polygon
 * - NOT inside any collider polygon
 */
export function isWalkable(pt: Pt, nav: WalkCollisionData) {
  // ✅ If you haven't drawn walkables yet, treat whole world as walkable.
  const hasWalkables = nav.walkables?.length > 0;

  const inWalk = hasWalkables ? isInsideAny(pt, nav.walkables) : true;
  if (!inWalk) return false;

  const inBlock = isInsideAny(pt, nav.colliders);
  return !inBlock;
}

/**
 * Moves from `from` toward `to` by `step` pixels, but prevents entering colliders/outside walkables.
 * Simple behavior: if blocked, stop at `from` (you can upgrade to sliding later).
 */
export function stepWithCollision(from: Pt, to: Pt, step: number, nav: WalkCollisionData): Pt {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return from;

  const t = Math.min(1, step / dist);
  const next = { x: from.x + dx * t, y: from.y + dy * t };

  // allow move only if next spot is walkable
  if (isWalkable(next, nav)) return next;

  // blocked -> stop (simple + reliable)
  return from;
}
