// app/game/events/npcs/cat.ts
import type { EventModule } from "../types";
import type { PlayerOption } from "../../../components/OptionsContext";
import { TIME } from "../../timeRules";
import { getCatLocation } from "../../npcs/cat";

export const catNpc: EventModule = {
  id: "npc.cat",

  nodes: {
    "cat.examine": {
      id: "cat.examine",
      npc: "Cat",
      text: "The cat watches you like it’s keeping score.",
      responses: [
        {
          label: "Hold out your hand.",
          timeCost: TIME.DEFAULT_ACTION,
          setFlags: (prev) => ({ ...prev, catObserved: true }),
        },
        {
          label: "Back away.",
          timeCost: TIME.DEFAULT_ACTION,
        },
      ],
    },
  },

  getOptions: (ctx, h) => {
    const here = getCatLocation(ctx.timeMinutes);
    if (!here || here !== ctx.scene) return [];

    const opts: PlayerOption[] = [];

    opts.push({
      id: "action-look-cat",
      kind: "action",
      label: "Look at the cat.",
      onSelect: () => {
        console.log("[catNpc] clicked");
        h.advanceTime(TIME.DEFAULT_ACTION);
        h.setNpcState((prev) => ({
          ...prev,
          // tiny “personality drift” example
          catMood: prev.catMood === "calm" ? "skittish" : prev.catMood,
        }));
        h.startDialog("cat.examine");
      },
    });

    return opts;
  },
};
