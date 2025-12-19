// app/components/scenes/AptBedroom.tsx
"use client";

import BaseScene from "./BaseScene";
import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { getCatLocation } from "../../game/npcs/cat"; 
import { TIME } from "../../game/timeRules";
import type { PlayerOption } from "../OptionsContext";

export default function AptLivingroom() {
  const { advanceTime, goToScene, timeMinutes, flags, setFlags, lastScene } = useLoopState();
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

  const catHere = getCatLocation(timeMinutes) === "apt-bedroom";
  const showWakeText = !flags.hasWokenUp;

  const goLiving = () => {
    if (!flags.hasWokenUp) {
      setFlags((prev) => ({ ...prev, hasWokenUp: true }));
    }
    advanceTime(TIME.DEFAULT_ACTION);
    goToScene("apt-living");
  };

  const lookAtCat = () => {
    advanceTime(TIME.DEFAULT_ACTION); 
    openExamine({
      id: "cat-basic",
      title: "The Cat",
      body:
        "A gray cat lies curled in the stripes of light, blinking at you like it's watched this moment before.",
    });
  };

  const description: string[] = 
      [
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
      onSelect: () => goToScene("apt-bedroom"),
    },
    {
      id: "living-to-bathroom",
      kind: "move",
      dir: "n",
      label: "Step into the bathroom.",
      onSelect: () => goToScene("apt-bathroom"),
    },
    {
      id: "living-to-kitchen",
      kind: "move",
      dir: "e",
      label: "Step into the kitchen.",
      onSelect: () => goToScene("apt-kitchen"),
    },
    {
      id: "living-to-hallway",
      kind: "move",
      dir: "s",
      label: "Step into the hallway.",
      onSelect: () => goToScene("apt-hallway"),
    },
  ];

  if (catHere) {
    options.push({
      id: "bedroom-look-cat",
      kind: "action",
      label: "Look at the cat.",
      onSelect: lookAtCat,
    });
  }

  return (
  <BaseScene
    id="apt-livingroom"
    title="Apartment – Living Room"
    background="/rooms/apt-livingroom.jpg"
    bgNative={{ w: 736, h: 1470 }}   // ✅ set to the actual image size
    description={description}
    options={options}
    spriteScale={1.4}
    startPosition={startPosition}
  />
  );
}
