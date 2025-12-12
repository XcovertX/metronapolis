// app/dialog/rhea.ts
import { DialogNode } from "../components/DialogContext";

export const rheaDialogNodes: Record<string, DialogNode> = {
  "rhea.intro.1": {
    id: "rhea.intro.1",
    npc: "Rhea",
    text: "There you are. I was wondering if you’d ever leave that cave you call an apartment.",
    responses: [
      {
        label: "“Morning to you too.”",
        timeCost: 1,
        next: "rhea.intro.2",
      },
      {
        label: "“Do I know you?”",
        timeCost: 1,
        next: "rhea.intro.3",
      },
      {
        label: "Ignore her and head for the door.",
        timeCost: 1,
      },
    ],
  },

  "rhea.intro.2": {
    id: "rhea.intro.2",
    npc: "Rhea",
    text: "It’s not morning. It hasn’t been morning for a while. You check the time at all, cave man?",
    responses: [
      {
        label: "Glance at your Retinaband. “Yeah. I’m… working on it.”",
        timeCost: 1,
      },
    ],
  },

  "rhea.intro.3": {
    id: "rhea.intro.3",
    npc: "Rhea",
    text: "Wow. Brutal. We’ve shared a hallway for three years and that’s the line you go with?",
    responses: [
      {
        label: "“Sorry. Rough… whatever-this-is.”",
        timeCost: 1,
        next: "rhea.intro.4",
      },
      {
        label: "“I’m serious. I don’t remember.”",
        timeCost: 2,
      },
    ],
  },

  "rhea.intro.4": {
    id: "rhea.intro.4",
    npc: "Rhea",
    text: "Yeah. You and the rest of the building. Elevators never work, water’s always lukewarm. It’s a miracle anyone leaves their unit.",
    responses: [
      {
        label: "“You headed out too?”",
        timeCost: 1,
      },
    ],
  },
};
