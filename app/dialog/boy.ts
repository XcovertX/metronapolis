// app/dialog/boy.ts
import { DialogNode } from "../components/DialogContext";
import { hasItem, flagEquals } from "./conditions";

export const boyDialogNodes: Record<string, DialogNode> = {
  "boy.intro.1": {
    id: "boy.intro.1",
    npc: "Boy",
    text: "Hey mister… did you see a bike out here? I swear I locked it.",
    responses: [
      {
        label: "Lie: Nope. Haven’t seen anything.",
        timeCost: 1,
        next: "boy.intro.2",
      },
      {
        label: "I… actually have your bike.",
        timeCost: 1,
        next: "boy.return.1",
        condition: hasItem("stolen-bike"),
      },
      {
        label: "Why do you need a bike?",
        timeCost: 2,
        next: "boy.deflect.1",
      },
    ],
  },

  "boy.return.1": {
    id: "boy.return.1",
    npc: "Boy",
    text: "Wait—what? Are you messing with me?",
    responses: [
      {
        label: "Give him the bike back.",
        timeCost: 2,
        next: "boy.return.2",
        setFlags: (prev) => ({
          ...prev,
          bikeReturned: true,
          bikeStolen: false,
        }),
      },
      {
        label: "Forget it.",
        timeCost: 1,
        next: "boy.intro.2",
      },
    ],
  },

  "boy.return.2": {
    id: "boy.return.2",
    npc: "Boy",
    text: "You… actually brought it back. I thought—never mind. Thanks.",
    responses: [
      {
        label: "Don’t make a big deal out of it.",
        timeCost: 2,
      },
    ],
  },

  // Example of flag-based variation later
  "boy.later.1": {
    id: "boy.later.1",
    npc: "Boy",
    text: "Hey… thanks for earlier. I made the delivery on time.",
    condition: flagEquals("bikeReturned", true),
    responses: [
      {
        label: "Don’t get used to it.",
        timeCost: 1,
      },
    ],
  },
};
