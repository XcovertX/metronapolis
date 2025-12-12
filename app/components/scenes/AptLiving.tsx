// app/components/scenes/AptLiving.tsx
"use client";

import { useEffect } from "react";
import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { useOptions } from "../OptionsContext";
import { getCatLocation } from "../../game/cat";

export default function AptLiving() {
  const { advanceTime, goToScene, timeMinutes } = useLoopState();
  const { openExamine } = useExamine();
  const { setOptions, clearOptions } = useOptions();

  const catHere = getCatLocation(timeMinutes) === "apt-living";

  useEffect(() => {
    const toKitchen = () => {
      advanceTime(5);
      goToScene("apt-kitchen");
    };
    const toLobby = () => {
      advanceTime(5);
      goToScene("lobby");
    };
    const toBedroom = () => {
      advanceTime(5);
      goToScene("apt-bedroom");
    };
    const lookAtCat = () => {
      openExamine({
        id: "cat-basic",
        title: "The Cat",
        body:
          "The cat has claimed the couch as sovereign territory, tail flicking " +
          "in lazy arcs. It looks at you like you’re the intruder here.",
      });
    };

    const opts = [
      { id: "living-kitchen", label: "Check the kitchen.", onSelect: toKitchen },
      {
        id: "living-lobby",
        label: "Leave the apartment and head to the lobby.",
        onSelect: toLobby,
      },
      {
        id: "living-bedroom",
        label: "Go back to the bedroom.",
        onSelect: toBedroom,
      },
      ...(catHere
        ? [
            {
              id: "living-cat",
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
      <h1>Apartment – Living Room</h1>
      <p style={{ marginTop: "1rem" }}>
        The living room is a museum of bad decisions: unwashed cups, a dying
        holoscreen cycling static ads, a coat thrown over the back of a chair
        days ago or loops ago—you&apos;re not sure anymore.
      </p>

      {catHere && (
        <p style={{ marginTop: "0.75rem" }}>
          The cat is sprawled across the couch, occupying the exact spot you
          were probably aiming for.
        </p>
      )}
    </section>
  );
}
