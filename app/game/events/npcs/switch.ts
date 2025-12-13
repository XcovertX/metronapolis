// app/game/events/npcs/switch.ts
import type { EventModule } from "../types";
import type { PlayerOption } from "../../../components/OptionsContext";
import { TIME } from "../../timeRules";

export const switchNpc: EventModule = {
  id: "npc.switch",

  nodes: {
    "switch.stare": {
      id: "switch.stare",
      npc: "Switch",
      text: "Wrong minute to be brave.",
      responses: [
        {
          label: "Back off.",
          timeCost: TIME.DEFAULT_ACTION,
          setFlags: (p) => ({ ...p, switchSeen: true }),
        },
        {
          label: "Say nothing.",
          timeCost: TIME.DEFAULT_ACTION,
          setFlags: (p) => ({ ...p, switchSeen: true }),
        },
      ],
    },
  },

  getOptions: (ctx, h) => {
    if (ctx.scene !== "alley-mid") return [];
    // only “active” in a danger window (example)
    const t = ctx.timeMinutes;
    if (t < 12 * 60 + 6 || t > 12 * 60 + 10) return [];

    const opts: PlayerOption[] = [];

    opts.push({
      id: "action-talk-switch",
      kind: "action",
      label: "Approach the figure in the alley.",
      onSelect: () => {
        h.advanceTime(TIME.DEFAULT_ACTION);
        h.setNpcState((p) => ({ ...p, switchSpooked: true }));
        h.startDialog("switch.stare");
      },
    });

    return opts;
  },
};
