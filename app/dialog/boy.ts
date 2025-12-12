// app/dialog/boy.ts
import { DialogNode } from "../components/DialogContext";

// You can prefix IDs with "boy." to avoid collisions
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
        label: "Tell the truth: I took it.",
        timeCost: 1,
        next: "boy.accuse.1",
      },
      {
        label: "Deflect: Why do you need a bike?",
        timeCost: 2,
        next: "boy.deflect.1",
      },
    ],
  },

  "boy.intro.2": {
    id: "boy.intro.2",
    npc: "Boy",
    text: "Okay… thanks I guess.",
    responses: [
      { label: "Walk away.", timeCost: 1 },
    ],
  },

  "boy.accuse.1": {
    id: "boy.accuse.1",
    npc: "Boy",
    text: "You WHAT?! Why would you do that?!",
    responses: [
      {
        label: "Regret: I shouldn't have.",
        timeCost: 2,
      },
      {
        label: "Cold: You shouldn’t leave things unattended.",
        timeCost: 2,
      },
    ],
  },

  "boy.deflect.1": {
    id: "boy.deflect.1",
    npc: "Boy",
    text: "I deliver meds for the shop. Without my bike I'm fired.",
    responses: [
      { label: "Sympathize.", timeCost: 2 },
      { label: "Walk away.", timeCost: 1 },
    ],
  },
};
