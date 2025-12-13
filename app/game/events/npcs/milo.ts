// app/game/events/npcs/milo.ts
import type { EventModule } from "../types";
import type { PlayerOption } from "../../../components/OptionsContext";
import { TIME } from "../../timeRules";

export const milo: EventModule = {
  id: "npc.milo",

  nodes: {
    "milo.hi": {
      id: "milo.hi",
      npc: "Milo (Janitor)",
      text: "You’re not supposed to be back here.",
      responses: [
        {
          label: "I’m lost.",
          timeCost: TIME.DEFAULT_ACTION,
          setFlags: (p) => ({ ...p, miloSpoke: true }),
        },
        { label: "…Okay.", timeCost: TIME.DEFAULT_ACTION },
      ],
    },
  },

  getOptions: (ctx, h) => {
    if (ctx.scene !== "service-hall") return [];
    const opts: PlayerOption[] = [];

    opts.push({
      id: "action-talk-milo",
      kind: "action",
      label: "Talk to the janitor.",
      onSelect: () => {
        h.advanceTime(TIME.DEFAULT_ACTION);
        h.setNpcState((p) => ({
          ...p,
          miloSuspicion: (Math.min(3, p.miloSuspicion + 1) as any),
        }));
        h.startDialog("milo.hi");
      },
    });

    return opts;
  },
};
