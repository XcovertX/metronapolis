// app/game/events/npcs/barista.ts
import type { EventModule } from "../types";
import type { PlayerOption } from "../../../components/OptionsContext";
import { TIME } from "../../timeRules";
import { COFFEE } from "../../items/coffee";

const CAFE_SCENE = "cafe-counter"; // <-- change if your scene id differs
const COFFEE_COST = 5;

export const baristaNpc: EventModule = {
  id: "npc.barista",

  nodes: {
    "barista.hello": {
      id: "barista.hello",
      npc: "Barista",
      text: "You look like you’ve been awake for days. What’ll it be?",
      responses: [
        { label: "Just coffee.", timeCost: TIME.DEFAULT_ACTION },
        { label: "Never mind.", timeCost: TIME.DEFAULT_ACTION },
      ],
    },
    "barista.noFunds": {
      id: "barista.noFunds",
      npc: "Barista",
      text: "Credits short. Come back when your wrist says you can afford it.",
      responses: [{ label: "Fine.", timeCost: TIME.DEFAULT_ACTION }],
    },
  },

  getOptions: (ctx, h) => {
    if (ctx.scene !== "cafe-interior") return [];

    const opts: PlayerOption[] = [];

    // Talk (optional)
    opts.push({
      id: "action-talk-barista",
      kind: "action",
      label: "Talk to the barista.",
      onSelect: () => {
        h.advanceTime(TIME.DEFAULT_ACTION);
        h.startDialog("barista.hello");
      },
    });

    // Buy coffee
    opts.push({
      id: "action-buy-coffee",
      kind: "action",
      label: `Buy coffee (${COFFEE_COST} credits).`,
      onSelect: () => {
        // If already holding coffee, don't spam-buy (optional)
        if (ctx.inventory.includes(COFFEE)) {
          h.advanceTime(TIME.DEFAULT_ACTION);
          h.setFlags((prev: any) => ({ ...prev, baristaAnnoyed: true }));
          return;
        }

        // Check funds
        if (!h.spendCredits(COFFEE_COST)) {
          h.advanceTime(TIME.DEFAULT_ACTION);
          h.startDialog("barista.noFunds");
          return;
        }

        h.advanceTime(TIME.DEFAULT_ACTION);
        h.addItem(COFFEE);
        h.setFlags((prev: any) => ({ ...prev, boughtCoffee: true }));
      },
    });

    return opts;
  },
};
