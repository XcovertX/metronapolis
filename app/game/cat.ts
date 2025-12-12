// app/game/cat.ts
import type { SceneId } from "../components/LoopStateContext";

/**
 * Returns which room the cat is currently in, based on loop time.
 * Only ever returns an apartment scene or null (cat wandered off).
 */
export function getCatLocation(timeMinutes: number): SceneId | null {
  // Simple schedule for now:
  // Before 12:00      → Bedroom
  // 12:00–12:09       → Bedroom
  // 12:10–12:19       → Living
  // 12:20–12:29       → Kitchen
  // 12:30+            → Cat is elsewhere (null)
  if (timeMinutes < 12 * 60 + 10) {
    return "apt-bedroom";
  }
  if (timeMinutes < 12 * 60 + 20) {
    return "apt-living";
  }
  if (timeMinutes < 12 * 60 + 30) {
    return "apt-kitchen";
  }
  return null;
}
