// app/game/events/npcs/sable.ts
import type { EventModule } from "../types";
import type { PlayerOption } from "../../../components/OptionsContext";
import { TIME } from "../../timeRules";

export const sable: EventModule = {
  id: "npc.sable",

  nodes: {
    "sable.wait": {
      id: "sable.wait",
      npc: "Sable (Nurse)",
      text: "Name? Reason? Keep it short.",
      responses: [
        {
          label: "Just checking something.",
          timeCost: TIME.DEFAULT_ACTION,
        },
        {
          label: "I need five minutes.",
          timeCost: TIME.DEFAULT_ACTION,
        },
      ],
    },
  },

  getOptions: (ctx, h) => {
    if (ctx.scene !== "clinic-waiting") return [];
    const opts: PlayerOption[] = [];

    opts.push({
      id: "action-talk-sable",
      kind: "action",
      label: "Talk to the nurse.",
      onSelect: () => {
        h.advanceTime(TIME.DEFAULT_ACTION);
        h.setNpcState((p) => ({
          ...p,
          sablePatience: (Math.max(0, p.sablePatience - 1) as any),
        }));
        h.startDialog("sable.wait");
      },
    });

    return opts;
  },
};
