// app/components/scenes/AptLiving.tsx
"use client";

import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { getCatLocation } from "../../game/cat";

export default function AptLiving() {
  const { advanceTime, goToScene, timeMinutes } = useLoopState();
  const { openExamine } = useExamine();

  const catHere = getCatLocation(timeMinutes) === "apt-living";

  const lookAtCat = () => {
    openExamine({
      id: "cat-basic",
      title: "The Cat",
      body:
        "The cat has claimed the couch as sovereign territory, tail flicking " +
        "in lazy arcs. It looks at you like you’re the intruder here.",
    });
  };

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

      <h2 style={{ marginTop: "2rem" }}>Where do you go?</h2>
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
            goToScene("apt-kitchen");
          }}
        >
          Check the kitchen.
        </button>
        <button
          onClick={() => {
            advanceTime(5);
            goToScene("lobby");
          }}
        >
          Leave the apartment and head to the lobby.
        </button>
        <button
          onClick={() => {
            advanceTime(5);
            goToScene("apt-bedroom");
          }}
        >
          Go back to the bedroom.
        </button>
        {catHere && (
          <button onClick={lookAtCat}>Look at the cat.</button>
        )}
      </div>
    </section>
  );
}
