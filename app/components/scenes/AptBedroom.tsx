// app/components/scenes/AptBedroom.tsx
"use client";

import BaseScene from "./BaseScene";
import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { getCatLocation } from "../../game/cat";

export default function AptBedroom() {
  const { advanceTime, goToScene, timeMinutes, flags, setFlags } = useLoopState();
  const { openExamine } = useExamine();

  const catHere = getCatLocation(timeMinutes) === "apt-bedroom";
  const showWakeText = !flags.hasWokenUp;

  const goLiving = () => {
    // Mark wake text as "consumed" only when leaving bedroom the first time
    if (!flags.hasWokenUp) {
      setFlags((prev) => ({ ...prev, hasWokenUp: true }));
    }

    advanceTime(5);
    goToScene("apt-living");
  };

  const lookAtCat = () => {
    openExamine({
      id: "cat-basic",
      title: "The Cat",
      body:
        "A gray cat lies curled in the stripes of light, blinking at you like it's watched this moment before.",
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

  const options = [
    {
      id: "bedroom-to-living",
      label: "Step into the living room.",
      onSelect: goLiving,
    },
    ...(catHere
      ? [
          {
            id: "bedroom-look-cat",
            label: "Look at the cat.",
            onSelect: lookAtCat,
          },
        ]
      : []),
  ];

  return (
    <BaseScene
      id="apt-bedroom"
      title="Apartment – Bedroom"
      background="/rooms/apt-bedroom.png"
      description={description}
      options={options}
    />
  );
}
