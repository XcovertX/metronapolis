// app/game/events/npcs/rhea.ts
import type { EventModule } from "../types";
import type { PlayerOption } from "../../../components/OptionsContext";
import { TIME } from "../../timeRules";

export const rhea: EventModule = {
  id: "npc.rhea",

  nodes: {
    "rhea.intro": {
      id: "rhea.intro",
      npc: "Rhea",
      text: "You’ve got that look. Like you already lost today once.",
      responses: [
        {
          label: "Talk faster. I’m on a clock.",
          timeCost: TIME.DEFAULT_ACTION,
          next: "rhea.clock",
        },
        {
          label: "Who are you?",
          timeCost: TIME.DEFAULT_ACTION,
          next: "rhea.who",
        },
      ],
    },
    "rhea.clock": {
      id: "rhea.clock",
      npc: "Rhea",
      text: "Good. Then listen. The alley lies at 12:06.",
      responses: [
        {
          label: "Noted.",
          timeCost: TIME.DEFAULT_ACTION,
          setFlags: (p) => ({ ...p, rheaWarned: true, rheaMet: true }),
        },
        {
          label: "Why help me?",
          timeCost: TIME.DEFAULT_ACTION,
          next: "rhea.why",
          setFlags: (p) => ({ ...p, rheaWarned: true, rheaMet: true }),
        },
      ],
    },
    "rhea.who": {
      id: "rhea.who",
      npc: "Rhea",
      text: "Someone who notices patterns. Most don’t.",
      responses: [
        {
          label: "Help me notice them.",
          timeCost: TIME.DEFAULT_ACTION,
          setFlags: (p) => ({ ...p, rheaMet: true }),
        },
      ],
    },
    "rhea.why": {
      id: "rhea.why",
      npc: "Rhea",
      text: "Because you’re the only one who comes back with the same eyes.",
      responses: [{ label: "…Right.", timeCost: TIME.DEFAULT_ACTION }],
    },
  },

  getOptions: (ctx, h) => {
    if (ctx.scene !== "lobby") return [];
    const t = ctx.timeMinutes;
    if (t < 12 * 60 || t > 12 * 60 + 20) return [];

    const opts: PlayerOption[] = [];
    const met = !!ctx.flags.rheaMet;

    opts.push({
      id: "action-talk-rhea",
      kind: "action",
      label: met ? "Talk to Rhea." : "Talk to the woman by the mailboxes.",
      onSelect: () => {
        h.advanceTime(TIME.DEFAULT_ACTION);
        h.setFlags((p) => ({ ...p, rheaMet: true }));
        h.setNpcState((p) => ({ ...p, rheaTrust: (Math.min(3, p.rheaTrust + 1) as any) }));
        h.startDialog("rhea.intro");
      },
    });

    return opts;
  },
};
