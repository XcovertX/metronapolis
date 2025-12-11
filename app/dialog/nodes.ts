import { DialogNode } from "../components/DialogContext";

export const dialogNodes: Record<string, DialogNode> = {
  boy_intro_1: {
    id: "boy_intro_1",
    npc: "Boy",
    text: "Hey mister… did you see a bike out here? I swear I locked it.",
    responses: [
      {
        label: "Lie: Nope. Haven’t seen anything.",
        timeCost: 1,
        next: "boy_intro_2",
      },
      {
        label: "Tell the truth: I took it.",
        timeCost: 1,
        next: "boy_accuse_1",
      },
      {
        label: "Deflect: Why do you need a bike?",
        timeCost: 2,
        next: "boy_deflect_1",
      },
    ],
  },

  boy_intro_2: {
    id: "boy_intro_2",
    npc: "Boy",
    text: "Okay… thanks I guess.",
    responses: [
      { label: "Walk away.", timeCost: 1 }
    ],
  },

  boy_accuse_1: {
    id: "boy_accuse_1",
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

  boy_deflect_1: {
    id: "boy_deflect_1",
    npc: "Boy",
    text: "I deliver meds for the shop. Without my bike I'm fired.",
    responses: [
      { label: "Sympathize.", timeCost: 2 },
      { label: "Walk away.", timeCost: 1 },
    ],
  },
};
