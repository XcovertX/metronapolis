// app/components/scenes/AptKitchen.tsx
"use client";

import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { getCatLocation } from "../../game/cat";

export default function AptKitchen() {
  const { advanceTime, goToScene, timeMinutes } = useLoopState();
  const { openExamine } = useExamine();

  const catHere = getCatLocation(timeMinutes) === "apt-kitchen";

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

      <h2 style={{ marginTop: "2rem" }}>What now?</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 8,
        }}
      >
        <button
          onClick={() => {
            advanceTime(5);
            goToScene("apt-living");
          }}
        >
          Head back to the living room.
        </button>
        {catHere && (
          <button onClick={lookAtCat}>Look at the cat.</button>
        )}
      </div>
    </section>
  );
}
