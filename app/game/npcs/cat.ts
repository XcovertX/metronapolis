// app/game/cat.ts
import type { SceneId } from "../sceneGraph";

export type CatLoc = SceneId | null;

export function getCatLocation(timeMinutes: number): CatLoc {
  // Example schedule (edit freely)
  // 12:00–12:09 bedroom
  // 12:10–12:19 living
  // 12:20–12:29 kitchen
  if (timeMinutes < 12 * 60 + 10) return "apt-bedroom";
  if (timeMinutes < 12 * 60 + 20) return "apt-living";
  if (timeMinutes < 12 * 60 + 30) return "apt-kitchen";
  return null;
}

function shortName(loc: SceneId) {
  switch (loc) {
    case "apt-bedroom":
      return "bedroom";
    case "apt-living":
      return "living room";
    case "apt-kitchen":
      return "kitchen";
    default:
      return loc;
  }
}

export function getCatDeltaMessages(
  prevTime: number,
  nextTime: number,
  playerScene: SceneId
): string[] {
  const prevLoc = getCatLocation(prevTime);
  const nextLoc = getCatLocation(nextTime);

  if (prevLoc === nextLoc) return [];

  const msgs: string[] = [];

  // Cat enters player's scene
  if (nextLoc && nextLoc === playerScene) {
    if (prevLoc) {
      msgs.push(`A gray cat pads in from the ${shortName(prevLoc)}.`);
    } else {
      msgs.push("A gray cat appears at the edge of your vision, silent as a thought.");
    }
  }

  // Cat leaves player's scene
  if (prevLoc && prevLoc === playerScene) {
    if (nextLoc) {
      msgs.push(`The cat slips out toward the ${shortName(nextLoc)}.`);
    } else {
      msgs.push("The cat vanishes into a gap you swear wasn’t there a second ago.");
    }
  }

  return msgs;
}
