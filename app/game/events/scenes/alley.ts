// app/game/events/ambient/alley.ts
import type { EventCtx } from "../types";

export function alleyAmbient(ctx: EventCtx) {
  if (ctx.scene !== "alley-mid") return [];

  if (ctx.timeMinutes === 12 * 60 + 6) {
    return [
      {
        type: "text",
        text: "A man enters the alley from the east, pausing as his eyes adjust to the dark.",
      },
    ];
  }

  return [];
}
