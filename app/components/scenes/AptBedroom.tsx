// app/components/scenes/AptBedroom.tsx
"use client";

import BaseScene from "./BaseScene";
import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { getCatLocation } from "../../game/npcs/cat";
import { TIME } from "../../game/timeRules";
import type { PlayerOption } from "../OptionsContext";

export default function AptBedroom() {
  const { advanceTime, goToScene, timeMinutes, flags, setFlags, addItem, hasItem, pushMessage } = useLoopState();
  const { openExamine } = useExamine();

  const catHere = getCatLocation(timeMinutes) === "apt-bedroom";
  const showWakeText = !flags.hasWokenUp;
  const hasNotebook = hasItem("notebook");

  const startPosition = { x: 316, y: 590 }; // Center bottom of the bedroom

  // WALK mode actions
  const goLiving = () => {
    if (!flags.hasWokenUp) {
      setFlags((prev) => ({ ...prev, hasWokenUp: true }));
    }
    advanceTime(TIME.DEFAULT_ACTION);
    goToScene("apt-living");
  };

  // EXAMINE mode actions
  const examineWindow = () => {
    advanceTime(TIME.DEFAULT_ACTION);
    openExamine({
      id: "bedroom-window",
      title: "The Window",
      body: "Slotted blinds cut the morning light into hard stripes. Through the gaps, you see the street below—empty, waiting. The same view. Always the same view.",
    });
  };

  const examineBed = () => {
    advanceTime(TIME.DEFAULT_ACTION);
    openExamine({
      id: "bedroom-bed",
      title: "The Bed",
      body: "Sheets tangled from another restless loop. The pillow still holds the shape of your head. You've woken here so many times now, the creases in the fabric feel like a map of your failures.",
    });
  };

  const examineDesk = () => {
    advanceTime(TIME.DEFAULT_ACTION);
    openExamine({
      id: "bedroom-desk",
      title: "The Desk",
      body: "A cluttered surface: old receipts, a dead terminal, scattered pens. Everything frozen in the same arrangement. A notebook sits at the edge, waiting.",
    });
  };

  const examineCat = () => {
    advanceTime(TIME.DEFAULT_ACTION);
    openExamine({
      id: "cat-basic",
      title: "The Cat",
      body: "A gray cat lies curled in the stripes of light, blinking at you like it's watched this moment before. Its eyes track your movement with an unsettling patience.",
      image: "/sprites/cat-1.jpg",
    });
  };

  // TALK mode actions
  const talkToCat = () => {
    advanceTime(TIME.DEFAULT_ACTION);
    pushMessage("The cat stares at you silently. It doesn't respond, but you feel like it understands more than it should.");
  };

  // TAKE mode actions
  const takeNotebook = () => {
    advanceTime(TIME.DEFAULT_ACTION);
    addItem({
      id: "notebook",
      name: "Detective's Notebook",
      description: "A worn notebook for tracking clues and observations across loops.",
      icon: "📓",
    });
    pushMessage("You take the notebook. Its pages are blank, but you know they won't stay that way.");
  };

  const description: string[] = showWakeText
    ? [
        "You wake to the hum of cheap circuitry and pale slotted beams of light cutting across the room from the blinds.",
        "The Retinaband stutters to life, burning the time into your vision like it's done this before.",
      ]
    : [
        "Light spills through the slotted blinds in hard stripes, carving the room into quiet sections of shadow and glare.",
      ];

  if (catHere) {
    description.push("The cat is here—still, alert, watching you from the edge of the light.");
  }

  const options: PlayerOption[] = [
    // WALK mode - Movement
    {
      id: "bedroom-to-living",
      kind: "move",
      dir: "e",
      label: "Step into the living room.",
      onSelect: goLiving,
      modes: ["walk"],
      hotspot: { x: 580, y: 316, width: 60, height: 120 },
    },

    // EXAMINE mode - Inspect objects
    {
      id: "bedroom-examine-window",
      kind: "action",
      label: "Examine the window.",
      onSelect: examineWindow,
      modes: ["examine"],
      hotspot: { x: 120, y: 180, width: 100, height: 80 },
    },
    {
      id: "bedroom-examine-bed",
      kind: "action",
      label: "Examine the bed.",
      onSelect: examineBed,
      modes: ["examine"],
      hotspot: { x: 480, y: 420, width: 120, height: 80 },
    },
    {
      id: "bedroom-examine-desk",
      kind: "action",
      label: "Examine the desk.",
      onSelect: examineDesk,
      modes: ["examine"],
      hotspot: { x: 180, y: 380, width: 100, height: 80 },
    },
  ];

  // Cat-specific interactions
  if (catHere) {
    options.push(
      {
        id: "bedroom-examine-cat",
        kind: "action",
        label: "Examine the cat.",
        onSelect: examineCat,
        modes: ["examine"],
        hotspot: { x: 380, y: 280, width: 80, height: 60 },
      },
      {
        id: "bedroom-talk-cat",
        kind: "action",
        label: "Try to talk to the cat.",
        onSelect: talkToCat,
        modes: ["talk"],
        hotspot: { x: 380, y: 280, width: 80, height: 60 },
      }
    );
  }

  // TAKE mode - Collect items
  if (!hasNotebook) {
    options.push({
      id: "bedroom-take-notebook",
      kind: "action",
      label: "Take the notebook from the desk.",
      onSelect: takeNotebook,
      modes: ["take"],
      hotspot: { x: 180, y: 380, width: 60, height: 40 },
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
