// app/game/events/doors/neighborDoor.ts
import type { EventModule } from "../types";
import type { PlayerOption } from "../../../components/OptionsContext";
import { TIME } from "../../timeRules";
import { APT_KEY } from "../../items/aptKey";

const DOOR_SCENE = "neighbor-door";
const UNLOCK_FLAG = "neighborDoorUnlocked";

export const neighborDoorEvent: EventModule = {
  id: "door.neighbor",

  getOptions: (ctx, h) => {
    if (ctx.scene !== DOOR_SCENE) return [];

    const hasKey = ctx.inventory.some((i) => i.id === APT_KEY.id);
    const unlocked = !!ctx.flags?.[UNLOCK_FLAG];

    const opts: PlayerOption[] = [];

    if (!unlocked) {
      if (!hasKey) {
        // Optional: show “Locked” if you want feedback
        opts.push({
          id: "action-door-locked",
          kind: "action",
          label: "Unlock neighbor’s door.",
          onSelect: () => {
            h.advanceTime(TIME.DEFAULT_ACTION);
            h.pushMessage("Locked. You don't have the right key.");
          },
        });
      } else {
        opts.push({
          id: "action-unlock-neighbor-door",
          kind: "action",
          label: "Unlock the neighbor’s door.",
          onSelect: () => {
            h.advanceTime(TIME.DEFAULT_ACTION);
            h.setFlags((prev: any) => ({ ...prev, [UNLOCK_FLAG]: true }));
            h.pushMessage("The lock gives with a soft click.");
          },
        });
      }
      return opts;
    } else {
      opts.push({
      id: "action-lock-neighbor-door",
      kind: "action",
      label: "Lock the neighbor’s door.",
      onSelect: () => {
          h.advanceTime(TIME.DEFAULT_ACTION);
          h.setFlags((prev: any) => ({ ...prev, [UNLOCK_FLAG]: false }));
          h.pushMessage("The lock closes with a soft click.");
        },
      });
    }

    // Unlocked state (later you can route to a new scene)
    opts.push({
      id: "action-open-neighbor-door",
      kind: "action",
      label: "Open the neighbor’s door.",
      onSelect: () => {
        h.advanceTime(TIME.DEFAULT_ACTION);
        h.pushMessage("You step into darkness—air colder than it should be.");
        // Later:
        // h.goToScene("neighbor-interior")  <-- you'd need to expose goToScene in helpers, or handle via sceneGraph exit unlocking
      },
    });

    return opts;
  },
};
