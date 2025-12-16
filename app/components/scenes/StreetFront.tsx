// app/components/scenes/AptBedroom.tsx
"use client";

import BaseScene from "./BaseScene";
import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { TIME } from "../../game/timeRules";
import type { PlayerOption } from "../OptionsContext";

export default function StreetFront() {
  const { advanceTime, goToScene, timeMinutes, flags, setFlags } = useLoopState();
  const { openExamine } = useExamine();

  const description: string[] = 
      [
        "Light spills through the slotted blinds in hard stripes, carving the room into quiet sections of shadow and glare.",
      ];



  const options: PlayerOption[] = [
    {
      id: "street-front-to-street-alley",
      kind: "move",
      dir: "e",
      label: "Walk to the street alley.",
      onSelect: () => goToScene("street-alley"),
    },
    {
      id: "street-front-to-sidewalk-south",
      kind: "move",
      dir: "n",
      label: "Step north onto the sidewalk.",
      onSelect: () => goToScene("sidewalk-south"),
    },
  ];


  return (
    <BaseScene
      id="street-front"
      title="Street Front"
      background="/rooms/street-front.jpg"
      description={description}
      options={options}
    />
  );
}
