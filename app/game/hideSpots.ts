// app/game/hideSpots.ts
import type { SceneId } from "./sceneGraph";

export type HideSpot = {
  id: string;
  label: string;      // shown as option text
  enterText: string;  // message when hiding
  exitText: string;   // message when un-hiding
};

export const HIDE_SPOTS: Partial<Record<SceneId, HideSpot>> = {
  "alley-mid": {
    id: "alley-dumpster",
    label: "Hide behind the dumpster.",
    enterText: "You slip behind the dumpster, holding your breath.",
    exitText: "You step back out from behind the dumpster.",
  },

  // add more later:
  // "service-hall": { ... },
  // "cafe-interior": { ... },
};

export function getHideSpot(scene: SceneId): HideSpot | null {
  return HIDE_SPOTS[scene] ?? null;
}
