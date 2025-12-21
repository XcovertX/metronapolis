// app/components/scenes/AptBedroom.tsx
"use client";

import BaseScene from "./BaseScene";
import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { getCatLocation } from "../../game/npcs/cat";
import { TIME } from "../../game/timeRules";
import type { PlayerOption } from "../OptionsContext";
import type { DecisionSpec } from "../../game/events/decisionTypes";

export default function AptBedroom() {
  const { goToScene, timeMinutes, flags, setFlags } = useLoopState();
  const { openExamine } = useExamine();

  const catHere = getCatLocation(timeMinutes) === "apt-bedroom";
  const showWakeText = !flags.hasWokenUp;

  const startPosition = { x: 316, y: 590 }; // Center bottom of the bedroom

  // ✅ Decision specs (static-ish; keeping inside component is fine for now)
  const NAV_BEDROOM: DecisionSpec = {
    id: "nav_apt_bedroom_exit",
    title: "Bedroom: Exit Choice",
    kind: "navigate",
    outcomes: [
      { id: "to_living", title: "To living room", defaultTimeCost: TIME.DEFAULT_ACTION },
      // Add more exits later here (to_hall, to_balcony, etc.)
    ],
  };

  const EXAMINE_CAT: DecisionSpec = {
    id: "exm_cat_bedroom",
    title: "Bedroom: The Cat",
    kind: "examine",
    outcomes: [
      // 2 outcomes keeps your 2–5 rule intact.
      { id: "inspect", title: "Inspect the cat", defaultTimeCost: TIME.DEFAULT_ACTION },
      { id: "ignore", title: "Leave it be", defaultTimeCost: 0 },
    ],
  };

  const description: string[] = showWakeText
    ? [
        "You wake to the hum of cheap circuitry and pale slotted beams of light cutting across the room from the blinds.",
        "The Retinaband stutters to life, burning the time into your vision like it’s done this before.",
      ]
    : [
        "Light spills through the slotted blinds in hard stripes, carving the room into quiet sections of shadow and glare.",
      ];

  if (catHere) {
    description.push("The cat is here—still, alert, watching you from the edge of the light.");
  }

  const options: PlayerOption[] = [
    {
      id: "bedroom-to-living",
      kind: "move",
      dir: "e",
      label: "Step into the living room.",

      // ✅ Decision-driven: time advancement + path logging handled by OptionsWindow
      decision: {
        spec: NAV_BEDROOM,
        outcomeId: "to_living",
        // appliedTimeCost omitted -> learned time if known else defaultTimeCost
        meta: { from: "apt-bedroom", to: "apt-living" },
      },

      // ✅ Side effects after decision commit
      afterCommit: () => {
        if (!flags.hasWokenUp) {
          setFlags((prev) => ({ ...prev, hasWokenUp: true }));
        }
        goToScene("apt-living");
      },
    },
  ];

  if (catHere) {
    options.push({
      id: "bedroom-look-cat",
      kind: "action",
      label: "Look at the cat.",

      decision: {
        spec: EXAMINE_CAT,
        outcomeId: "inspect",
        meta: { target: "cat", scene: "apt-bedroom" },
      },

      afterCommit: () => {
        openExamine({
          id: "cat-basic",
          title: "The Cat",
          body:
            "A gray cat lies curled in the stripes of light, blinking at you like it's watched this moment before.",
          image: "/sprites/cat-1.jpg",
        });
      },
    });
  }

  return (
    <BaseScene
      id="apt-bedroom"
      title="Apartment – Bedroom"
      background="/rooms/apt-bedroom.png"
      bgNative={{ w: 632, h: 632 }}
      description={description}
      options={options}
      spriteScale={1.1}
      startPosition={startPosition}
    />
  );
}
