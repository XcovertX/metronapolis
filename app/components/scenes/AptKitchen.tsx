// app/components/scenes/AptKitchen.tsx
"use client";

import { useLoopState } from "../LoopStateContext";

export default function AptKitchen() {
  const { advanceTime, goToScene } = useLoopState();

  return (
    <section>
      <h1>Apartment – Kitchen</h1>
      <p style={{ marginTop: "1rem" }}>
        The fridge hums like it&apos;s reconsidering staying alive. A half-empty
        mug sits by the sink. Someone scribbled something on the fridge door,
        and by someone you&apos;re pretty sure you mean you.
      </p>

      <h2 style={{ marginTop: "2rem" }}>What now?</h2>
      <button
        onClick={() => {
          advanceTime(5);
          goToScene("apt-living");
        }}
      >
        Head back to the living room.
      </button>
    </section>
  );
}
