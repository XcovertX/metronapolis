// app/game/events/npcs/switch.ts
import type { EventModule } from "../types";
import type { PlayerOption } from "../../../components/OptionsContext";
import { TIME } from "../../timeRules";
import { getSwitchLocation } from "../../npcs/switch";

export const switchNpc: EventModule = {
  id: "npc.switch",

  nodes: {
    "switch.stare": {
      id: "switch.stare",
      npc: "Switch",
      text: "Wrong minute to be brave.",
      responses: [
        { label: "Back off.", timeCost: TIME.DEFAULT_ACTION },
        { label: "Say nothing.", timeCost: TIME.DEFAULT_ACTION },
      ],
    },
  },

  getOptions: (ctx, h) => {
    // Only show when Switch is actually in this scene right now
    const loc = getSwitchLocation(ctx.timeMinutes);
    if (loc !== ctx.scene) return [];

    const opts: PlayerOption[] = [];

    opts.push({
      id: "action-talk-switch",
      kind: "action",
      label: "Approach the figure in the alley.",
      onSelect: () => {
        h.advanceTime(TIME.DEFAULT_ACTION);
        h.startDialog("switch.stare");
      },
    });

    return opts;
  },
};
