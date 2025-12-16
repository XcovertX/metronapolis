// app/components/scenes/AptBedroom.tsx
"use client";

import BaseScene from "./BaseScene";
import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { TIME } from "../../game/timeRules";
import type { PlayerOption } from "../OptionsContext";

export default function StreetAlley() {
  const { advanceTime, goToScene, timeMinutes, flags, setFlags } = useLoopState();
  const { openExamine } = useExamine();

  const description: string[] = [
    "A narrow alley runs between tall, shadowy buildings. Neon reflections shimmer in puddles underfoot, and the distant hum of the city never fades.",
  ];

  const options: PlayerOption[] = [
    {
      id: "street-alley-to-street-front",
      kind: "move",
      dir: "w",
      label: "Walk to the street front.",
      onSelect: () => goToScene("street-front"),
    },
    {
      id: "street-alley-to-alley-entrance",
      kind: "move",
      dir: "n",
      label: "Step north onto the sidewalk.",
      onSelect: () => goToScene("alley-entrance"),
    },
    {
      id: "street-front-to-sidewalk-south",
      kind: "move",
      dir: "s",
      label: "Step southonto the towards the laundromat.",
      onSelect: () => goToScene("laundromat-front"),
    },
  ];


  return (
    <BaseScene
      id="street-alley"
      title="Street Alley"
      background="/rooms/street-alley.jpg"
      description={description}
      options={options}
    />
  );
}
