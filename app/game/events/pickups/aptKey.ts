// app/game/events/pickups/aptKey.ts
import type { EventModule } from "../types";
import type { PlayerOption } from "../../../components/OptionsContext";
import { TIME } from "../../timeRules";
import { APT_KEY } from "../../items/aptKey";

const PICKUP_SCENE = "apt-kitchen"; // change if you want
const TAKEN_FLAG = "aptKeyTaken";

export const aptKeyPickup: EventModule = {
  id: "pickup.aptKey",

  getOptions: (ctx, h) => {
    if (ctx.scene !== PICKUP_SCENE) return [];
    if (ctx.flags?.[TAKEN_FLAG]) return [];

    // already have it? (in case you ever allow multi-source)
    if (ctx.inventory.some((i) => i.id === APT_KEY.id)) return [];

    const opts: PlayerOption[] = [
      {
        id: "action-pickup-apt-key",
        kind: "action",
        label: "Pick up the key on the counter.",
        onSelect: () => {
          h.advanceTime(TIME.DEFAULT_ACTION);
          h.addItem(APT_KEY);
          h.setFlags((prev: any) => ({ ...prev, [TAKEN_FLAG]: true }));
          h.pushMessage("You picked up an Apartment Key.");
        },
      },
    ];

    return opts;
  },
};
