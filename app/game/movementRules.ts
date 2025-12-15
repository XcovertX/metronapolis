// app/game/movementRules.ts
import type { SceneId, Direction } from "@/app/game/sceneGraph";

export type MoveCtx = {
  flags: any;
  inventory: any[];
  npcState: any;
  timeMinutes: number;
};

export function canEnterScene(to: SceneId, ctx: MoveCtx): boolean {
  // Neighbor apartment is locked until door is unlocked
  if (
    to === "neighbor-foyer" ||
    to === "neighbor-living" ||
    to === "neighbor-bedroom" ||
    to === "neighbor-kitchen" ||
    to === "neighbor-bath"
  ) {
    return !!ctx.flags?.neighborDoorUnlocked;
  }

  return true;
}

/**
 * Optional: if you want to lock a specific transition rather than whole scenes.
 * Example: only lock neighbor-door -> neighbor-foyer.
 */
export function canTraverse(from: SceneId, dir: Direction, to: SceneId, ctx: MoveCtx): boolean {
  // lock the doorway transition specifically
  if (from === "neighbor-door" && dir === "w" && to === "neighbor-foyer") {
    return !!ctx.flags?.neighborDoorUnlocked;
  }

  // otherwise fall back to scene rule
  return canEnterScene(to, ctx);
}
