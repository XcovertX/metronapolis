// app/game/events/hide.ts
import type { EventModule } from "./types";
import type { PlayerOption } from "../../components/OptionsContext";
import { TIME } from "../timeRules";
import { getHideSpot } from "../hideSpots";

type HideFlags = {
  hide?: {
    scene: string;     // SceneId, stored as string to keep flags loose
    spotId: string;
  };
};

export const hideEvent: EventModule = {
  id: "mechanic.hide",

  getOptions: (ctx, h) => {
    const spot = getHideSpot(ctx.scene);
    const flags = ctx.flags as HideFlags;

    const hiddenHere =
      !!flags.hide && flags.hide.scene === ctx.scene && flags.hide.spotId === spot?.id;

    const opts: PlayerOption[] = [];

    // If no hide spot, nothing to do.
    if (!spot) return opts;

    if (!hiddenHere) {
      opts.push({
        id: `hide-${spot.id}`,
        kind: "action",
        label: spot.label,
        onSelect: () => {
          h.advanceTime(TIME.DEFAULT_ACTION); // or TIME.CAREFUL_ACTION if you have it
          h.setFlags((prev: any) => ({
            ...prev,
            hide: { scene: ctx.scene, spotId: spot.id },
          }));
          // show feedback using sceneMessages if you want; for now we just set state
          // (optional) you can push a message by adding a "pushMessage" helper later
        },
      });
    } else {
      opts.push({
        id: `unhide-${spot.id}`,
        kind: "action",
        label: "Stop hiding.",
        onSelect: () => {
          h.advanceTime(TIME.DEFAULT_ACTION);
          h.setFlags((prev: any) => {
            const next = { ...prev };
            delete next.hide;
            return next;
          });
        },
      });
    }

    return opts;
  },
};
