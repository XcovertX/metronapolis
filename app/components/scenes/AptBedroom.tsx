// app/components/scenes/AptBedroom.tsx
"use client";

import BaseScene from "./BaseScene";
import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { getCatLocation } from "../../game/npcs/cat"; 
import { TIME } from "../../game/timeRules";
import type { PlayerOption } from "../OptionsContext";

export default function AptBedroom() {
  const { advanceTime, goToScene, timeMinutes, flags, setFlags } = useLoopState();
  const { openExamine } = useExamine();

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
    advanceTime(TIME.DEFAULT_ACTION); // ✅ keep rule: every action costs time
    openExamine({
      id: "cat-basic",
      title: "The Cat",
      body:
        "A gray cat lies curled in the stripes of light, blinking at you like it's watched this moment before.",
      image: "/sprites/cat-1.jpg",
    });
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
      onSelect: goLiving,
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
      id="apt-bedroom"
      title="Apartment – Bedroom"
      // background="/rooms/apt-bedroom.png"
      description={description}
      options={options}
    />
  );
}
