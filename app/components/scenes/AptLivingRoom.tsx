// app/components/scenes/AptBedroom.tsx
"use client";

import BaseScene from "./BaseScene";
import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { getCatLocation } from "../../game/npcs/cat"; 
import { TIME } from "../../game/timeRules";
import type { PlayerOption } from "../OptionsContext";

export default function AptLivingroom() {
  const { advanceTime, goToScene, timeMinutes, flags, setFlags } = useLoopState();
  const { openExamine } = useExamine();
  const { lastScene } = useLoopState();
  const sceneLandingSpots: Record<string, [number, number]> = {
    "apt-bedroom": [700, 700],
    "apt-kitchen": [1200, 900],
    "apt-bathroom": [1000, 600],
    "apt-hallway": [1000, 1200],
  };

  console.log(lastScene);

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

  // Determine landing spot based on lastScene
  const [pointX, pointY] = lastScene && sceneLandingSpots[lastScene]
    ? sceneLandingSpots[lastScene]
    : [373, 735]; // Default to center if lastScene is not found

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
      dimensions={{ width: 746 , height: 1470 }}
      landingSpot={{ x: pointX, y: pointY }}
      description={description}
      options={options}
    />
  );
}
