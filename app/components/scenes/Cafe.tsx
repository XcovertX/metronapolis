// app/components/scenes/Cafe.tsx
"use client";

import { useLoopState } from "../LoopStateContext";

export default function Cafe() {
  const { advanceTime, goToScene } = useLoopState();

  return (
    <section>
      <h1>Corner Café</h1>
      <p style={{ marginTop: "1rem" }}>
        The café&apos;s windows glow warm against the cold street. Inside,
        people queue for caffeine and cheap pastries, unaware of how replaceable
        this moment feels to you.
      </p>

      <h2 style={{ marginTop: "2rem" }}>What do you do?</h2>
      <button
        onClick={() => {
          advanceTime(5);
          goToScene("street");
        }}
      >
        Leave and head back to the street.
      </button>
    </section>
  );
}
