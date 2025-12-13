// app/game/events/npcs/vex.ts
import type { EventModule } from "../types";
import type { PlayerOption } from "../../../components/OptionsContext";
import { TIME } from "../../timeRules";

export const vex: EventModule = {
  id: "npc.vex",

  nodes: {
    "vex.order": {
      id: "vex.order",
      npc: "Vex (Barista)",
      text: "You ordering or rehearsing a confession?",
      responses: [
        {
          label: "Coffee. Black.",
          timeCost: TIME.DEFAULT_ACTION,
          setFlags: (p) => ({ ...p, vexMet: true }),
        },
        {
          label: "Heard anything strange today?",
          timeCost: TIME.DEFAULT_ACTION,
          setFlags: (p) => ({ ...p, vexMet: true }),
        },
      ],
    },
  },

  getOptions: (ctx, h) => {
    if (ctx.scene !== "cafe-interior") return [];
    const opts: PlayerOption[] = [];

    opts.push({
      id: "action-talk-vex",
      kind: "action",
      label: "Talk to the barista.",
      onSelect: () => {
        h.advanceTime(TIME.DEFAULT_ACTION);
        h.setNpcState((p) => ({ ...p, vexFavor: (Math.min(3, p.vexFavor + 1) as any) }));
        h.startDialog("vex.order");
      },
    });

    return opts;
  },
};
