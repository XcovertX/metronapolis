// app/game/switch.ts
import type { SceneId } from "../sceneGraph";

export type SwitchLoc = SceneId | null;

export function getSwitchLocation(timeMinutes: number): SwitchLoc {
  // Present only during the danger window
  // 12:06–12:10 -> alley-mid
  const start = 12 * 60 + 15;
  const end = 12 * 60 + 20;

  if (timeMinutes >= start && timeMinutes <= end) return "alley-mid";
  return null;
}

function shortName(loc: SceneId) {
  switch (loc) {
    case "alley-mid":
      return "alley";
    default:
      return loc;
  }
}

export function getSwitchDeltaMessages(
  prevTime: number,
  nextTime: number,
  playerScene: SceneId
): string[] {
  const prevLoc = getSwitchLocation(prevTime);
  const nextLoc = getSwitchLocation(nextTime);

  if (prevLoc === nextLoc) return [];

  const msgs: string[] = [];

  // Enters player's scene
  if (nextLoc && nextLoc === playerScene) {
    // We want the specific phrasing you asked for
    msgs.push("A man enters from the east.");
  }

  // Leaves player's scene
  if (prevLoc && prevLoc === playerScene && (!nextLoc || nextLoc !== playerScene)) {
    msgs.push("The man slips back into the dark.");
  }

  return msgs;
}

function isHiddenHere(flags: any, scene: SceneId): boolean {
  return !!flags?.hide && flags.hide.scene === scene;
}

/**
 * If the player is in alley-mid when the danger window begins and they weren't warned,
 * trigger a death event.
 *
 * This is evaluated only on time steps (action or idle), using prev->next.
 */
export function checkSwitchMugging(
  _prevTime: number,
  nextTime: number,
  playerScene: SceneId,
  flags: any
): { death: boolean; messages: string[] } {
  if (playerScene !== "alley-mid") return { death: false, messages: [] };

  // Switch presence is defined by the scheduler
  const loc = getSwitchLocation(nextTime);
  if (loc !== "alley-mid") return { death: false, messages: [] };

  // Warned => no death
  if (flags?.rheaWarned) {
    return {
      death: false,
      messages: ["He scans the alley, then thinks better of it."],
    };
  }

  if (isHiddenHere(flags, playerScene)) {
    return {
        death: false,
        messages: ["The man pauses… then keeps walking. He didn’t see you."],
    };
  }

  // Not warned => death (first time we land inside window while in alley)
  return {
    death: true,
    messages: [
      "Your retinaband flares—too late. Hands clamp down. Breath gone.",
    ],
  };
}
