// app/components/scenes/AptBedroom.tsx
"use client";

import { useLoopState } from "../LoopStateContext";
import { useExamine } from "../ExamineContext";
import { getCatLocation } from "../../game/cat";

export default function AptBedroom() {
  const { advanceTime, goToScene, timeMinutes } = useLoopState();
  const { openExamine } = useExamine();

  const catHere = getCatLocation(timeMinutes) === "apt-bedroom";

  const goToLiving = () => {
    advanceTime(5);
    goToScene("apt-living");
  };

  const lookAtCat = () => {
    openExamine({
      id: "cat-basic",
      title: "The Cat",
      body:
        "A gray cat is curled up on a pile of clothes that definitely " +
        "weren’t designed as a bed. One eye cracks open as you move, as if " +
        "it’s seen this exact morning more times than you have.",
    });
  };

  return (
    <section>
      <h1>Apartment – Bedroom</h1>
      <p style={{ marginTop: "1rem" }}>
        You wake up to the hum of cheap circuitry and the dull glow of the city
        bleeding through half-broken blinds. Same ceiling. Same crack in the
        plaster. Same feeling you&apos;ve done this before.
      </p>

      {catHere && (
        <p style={{ marginTop: "0.75rem" }}>
          The cat is here, a small gray shape collapsed on your clothes like it
          pays rent.
        </p>
      )}

      <p>
        The Retinaband in your eye boots up, burning the time into your vision.
      </p>

      <h2 style={{ marginTop: "2rem" }}>What do you do?</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 8,
        }}
      >
        <button onClick={goToLiving}>
          Get up and step into the living room.
        </button>
        {catHere && (
          <button onClick={lookAtCat}>Look at the cat.</button>
        )}
      </div>
    </section>
  );
}
