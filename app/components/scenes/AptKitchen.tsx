// app/components/scenes/AptKitchen.tsx
"use client";

import { useEffect } from "react";
import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { useOptions } from "../OptionsContext";
import { getCatLocation } from "../../game/npcs/cat";
import { TIME } from "@/app/game/timeRules";

export default function AptKitchen() {
  const { advanceTime, goToScene, timeMinutes } = useLoopState();
  const { openExamine } = useExamine();
  const { setOptions, clearOptions } = useOptions();

  const catHere = getCatLocation(timeMinutes) === "apt-kitchen";

  useEffect(() => {
    const toLiving = () => {
      advanceTime(TIME.DEFAULT_ACTION);
      goToScene("apt-living");
    };
    const lookAtCat = () => {
      openExamine({
        id: "cat-basic",
        title: "The Cat",
        body:
          "The cat is posted by the fridge like a tiny, judgmental sentinel. " +
          "Its ears twitch every time the compressor kicks, like it’s waiting " +
          "for the machine to cough up something better than what you usually eat.",
      });
    };

    const opts = [
      {
        id: "kitchen-living",
        label: "Head back to the living room.",
        onSelect: toLiving,
      },
      ...(catHere
        ? [
            {
              id: "kitchen-cat",
              label: "Look at the cat.",
              onSelect: lookAtCat,
            },
          ]
        : []),
    ];

    setOptions(opts);
    return () => clearOptions();
  }, [
    advanceTime,
    goToScene,
    openExamine,
    setOptions,
    clearOptions,
    catHere,
  ]);

  return (
    <section>
      <h1>Apartment – Kitchen</h1>
      <p style={{ marginTop: "1rem" }}>
        The fridge hums like it&apos;s reconsidering staying alive. A half-empty
        mug sits by the sink. Someone scribbled something on the fridge door,
        and by someone you&apos;re pretty sure you mean you.
      </p>

      {catHere && (
        <p style={{ marginTop: "0.75rem" }}>
          The cat loiters near the fridge, pretending it&apos;s here for the
          ambiance and not the possibility of food.
        </p>
      )}
    </section>
  );
}

