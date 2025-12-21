// app/components/scenes/AptLivingroom.tsx
"use client";

import BaseScene from "./BaseScene";
import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { getCatLocation } from "../../game/npcs/cat";
import { TIME } from "../../game/timeRules";
import type { PlayerOption } from "../OptionsContext";
import type { DecisionSpec } from "../../game/events/decisionTypes";

export default function AptLivingroom() {
  const { goToScene, timeMinutes, flags, setFlags, lastScene } = useLoopState();
  const { openExamine } = useExamine();

  // Set start position based on lastScene
  let startPosition: { x: number; y: number };
  switch (lastScene) {
    case "apt-bedroom":
      startPosition = { x: 100, y: 1000 };
      break;
    case "apt-bathroom":
      startPosition = { x: 450, y: 800 };
      break;
    case "apt-kitchen":
      startPosition = { x: 700, y: 1150 };
      break;
    case "apt-hallway":
      startPosition = { x: 500, y: 1430 };
      break;
    default:
      startPosition = { x: 600, y: 1300 };
  }

  // NOTE: you had "apt-bedroom" here in the original; keeping your intent:
  // if you want the cat to appear in the living room, change to "apt-livingroom"
  const catHere = getCatLocation(timeMinutes) === "apt-living";

  // --------------------
  // Decision specs
  // --------------------
  const NAV_LIVINGROOM: DecisionSpec = {
    id: "nav_apt_livingroom_exit",
    title: "Living Room: Exit Choice",
    kind: "navigate",
    outcomes: [
      { id: "to_bedroom", title: "To bedroom", defaultTimeCost: TIME.DEFAULT_ACTION },
      { id: "to_bathroom", title: "To bathroom", defaultTimeCost: TIME.DEFAULT_ACTION },
      { id: "to_kitchen", title: "To kitchen", defaultTimeCost: TIME.DEFAULT_ACTION },
      { id: "to_hallway", title: "To hallway", defaultTimeCost: TIME.DEFAULT_ACTION },
    ],
  };

  const EXAMINE_CAT_LIVING: DecisionSpec = {
    id: "exm_cat_livingroom",
    title: "Living Room: The Cat",
    kind: "examine",
    outcomes: [
      { id: "inspect", title: "Inspect the cat", defaultTimeCost: TIME.DEFAULT_ACTION },
      { id: "ignore", title: "Leave it be", defaultTimeCost: 0 },
    ],
  };

  const description: string[] = [
    "The room is washed in the soft glow of lamps and the flickering blue light of the TV, shadows stretching across the quiet space.",
  ];

  if (catHere) {
    description.push("The cat is here—still, alert, watching you from the edge of the light.");
  }

  const options: PlayerOption[] = [
    {
      id: "living-to-bedroom",
      kind: "move",
      dir: "w",
      label: "Step into the bedroom.",
      decision: {
        spec: NAV_LIVINGROOM,
        outcomeId: "to_bedroom",
        meta: { kind: "navigate", from: "apt-livingroom", to: "apt-bedroom" },
      },
      afterCommit: () => {
        if (!flags.hasWokenUp) setFlags((prev) => ({ ...prev, hasWokenUp: true }));
        goToScene("apt-bedroom");
      },
    },
    {
      id: "living-to-bathroom",
      kind: "move",
      dir: "n",
      label: "Step into the bathroom.",
      decision: {
        spec: NAV_LIVINGROOM,
        outcomeId: "to_bathroom",
        meta: { kind: "navigate", from: "apt-livingroom", to: "apt-bathroom" },
      },
      afterCommit: () => {
        if (!flags.hasWokenUp) setFlags((prev) => ({ ...prev, hasWokenUp: true }));
        goToScene("apt-bathroom");
      },
    },
    {
      id: "living-to-kitchen",
      kind: "move",
      dir: "e",
      label: "Step into the kitchen.",
      decision: {
        spec: NAV_LIVINGROOM,
        outcomeId: "to_kitchen",
        meta: { kind: "navigate", from: "apt-livingroom", to: "apt-kitchen" },
      },
      afterCommit: () => {
        if (!flags.hasWokenUp) setFlags((prev) => ({ ...prev, hasWokenUp: true }));
        goToScene("apt-kitchen");
      },
    },
    {
      id: "living-to-hallway",
      kind: "move",
      dir: "s",
      label: "Step into the hallway.",
      decision: {
        spec: NAV_LIVINGROOM,
        outcomeId: "to_hallway",
        meta: { kind: "navigate", from: "apt-livingroom", to: "apt-hallway" },
      },
      afterCommit: () => {
        if (!flags.hasWokenUp) setFlags((prev) => ({ ...prev, hasWokenUp: true }));
        goToScene("apt-hallway");
      },
    },
  ];

  if (catHere) {
    options.push({
      id: "living-look-cat",
      kind: "action",
      label: "Look at the cat.",
      decision: {
        spec: EXAMINE_CAT_LIVING,
        outcomeId: "inspect",
        meta: { kind: "examine", target: "cat", scene: "apt-livingroom" },
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
      id="apt-livingroom"
      title="Apartment – Living Room"
      background="/rooms/apt-livingroom.jpg"
      bgNative={{ w: 736, h: 1470 }} // ✅ actual image size
      description={description}
      options={options}
      spriteScale={1.4}
      startPosition={startPosition}
    />
  );
}
