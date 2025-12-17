// app/dialog/malik.ts
import { DialogNode } from "../../components/DialogContext";

export const malikDialogNodes: Record<string, DialogNode> = {
  "malik.intro.1": {
    id: "malik.intro.1",
    npc: "Malik",
    text: "If you're not buying, move. I got a line.",
    responses: [
      {
        label: "Ask about the kid with the bike.",
        timeCost: 2,
        next: "malik.kid.1",
      },
      {
        label: "Stay silent.",
        timeCost: 1,
      },
    ],
  },

  "malik.kid.1": {
    id: "malik.kid.1",
    npc: "Malik",
    text: "Delivery rat? Shows up late half the time. Why d'you care?",
    responses: [
      {
        label: "Lie: Just curious.",
        timeCost: 1,
      },
      {
        label: "Press: What happens if he loses the job?",
        timeCost: 2,
      },
    ],
  },
};
