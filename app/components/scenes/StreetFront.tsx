// app/components/scenes/StreetFront.tsx
"use client";

import BaseScene from "./BaseScene";
import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { TIME } from "../../game/timeRules";
import type { PlayerOption } from "../OptionsContext";

export default function StreetFront() {
  const { advanceTime, goToScene, timeMinutes, flags, setFlags, pushMessage, hasItem, addItem } = useLoopState();
  const { openExamine } = useExamine();

  const hasCredits = hasItem("street-credits");
  const hour = Math.floor(timeMinutes / 60);
  const isNight = hour < 6 || hour >= 22;

  const description: string[] = [
    "The street stretches out before the building—cracked asphalt, faded paint, the hum of distant traffic.",
    "Neon signs flicker in storefront windows. The air tastes like exhaust and rain that hasn't fallen yet.",
  ];

  if (isNight) {
    description.push("The streetlights cast pools of sickly yellow light. Shadows move at the edges.");
  }

  // WALK mode actions
  const goToAlley = () => {
    advanceTime(TIME.DEFAULT_ACTION);
    goToScene("street-alley");
  };

  const goToSidewalk = () => {
    advanceTime(TIME.DEFAULT_ACTION);
    goToScene("sidewalk-south");
  };

  // EXAMINE mode actions
  const examineBuilding = () => {
    advanceTime(TIME.DEFAULT_ACTION);
    openExamine({
      id: "street-building",
      title: "The Building",
      body: "Your apartment building looms above—concrete and glass, weathered by decades of neglect. Fire escapes zigzag up the side like scars. You've lived here for... how long now? The loops make it hard to remember.",
    });
  };

  const examineStreet = () => {
    advanceTime(TIME.DEFAULT_ACTION);
    openExamine({
      id: "street-pavement",
      title: "The Street",
      body: "Cracked pavement, oil stains, cigarette butts. The same trash in the same places. You've memorized every crack, every stain. In some loops, you've tried counting them. You always lose track.",
    });
  };

  const examineNeonSigns = () => {
    advanceTime(TIME.DEFAULT_ACTION);
    openExamine({
      id: "street-neon",
      title: "Neon Signs",
      body: "Flickering advertisements for businesses that might not exist anymore. 'OPEN 24 HRS' but you've never seen anyone go in. 'BEST COFFEE IN METRO' but the place is always dark. The signs lie, but they're consistent liars.",
    });
  };

  const examineCar = () => {
    advanceTime(TIME.DEFAULT_ACTION);
    openExamine({
      id: "street-car",
      title: "Parked Car",
      body: "A beat-up sedan, covered in dust. The license plate is obscured. You've checked it before—in other loops. The car never moves. Sometimes you wonder if it's even real.",
    });
  };

  // TALK mode actions
  const talkToPasserby = () => {
    advanceTime(TIME.DEFAULT_ACTION);
    pushMessage("A figure walks past without acknowledging you. They never do. Not unless you know exactly when and where to intercept them.");
  };

  // TAKE mode actions
  const takeCredits = () => {
    advanceTime(TIME.DEFAULT_ACTION);
    addItem({
      id: "street-credits",
      name: "Loose Credits",
      description: "A few credit chips found on the street. Not much, but enough for a coffee.",
      icon: "💳",
    });
    pushMessage("You find a few credit chips near the gutter. Someone's loss, your gain.");
  };

  const options: PlayerOption[] = [
    // WALK mode - Movement
    {
      id: "street-front-to-street-alley",
      kind: "move",
      dir: "e",
      label: "Walk east toward the alley.",
      onSelect: goToAlley,
      modes: ["walk"],
    },
    {
      id: "street-front-to-sidewalk-south",
      kind: "move",
      dir: "n",
      label: "Walk north to the sidewalk.",
      onSelect: goToSidewalk,
      modes: ["walk"],
    },

    // EXAMINE mode - Inspect environment
    {
      id: "street-examine-building",
      kind: "action",
      label: "Examine your apartment building.",
      onSelect: examineBuilding,
      modes: ["examine"],
    },
    {
      id: "street-examine-street",
      kind: "action",
      label: "Examine the street pavement.",
      onSelect: examineStreet,
      modes: ["examine"],
    },
    {
      id: "street-examine-neon",
      kind: "action",
      label: "Examine the neon signs.",
      onSelect: examineNeonSigns,
      modes: ["examine"],
    },
    {
      id: "street-examine-car",
      kind: "action",
      label: "Examine the parked car.",
      onSelect: examineCar,
      modes: ["examine"],
    },

    // TALK mode - Attempt interaction
    {
      id: "street-talk-passerby",
      kind: "action",
      label: "Try to talk to a passerby.",
      onSelect: talkToPasserby,
      modes: ["talk"],
    },
  ];

  // TAKE mode - Conditional pickup
  if (!hasCredits) {
    options.push({
      id: "street-take-credits",
      kind: "action",
      label: "Pick up the credit chips near the gutter.",
      onSelect: takeCredits,
      modes: ["take"],
    });
  }

  return (
    <BaseScene
      id="street-front"
      title="Street — In Front of Building"
      background="/rooms/street-front.jpg"
      description={description}
      options={options}
      bgNative={{ w: 1920, h: 1080 }}
      spriteScale={1.0}
    />
  );
}
