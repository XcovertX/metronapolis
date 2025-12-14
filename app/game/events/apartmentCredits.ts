// app/game/events/apartmentCredits.ts
import type { EventModule } from "./types";
import type { PlayerOption } from "../../components/OptionsContext";
import { TIME } from "../timeRules";

const PICKUP_SCENE = "apt-living"; // change to "apt-bedroom" if you prefer

export const apartmentCreditsEvent: EventModule = {
  id: "pickup.apartmentCredits",

  getOptions: (ctx, h) => {
    if (ctx.scene !== PICKUP_SCENE) return [];

    // once per loop
    if (ctx.flags?.aptCreditsTaken) return [];

    const opts: PlayerOption[] = [];

    opts.push({
      id: "action-grab-credits",
      kind: "action",
      label: "Grab the loose credits on the counter.",
      onSelect: () => {
        h.advanceTime(TIME.DEFAULT_ACTION);
        h.addCredits(12); // tweak amount
        h.setFlags((prev: any) => ({ ...prev, aptCreditsTaken: true }));
        h.pushMessage("You picked up some credits from the counter.");
        h.pushMessage("+12 credits.");    },
    });

    return opts;
  },
};
